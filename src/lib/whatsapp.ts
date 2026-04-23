import { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_LABELS } from "@/types";
import { formatCurrency, formatPhone } from "./utils";
import { prisma } from "./prisma";

const STATUS_EMOJI: Record<OrderStatus, string> = {
  RECEBIDO: "📋", ACEITO: "✅", EM_PRODUCAO: "⚙️",
  ENVIADO: "📦", ENTREGUE: "🎉", CANCELADO: "❌",
};

/* ─────────────────────────────────────────────────
   Config — lê do banco (com fallback para env vars)
───────────────────────────────────────────────── */
export type WhatsAppProvider = "zapi" | "evolution";

export interface WhatsAppConfig {
  provider: WhatsAppProvider;
  // Z-API
  zapiUrl?: string;
  zapiClientToken?: string;
  // Evolution API
  evoBaseUrl?: string;
  evoInstance?: string;
  evoApiKey?: string;
}

export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  // Tenta env vars primeiro (compatibilidade legada)
  const envUrl = process.env.WHATSAPP_API_URL?.trim();
  const envToken = process.env.WHATSAPP_CLIENT_TOKEN?.trim();

  try {
    const rows = await prisma.siteConfig.findMany({
      where: {
        key: {
          in: [
            "whatsapp_provider",
            "whatsapp_api_url", "whatsapp_client_token",
            "whatsapp_evo_base_url", "whatsapp_evo_instance", "whatsapp_evo_api_key",
          ],
        },
      },
    });

    const get = (key: string) => rows.find((r) => r.key === key)?.value?.trim() ?? "";

    const provider = (get("whatsapp_provider") || "zapi") as WhatsAppProvider;

    if (provider === "evolution") {
      return {
        provider: "evolution",
        evoBaseUrl: get("whatsapp_evo_base_url"),
        evoInstance: get("whatsapp_evo_instance"),
        evoApiKey: get("whatsapp_evo_api_key"),
      };
    }

    // Z-API (padrão)
    return {
      provider: "zapi",
      zapiUrl: get("whatsapp_api_url") || envUrl || "",
      zapiClientToken: get("whatsapp_client_token") || envToken || "",
    };
  } catch {
    return {
      provider: "zapi",
      zapiUrl: envUrl ?? "",
      zapiClientToken: envToken ?? "",
    };
  }
}

