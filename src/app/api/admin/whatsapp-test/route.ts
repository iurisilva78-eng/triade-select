import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { phone } = await req.json();
  if (!phone) {
    return NextResponse.json({ error: "Informe um número de telefone." }, { status: 400 });
  }

  const ok = await sendWhatsAppMessage(
    phone,
    `✅ *Teste de notificação — Triade Select*\n\nSe você recebeu esta mensagem, as notificações estão funcionando corretamente! 🎉`
  );

  if (!ok) {
    return NextResponse.json({
      error: "Falha ao enviar. Verifique se a URL da API e o token estão corretos e se o WhatsApp está conectado.",
    }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
