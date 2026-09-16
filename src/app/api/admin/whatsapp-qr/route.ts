import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWhatsAppConfig } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

/* ─────────────────────────────────────────────
   GET — verifica status / retorna QR code
   Fluxo:
   1. Lista instâncias (valida credenciais)
   2. Se a instância não existe → cria
   3. Se existe mas desconectada → pede QR
   4. Se conectada → retorna connected
───────────────────────────────────────────── */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const cfg = await getWhatsAppConfig();

  if (cfg.provider !== "evolution") {
    return NextResponse.json({ error: "Apenas disponível para Evolution API." }, { status: 400 });
  }
  if (!cfg.evoBaseUrl) {
    return NextResponse.json({ error: "URL da Evolution API não configurada." }, { status: 400 });
  }
  if (!cfg.evoApiKey) {
    return NextResponse.json({ error: "API Key não configurada." }, { status: 400 });
  }

  const base = cfg.evoBaseUrl.replace(/\/$/, "");
  const instance = cfg.evoInstance ?? "triade-select";
  const headers = { apikey: cfg.evoApiKey, "Content-Type": "application/json" };

  try {
    /* ── 1. Lista instâncias para validar credenciais ── */
    const listRes = await fetch(`${base}/instance/fetchInstances`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });

    if (listRes.status === 401 || listRes.status === 403) {
      return NextResponse.json(
        { error: "API Key inválida. Verifique a variável AUTHENTICATION_API_KEY no Render e atualize o campo 'API Key' aqui." },
        { status: 502 }
      );
    }

    if (!listRes.ok) {
      const body = await listRes.text().catch(() => "");
      return NextResponse.json(
        { error: `Evolution API inacessível (${listRes.status}). Verifique se a URL está correta e o serviço está no ar. Resposta: ${body.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const listData = await listRes.json();
    // listData pode ser array ou { instances: [] }
    const instances: any[] = Array.isArray(listData) ? listData : (listData?.instances ?? []);

    /* ── 2. Verifica se a instância já existe ── */
    const existing = instances.find(
      (i: any) =>
        i?.instance?.instanceName === instance ||
        i?.instanceName === instance ||
        i?.name === instance
    );

    if (!existing) {
      /* ── 2a. Limpa instância corrompida (se existir) e cria nova ── */
      // Tenta deletar instância quebrada antes de criar (idempotente — ignora erros)
      await fetch(`${base}/instance/delete/${instance}`, {
        method: "DELETE",
        headers,
        signal: AbortSignal.timeout(5_000),
      }).catch(() => {});

      await new Promise((r) => setTimeout(r, 1000));

      const createRes = await fetch(`${base}/instance/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({ instanceName: instance, qrcode: true, integration: "WHATSAPP-BAILEYS" }),
        signal: AbortSignal.timeout(15_000),
      });

      if (createRes.ok) {
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        const d = await createRes.json().catch(() => ({}));
        console.warn("[whatsapp-qr] Criação falhou após limpeza:", JSON.stringify(d));
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    /* ── 3. Verifica estado de conexão ── */
    const stateRes = await fetch(`${base}/instance/connectionState/${instance}`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });

    if (stateRes.ok) {
      const stateData = await stateRes.json();
      const state =
        stateData?.instance?.state ??
        stateData?.state ??
        stateData?.connectionState ??
        "unknown";

      if (state === "open") {
        return NextResponse.json({ status: "connected" });
      }
    }

    /* ── 4. Busca QR code ── */
    const qrRes = await fetch(`${base}/instance/connect/${instance}`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });

    if (!qrRes.ok) {
      const body = await qrRes.text().catch(() => "");
      return NextResponse.json(
        { error: `Erro ao buscar QR Code (${qrRes.status}): ${body.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const qrData = await qrRes.json();
    console.log("[whatsapp-qr] connect response:", JSON.stringify(qrData).slice(0, 500));
    const qrCode =
      qrData?.code ??
      qrData?.qrcode?.code ??
      qrData?.base64 ??
      qrData?.qrcode?.base64 ??
      qrData?.instance?.qrcode?.base64 ??
      qrData?.instance?.qrcode?.code ??
      qrData?.instance?.code ??
      qrData?.instance?.base64 ??
      qrData?.pairingCode ??
      qrData?.instance?.pairingCode ??
      null;

    return NextResponse.json({ status: "disconnected", qrCode });

  } catch (err: any) {
    console.error("[whatsapp-qr GET]", err);
    const isTimeout = err?.name === "TimeoutError" || err?.code === "ABORT_ERR";
    return NextResponse.json(
      {
        error: isTimeout
          ? `Timeout — servidor não respondeu em 10s. URL: ${base}`
          : `Erro de rede: ${err?.message ?? "desconhecido"}`,
      },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────────
   PUT — retorna pairing code (alternativa ao QR)
───────────────────────────────────────────── */
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const cfg = await getWhatsAppConfig();
  if (cfg.provider !== "evolution" || !cfg.evoBaseUrl || !cfg.evoApiKey) {
    return NextResponse.json({ error: "Evolution API não configurada." }, { status: 400 });
  }

  const { phoneNumber } = await req.json().catch(() => ({}));
  if (!phoneNumber) {
    return NextResponse.json({ error: "Número de telefone obrigatório." }, { status: 400 });
  }

  const base = cfg.evoBaseUrl.replace(/\/$/, "");
  const instance = cfg.evoInstance ?? "triade-select";
  const headers = { apikey: cfg.evoApiKey, "Content-Type": "application/json" };

  try {
    const res = await fetch(`${base}/instance/pairingCode/${instance}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ phoneNumber }),
      signal: AbortSignal.timeout(15_000),
    });

    const data = await res.json().catch(() => ({}));
    console.log("[whatsapp-pairing] response:", JSON.stringify(data).slice(0, 300));

    if (!res.ok) {
      return NextResponse.json(
        { error: `Erro ao obter código de pareamento (${res.status}): ${JSON.stringify(data).slice(0, 200)}` },
        { status: 502 }
      );
    }

    const pairingCode =
      data?.pairingCode ??
      data?.pairing_code ??
      data?.code ??
      null;

    return NextResponse.json({ pairingCode });
  } catch (err: any) {
    const isTimeout = err?.name === "TimeoutError" || err?.code === "ABORT_ERR";
    return NextResponse.json(
      { error: isTimeout ? "Timeout ao obter código de pareamento." : `Erro: ${err?.message ?? "desconhecido"}` },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────────
   POST — cria instância (chamado pelo botão
   "Gerar QR Code" antes do polling)
───────────────────────────────────────────── */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const cfg = await getWhatsAppConfig();
  if (cfg.provider !== "evolution" || !cfg.evoBaseUrl || !cfg.evoApiKey) {
    return NextResponse.json({ error: "Evolution API não configurada." }, { status: 400 });
  }

  const base = cfg.evoBaseUrl.replace(/\/$/, "");
  const instance = cfg.evoInstance ?? "triade-select";
  const headers = { apikey: cfg.evoApiKey, "Content-Type": "application/json" };

  try {
    const res = await fetch(`${base}/instance/create`, {
      method: "POST",
      headers,
      body: JSON.stringify({ instanceName: instance, qrcode: true, integration: "WHATSAPP-BAILEYS" }),
      signal: AbortSignal.timeout(15_000),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const dText = JSON.stringify(data).toLowerCase();
      // Trata qualquer falha de criação como "instância já existe" — o polling do GET vai buscar o QR
      if (res.status === 409 || dText.includes("already") || res.status === 403 || res.status === 400) {
        return NextResponse.json({ created: false, message: "Instância já existe." });
      }
      return NextResponse.json(
        { error: `Falha ao criar instância: ${JSON.stringify(data).slice(0, 200)}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ created: true, data });
  } catch (err: any) {
    console.error("[whatsapp-qr POST]", err);
    return NextResponse.json(
      { error: `Erro ao criar instância: ${err?.message ?? "desconhecido"}` },
      { status: 500 }
    );
  }
}
