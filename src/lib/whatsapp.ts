import { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_LABELS } from "@/types";
import { formatCurrency, formatPhone } from "./utils";

const STATUS_EMOJI: Record<OrderStatus, string> = {
  RECEBIDO: "📋",
  ACEITO: "✅",
  EM_PRODUCAO: "⚙️",
  ENVIADO: "📦",
  ENTREGUE: "🎉",
  CANCELADO: "❌",
};

function buildMessage(
  type: "new_order" | "status_update" | "shipped" | "delivered",
  data: {
    customerName: string;
    orderNumber: string;
    status?: OrderStatus;
    trackingCode?: string;
    total?: number;
    minimumPayment?: number;
  }
): string {
  const { customerName, orderNumber, status, trackingCode, total, minimumPayment } = data;

  if (type === "new_order") {
    return (
      `Olá, *${customerName}*! 👋\n\n` +
      `Seu pedido *#${orderNumber}* foi recebido com sucesso! 📋\n\n` +
      `💰 *Total:* ${formatCurrency(total!)}\n` +
      `💳 *Mínimo para iniciar produção (50%):* ${formatCurrency(minimumPayment!)}\n\n` +
      `Assim que confirmarmos o pagamento, sua produção começa!\n` +
      `Prazo médio: *15 dias úteis* após início da produção.\n\n` +
      `Qualquer dúvida, estamos aqui! 😊\n` +
      `— *Triade Select*`
    );
  }

  if (type === "status_update" && status) {
    const emoji = STATUS_EMOJI[status];
    const label = ORDER_STATUS_LABELS[status];
    return (
      `Olá, *${customerName}*! ${emoji}\n\n` +
      `Atualização do seu pedido *#${orderNumber}*:\n\n` +
      `*Status atual:* ${label}\n\n` +
      (status === "EM_PRODUCAO"
        ? `Sua encomenda já está sendo produzida com carinho! 🧵\n\n`
        : "") +
      `Acompanhe pelo nosso sistema.\n` +
      `— *Triade Select*`
    );
  }

  if (type === "shipped") {
    return (
      `Olá, *${customerName}*! 📦\n\n` +
      `Seu pedido *#${orderNumber}* foi enviado!\n\n` +
      `🔍 *Código de rastreio:* ${trackingCode}\n` +
      `Rastreie em: rastreamento.correios.com.br\n\n` +
      `Em breve chegará na sua barbearia! ✂️\n` +
      `— *Triade Select*`
    );
  }

  if (type === "delivered") {
    return (
      `Olá, *${customerName}*! 🎉\n\n` +
      `Seu pedido *#${orderNumber}* foi entregue!\n\n` +
      `Esperamos que você e sua equipe amem os produtos! 💪\n` +
      `Deixe seu feedback — ele é muito importante pra nós.\n\n` +
      `Obrigado pela confiança! 🙏\n` +
      `— *Triade Select*`
    );
  }

  return "";
}

function getApiBase(): string {
  const url = process.env.WHATSAPP_API_URL ?? "";
  // Remove o endpoint final (ex: /send-text) para obter a base
  return url.replace(/\/[^/]+$/, "");
}

export async function sendWhatsAppMessage(
  phone: string,
  message: string,
  options?: { raw?: boolean } // raw=true pula o formatPhone (para IDs de grupo)
): Promise<boolean> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const clientToken = process.env.WHATSAPP_CLIENT_TOKEN;
  if (!apiUrl) {
    console.warn("WHATSAPP_API_URL não configurado");
    return false;
  }

  try {
    const formattedPhone = options?.raw ? phone : formatPhone(phone);
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(clientToken ? { "Client-Token": clientToken } : {}),
      },
      body: JSON.stringify({ phone: formattedPhone, message }),
    });
    return res.ok;
  } catch (err) {
    console.error("Erro ao enviar WhatsApp:", err);
    return false;
  }
}

// Envia mensagem de texto para um grupo do Z-API
export async function sendWhatsAppGroupMessage(
  groupId: string,
  message: string
): Promise<boolean> {
  return sendWhatsAppMessage(groupId, message, { raw: true });
}

// Envia imagem com legenda (usado para preview da logo)
export async function sendWhatsAppImageMessage(
  phone: string,
  imageUrl: string,
  caption: string,
  options?: { raw?: boolean }
): Promise<boolean> {
  const clientToken = process.env.WHATSAPP_CLIENT_TOKEN;
  const base = getApiBase();
  if (!base) {
    console.warn("WHATSAPP_API_URL não configurado");
    return false;
  }

  const imageEndpoint = `${base}/send-image`;
  const formattedPhone = options?.raw ? phone : formatPhone(phone);

  try {
    const res = await fetch(imageEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(clientToken ? { "Client-Token": clientToken } : {}),
      },
      body: JSON.stringify({ phone: formattedPhone, image: imageUrl, caption }),
    });
    return res.ok;
  } catch (err) {
    console.error("Erro ao enviar imagem WhatsApp:", err);
    return false;
  }
}

export async function notifyOrderCreated(
  phone: string,
  customerName: string,
  orderNumber: string,
  total: number
) {
  const message = buildMessage("new_order", {
    customerName,
    orderNumber,
    total,
    minimumPayment: total * 0.5,
  });
  return sendWhatsAppMessage(phone, message);
}

export async function notifyStatusUpdate(
  phone: string,
  customerName: string,
  orderNumber: string,
  status: OrderStatus
) {
  const message = buildMessage("status_update", {
    customerName,
    orderNumber,
    status,
  });
  return sendWhatsAppMessage(phone, message);
}

export async function notifyShipped(
  phone: string,
  customerName: string,
  orderNumber: string,
  trackingCode: string
) {
  const message = buildMessage("shipped", {
    customerName,
    orderNumber,
    trackingCode,
  });
  return sendWhatsAppMessage(phone, message);
}

export async function notifyDelivered(
  phone: string,
  customerName: string,
  orderNumber: string
) {
  const message = buildMessage("delivered", { customerName, orderNumber });
  return sendWhatsAppMessage(phone, message);
}
