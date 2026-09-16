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
      /* ── 2a. Cria a instância ── */
      const createBody: Record<string, any> = {
        instanceName: instance,
        qrcode: true,
      };

      // Tenta detectar versão: v2 usa integration, v1 não usa
      const isV2 = base.includes("v2") || (instances[0] && "integration" in (instances[0]?.instance ?? {}));
      if (isV2) createBody.integration = "WHATSAPP-BAILEYS";

      const createRes = await fetch(`${base}/instance/create`, {
        method: "POST",
        headers,
        body: JSON.stringify(createBody),
        signal: AbortSignal.timeout(15_000),
      });

      if (!createRes.ok) {
        const d = await createRes.json().catch(() => ({}));
        // Ignora "já existe" (409 ou message contendo "already")
        if (createRes.status !== 409 && !String(d?.message ?? "").includes("already")) {
          // Segunda tentativa: sem o campo integration
          if (isV2) {
            const retry = await fetch(`${base}/instance/create`, {
              method: "POST",
              headers,
              body: JSON.stringify({ instanceName: instance, qrcode: true }),
              signal: AbortSignal.timeout(15_000),
            });
            if (!retry.ok) {
              const rd = await retry.json().catch(() => ({}));
              return NextResponse.json(
                { error: `Não foi possível criar a instância "${instance}". Resposta da API: ${rd?.message ?? JSON.stringify(rd).slice(0, 200)}` },
                { status: 502 }
              );
            }
          } else {
            return NextResponse.json(
              { error: `Não foi possível criar a instância "${instance}". Resposta da API: ${d?.message ?? JSON.stringify(d).slice(0, 200)}` },
              { status: 502 }
            );
          }
        }
      }

      // Aguarda instância ficar pronta
      await new Promise((r) => setTimeout(r, 2000));
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
    const qrCode =
      qrData?.code ??
      qrData?.qrcode?.code ??
      qrData?.base64 ??
      qrData?.qrcode?.base64 ??
      qrData?.pairingCode ??
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
      if (res.status === 409 || String(data?.message ?? "").includes("already")) {
        return NextResponse.json({ created: false, message: "Instância já existe." });
      }
      // Tenta sem integration field
      const retry = await fetch(`${base}/instance/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({ instanceName: instance, qrcode: true }),
        signal: AbortSignal.timeout(15_000),
      });
      const rd = await retry.json().catch(() => ({}));
      if (!retry.ok && retry.status !== 409 && !String(rd?.message ?? "").includes("already")) {
        return NextResponse.json(
          { error: `Falha ao criar instância: ${rd?.message ?? JSON.stringify(rd).slice(0, 200)}` },
          { status: 502 }
        );
      }
      return NextResponse.json({ created: true });
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
