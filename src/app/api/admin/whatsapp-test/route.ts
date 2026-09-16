import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWhatsAppConfig, sendWhatsAppMessage } from "@/lib/whatsapp";
import { formatPhone } from "@/lib/utils";

/* POST /api/admin/whatsapp-test — envia mensagem de teste */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { phone } = await req.json();
  if (!phone) {
    return NextResponse.json({ error: "Informe um número de telefone." }, { status: 400 });
  }

  const cfg = await getWhatsAppConfig();

  // Para Meta, faz a chamada diretamente e retorna o erro exato
  if (cfg.provider === "meta") {
    if (!cfg.metaPhoneId || !cfg.metaToken) {
      return NextResponse.json({
        error: "Phone Number ID ou Access Token não configurados. Preencha os campos acima e salve.",
      }, { status: 400 });
    }

    const to = formatPhone(phone).replace(/\D/g, "");
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${cfg.metaPhoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.metaToken}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: `✅ *Teste — Triade Select*\n\nNotificações funcionando! 🎉` },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      const metaMsg = err?.error?.message ?? err?.error?.error_data?.details ?? JSON.stringify(err);
      const code = err?.error?.code;
      const subcode = err?.error?.error_subcode;

      let hint = "";
      if (code === 190) hint = "⚠️ Token expirado ou inválido. Gere um novo token no Meta Business Suite → System Users.";
      else if (code === 131030 || subcode === 131030) hint = "⚠️ Número de destino não tem WhatsApp. Verifique o número informado.";
      else if (code === 131047) hint = "⚠️ Número ainda não verificado ou em processo de migração no Meta Business Manager.";
      else if (code === 100 && metaMsg?.includes("phone_number_id")) hint = "⚠️ Phone Number ID inválido. Copie o ID correto em Meta → WhatsApp → Configuração da API.";
      else if (res.status === 401) hint = "⚠️ Token não autorizado. Verifique se o token tem permissão 'whatsapp_business_messaging'.";

      return NextResponse.json({
        error: `Meta API (${res.status}): ${metaMsg}${hint ? `\n\n${hint}` : ""}`,
        code,
        _raw: err,
      }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  }

  // Para outros provedores, usa a função genérica
  const ok = await sendWhatsAppMessage(
    phone,
    `✅ *Teste de notificação — Triade Select*\n\nSe você recebeu esta mensagem, as notificações estão funcionando corretamente! 🎉`
  );

  if (!ok) {
    return NextResponse.json({
      error: "Falha ao enviar. Verifique as credenciais e se o WhatsApp está conectado.",
      _raw: { provider: cfg.provider, instance: (cfg as any).evoInstance },
    }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

/* GET /api/admin/whatsapp-test — diagnóstico do número Meta */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const cfg = await getWhatsAppConfig();

  if (cfg.provider !== "meta") {
    return NextResponse.json({ error: "Diagnóstico disponível apenas para Meta." }, { status: 400 });
  }
  if (!cfg.metaPhoneId || !cfg.metaToken) {
    return NextResponse.json({ error: "Phone Number ID ou Token não configurados." }, { status: 400 });
  }

  const res = await fetch(
    `https://graph.facebook.com/v20.0/${cfg.metaPhoneId}?fields=id,display_phone_number,verified_name,quality_rating,status,name_status`,
    { headers: { Authorization: `Bearer ${cfg.metaToken}` } }
  );

  const data = await res.json() as any;

  if (!res.ok) {
    const msg = data?.error?.message ?? JSON.stringify(data);
    const code = data?.error?.code;
    let hint = "";
    if (code === 190) hint = "Token expirado. Gere um novo em Meta Business Suite → System Users.";
    else if (code === 100) hint = "Phone Number ID inválido. Copie o ID correto de Meta → WhatsApp → Configuração da API.";
    return NextResponse.json({ error: msg, hint, code, _raw: data }, { status: 502 });
  }

  return NextResponse.json({
    phoneNumberId: data.id,
    displayPhone: data.display_phone_number,
    verifiedName: data.verified_name,
    qualityRating: data.quality_rating,
    status: data.status,
    nameStatus: data.name_status,
  });
}