/* ─────────────────────────────────────────────────
   Envio de mensagem de texto
───────────────────────────────────────────────── */
export async function sendWhatsAppMessage(
  phone: string,
  message: string,
  options?: { raw?: boolean }
): Promise<boolean> {
  const cfg = await getWhatsAppConfig();

  if (cfg.provider === "evolution") {
    if (!cfg.evoBaseUrl || !cfg.evoInstance || !cfg.evoApiKey) {
      console.warn("[WhatsApp] Evolution API não configurada.");
      return false;
    }
    try {
      const number = options?.raw ? phone : formatPhone(phone);
      const res = await fetch(`${cfg.evoBaseUrl}/message/sendText/${cfg.evoInstance}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: cfg.evoApiKey },
        body: JSON.stringify({ number, text: message }),
      });
      if (!res.ok) console.error("[WhatsApp/Evolution] Erro:", res.status, await res.text());
      return res.ok;
    } catch (err) {
      console.error("[WhatsApp/Evolution] Falha:", err);
      return false;
    }
  }

  // Z-API
  if (!cfg.zapiUrl) {
    console.warn("[WhatsApp/ZAPI] API URL não configurada.");
    return false;
  }
  try {
    const formattedPhone = options?.raw ? phone : formatPhone(phone);
    const res = await fetch(cfg.zapiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.zapiClientToken ? { "Client-Token": cfg.zapiClientToken } : {}),
      },
      body: JSON.stringify({ phone: formattedPhone, message }),
    });
    if (!res.ok) console.error("[WhatsApp/ZAPI] Erro:", res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error("[WhatsApp/ZAPI] Falha:", err);
    return false;
  }
}

/* ─────────────────────────────────────────────────
   Envio de imagem
───────────────────────────────────────────────── */
export async function sendWhatsAppImageMessage(
  phone: string,
  imageUrl: string,
  caption: string,
  options?: { raw?: boolean }
): Promise<boolean> {
  const cfg = await getWhatsAppConfig();

  if (cfg.provider === "evolution") {
    if (!cfg.evoBaseUrl || !cfg.evoInstance || !cfg.evoApiKey) return false;
    try {
      const number = options?.raw ? phone : formatPhone(phone);
      const res = await fetch(`${cfg.evoBaseUrl}/message/sendMedia/${cfg.evoInstance}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: cfg.evoApiKey },
        body: JSON.stringify({ number, mediatype: "image", media: imageUrl, caption }),
      });
      return res.ok;
    } catch { return false; }
  }

  // Z-API
  if (!cfg.zapiUrl) return false;
  const base = cfg.zapiUrl.replace(/\/[^/]+$/, "");
  try {
    const formattedPhone = options?.raw ? phone : formatPhone(phone);
    const res = await fetch(`${base}/send-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cfg.zapiClientToken ? { "Client-Token": cfg.zapiClientToken } : {}),
      },
      body: JSON.stringify({ phone: formattedPhone, image: imageUrl, caption }),
    });
    return res.ok;
  } catch { return false; }
}

/* ─────────────────────────────────────────────────
   Grupo
───────────────────────────────────────────────── */
export async function sendWhatsAppGroupMessage(groupId: string, message: string): Promise<boolean> {
  return sendWhatsAppMessage(groupId, message, { raw: true });
}

/* ─────────────────────────────────────────────────
   Mensagens de negócio
───────────────────────────────────────────────── */
function buildMessage(
  type: "new_order" | "status_update" | "shipped" | "delivered",
  data: { customerName: string; orderNumber: string; status?: OrderStatus; trackingCode?: string; total?: number; minimumPayment?: number }
): string {
  const { customerName, orderNumber, status, trackingCode, total, minimumPayment } = data;

  if (type === "new_order") return (
    `Olá, *${customerName}*! 👋\n\n` +
    `Seu pedido *#${orderNumber}* foi recebido! 📋\n\n` +
    `💰 *Total:* ${formatCurrency(total!)}\n` +
    `💳 *Mínimo para produção (50%):* ${formatCurrency(minimumPayment!)}\n\n` +
    `Assim que confirmarmos o pagamento, sua produção começa!\nPrazo: *~15 dias úteis*.\n\n` +
    `— *Triade Select*`
  );

  if (type === "status_update" && status) return (
    `Olá, *${customerName}*! ${STATUS_EMOJI[status]}\n\n` +
    `Pedido *#${orderNumber}* — *${ORDER_STATUS_LABELS[status]}*\n\n` +
    (status === "EM_PRODUCAO" ? `Sua encomenda já está em produção! 🧵\n\n` : "") +
    `— *Triade Select*`
  );

  if (type === "shipped") return (
    `Olá, *${customerName}*! 📦\n\nSeu pedido *#${orderNumber}* foi enviado!\n\n` +
    `🔍 *Rastreio:* ${trackingCode}\nrastreamento.correios.com.br\n\n— *Triade Select*`
  );

  if (type === "delivered") return (
    `Olá, *${customerName}*! 🎉\n\nSeu pedido *#${orderNumber}* foi entregue!\n\n` +
    `Obrigado pela confiança! 🙏\n— *Triade Select*`
  );

  return "";
}

export async function notifyOrderCreated(phone: string, customerName: string, orderNumber: string, total: number) {
  return sendWhatsAppMessage(phone, buildMessage("new_order", { customerName, orderNumber, total, minimumPayment: total * 0.5 }));
}
export async function notifyStatusUpdate(phone: string, customerName: string, orderNumber: string, status: OrderStatus) {
  return sendWhatsAppMessage(phone, buildMessage("status_update", { customerName, orderNumber, status }));
}
export async function notifyShipped(phone: string, customerName: string, orderNumber: string, trackingCode: string) {
  return sendWhatsAppMessage(phone, buildMessage("shipped", { customerName, orderNumber, trackingCode }));
}
export async function notifyDelivered(phone: string, customerName: string, orderNumber: string) {
  return sendWhatsAppMessage(phone, buildMessage("delivered", { customerName, orderNumber }));
}
