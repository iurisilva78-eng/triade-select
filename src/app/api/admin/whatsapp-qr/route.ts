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

  if (!cfg.evoBaseUrl || !cfg.evoInstance || !cfg.evoApiKey) {
    return NextResponse.json({ error: "Evolution API não configurada." }, { status: 400 });
  }

  // Verifica status da conexão
  try {
    const stateRes = await fetch(
      `${cfg.evoBaseUrl}/instance/connectionState/${cfg.evoInstance}`,
      { headers: { apikey: cfg.evoApiKey } }
    );

    if (stateRes.ok) {
      const stateData = await stateRes.json();
      const state = stateData?.instance?.state ?? stateData?.state ?? "unknown";

      if (state === "open") {
        return NextResponse.json({ status: "connected" });
      }
    }

    // Não conectado — busca QR code
    const qrRes = await fetch(
      `${cfg.evoBaseUrl}/instance/connect/${cfg.evoInstance}`,
      { headers: { apikey: cfg.evoApiKey } }
    );

    if (!qrRes.ok) {
      return NextResponse.json({ error: `Erro ao buscar QR: ${qrRes.status}` }, { status: 502 });
    }

    const qrData = await qrRes.json();
    const qrCode = qrData?.code ?? qrData?.qrcode?.code ?? qrData?.base64 ?? null;

    return NextResponse.json({ status: "disconnected", qrCode });
  } catch (err) {
    console.error("[whatsapp-qr]", err);
    return NextResponse.json({ error: "Erro ao verificar conexão." }, { status: 500 });
  }
}

// Criar instância (chamado pelo admin ao configurar pela primeira vez)
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const cfg = await getWhatsAppConfig();

  if (cfg.provider !== "evolution" || !cfg.evoBaseUrl || !cfg.evoInstance || !cfg.evoApiKey) {
    return NextResponse.json({ error: "Evolution API não configurada." }, { status: 400 });
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
    });

    const data = await res.json();

    if (!res.ok) {
      // Instância já existe — tudo certo
      if (data?.message?.includes("already") || res.status === 409) {
        return NextResponse.json({ created: false, message: "Instância já existe." });
      }
      return NextResponse.json({ error: data?.message ?? "Erro ao criar instância." }, { status: 502 });
    }

    return NextResponse.json({ created: true, data });
  } catch (err) {
    console.error("[whatsapp-qr POST]", err);
    return NextResponse.json({ error: "Erro ao criar instância." }, { status: 500 });
  }
}
