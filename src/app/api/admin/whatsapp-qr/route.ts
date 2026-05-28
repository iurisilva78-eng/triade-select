import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWhatsAppConfig } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

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
    return NextResponse.json({ error: "URL da Evolution API não configurada. Preencha o campo 'URL base' e salve." }, { status: 400 });
  }
  if (!cfg.evoApiKey) {
    return NextResponse.json({ error: "API Key da Evolution API não configurada. Preencha o campo 'API Key' e salve." }, { status: 400 });
  }
  if (!cfg.evoInstance) {
    return NextResponse.json({ error: "Nome da instância não configurado." }, { status: 400 });
  }

  // Verifica status da conexão
  try {
    const stateRes = await fetch(
      `${cfg.evoBaseUrl}/instance/connectionState/${cfg.evoInstance}`,
      {
        headers: { apikey: cfg.evoApiKey },
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (stateRes.ok) {
      const stateData = await stateRes.json();
      const state = stateData?.instance?.state ?? stateData?.state ?? "unknown";

      if (state === "open") {
        return NextResponse.json({ status: "connected" });
      }
    } else if (stateRes.status === 401 || stateRes.status === 403) {
      return NextResponse.json(
        { error: "API Key inválida ou sem permissão. Verifique a AUTHENTICATION_API_KEY da instância no Railway." },
        { status: 502 }
      );
    } else if (stateRes.status === 404) {
      // Instância ainda não existe — vai criar via POST e pedir QR
    } else {
      const body = await stateRes.text().catch(() => "");
      return NextResponse.json(
        { error: `Evolution API retornou ${stateRes.status}. Resposta: ${body.slice(0, 200)}` },
        { status: 502 }
      );
    }

    // Não conectado — busca QR code via /instance/connect
    const qrRes = await fetch(
      `${cfg.evoBaseUrl}/instance/connect/${cfg.evoInstance}`,
      {
        headers: { apikey: cfg.evoApiKey },
        signal: AbortSignal.timeout(15_000),
      }
    );

    if (!qrRes.ok) {
      const body = await qrRes.text().catch(() => "");
      let hint = "";
      if (qrRes.status === 404) hint = " A instância pode não existir ainda — clique em 'Gerar QR Code' para criá-la.";
      if (qrRes.status === 401 || qrRes.status === 403) hint = " API Key inválida.";
      return NextResponse.json(
        { error: `Erro ${qrRes.status} ao buscar QR Code.${hint} Detalhe: ${body.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const qrData = await qrRes.json();
    // Evolution API v1/v2 retorna o QR em campos diferentes
    const qrCode =
      qrData?.code ??
      qrData?.qrcode?.code ??
      qrData?.base64 ??
      qrData?.qrcode?.base64 ??
      null;

    return NextResponse.json({ status: "disconnected", qrCode });
  } catch (err: any) {
    console.error("[whatsapp-qr GET]", err);
    const isTimeout = err?.name === "TimeoutError" || err?.code === "ABORT_ERR";
    return NextResponse.json(
      {
        error: isTimeout
          ? `Timeout ao contatar ${cfg.evoBaseUrl}. Verifique se a URL está correta e o serviço está no ar.`
          : `Erro de rede: ${err?.message ?? "Desconhecido"}. URL: ${cfg.evoBaseUrl}`,
      },
      { status: 500 }
    );
  }
}

// Criar instância (chamado pelo admin ao clicar em "Gerar QR Code")
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const cfg = await getWhatsAppConfig();

  if (cfg.provider !== "evolution" || !cfg.evoBaseUrl || !cfg.evoInstance || !cfg.evoApiKey) {
    return NextResponse.json(
      { error: "Evolution API não configurada. Preencha URL, instância e API Key antes de gerar o QR Code." },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${cfg.evoBaseUrl}/instance/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: cfg.evoApiKey },
      body: JSON.stringify({
        instanceName: cfg.evoInstance,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Instância já existe — tudo certo, segue para checkStatus
      const msg = data?.message ?? "";
      if (msg.includes("already") || res.status === 409) {
        return NextResponse.json({ created: false, message: "Instância já existe." });
      }
      return NextResponse.json(
        { error: data?.message ?? `Erro ${res.status} ao criar instância na Evolution API.` },
        { status: 502 }
      );
    }

    return NextResponse.json({ created: true, data });
  } catch (err: any) {
    console.error("[whatsapp-qr POST]", err);
    const isTimeout = err?.name === "TimeoutError" || err?.code === "ABORT_ERR";
    return NextResponse.json(
      { error: isTimeout ? "Timeout ao criar instância. Verifique a URL da Evolution API." : `Erro: ${err?.message}` },
      { status: 500 }
    );
  }
}
