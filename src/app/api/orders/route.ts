import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { generateOrderNumber, formatCurrency } from "@/lib/utils";
import { notifyOrderCreated, sendWhatsAppGroupMessage, sendWhatsAppImageMessage, sendWhatsAppMessage } from "@/lib/whatsapp";

const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
      hasCustomization: z.boolean(),
      logoUrl: z.string().optional(),
      logoFileName: z.string().optional(),
      notes: z.string().optional(),
      selectedColor: z.string().optional(),
      selectedSize: z.string().optional(),
      selectedClosure: z.string().optional(),
    })
  ).min(1),
  cep: z.string().min(8),
  street: z.string(),
  number: z.string(),
  complement: z.string().optional(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  freightService: z.string(),
  freightCost: z.number().min(0),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const user = session.user as any;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const where =
    user.role === "ADMIN"
      ? { ...(status ? { status: status as any } : {}) }
      : { userId: user.id };

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { include: { product: { select: { name: true, images: true } } } },
      user: { select: { name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Faça login para realizar um pedido." }, { status: 401 });

  try {
    const body = await req.json();
    const data = orderSchema.parse(body);
    const user = session.user as any;

    const products = await prisma.product.findMany({
      where: { id: { in: data.items.map((i) => i.productId) }, active: true },
    });

    if (products.length !== data.items.length) {
      return NextResponse.json({ error: "Um ou mais produtos não encontrados." }, { status: 400 });
    }

    let subtotal = 0;
    const itemsData = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const unitPrice = item.hasCustomization ? product.priceWithCustom : product.priceBase;
      subtotal += unitPrice * item.quantity;
      return { ...item, unitPrice };
    });

    const total = subtotal + data.freightCost;
    const orderNumber = generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: "RECEBIDO",
        paymentStatus: "PENDENTE",
        subtotal,
        freightCost: data.freightCost,
        total,
        paidAmount: 0,
        cep: data.cep,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        shippingService: data.freightService,
        notes: data.notes,
        items: {
          create: itemsData.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            hasCustomization: item.hasCustomization,
            logoUrl: item.logoUrl,
            logoFileName: item.logoFileName,
            notes: item.notes,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize,
            selectedClosure: item.selectedClosure,
          })),
        },
        statusHistory: {
          create: { status: "RECEBIDO", note: "Pedido criado pelo cliente." },
        },
      },
      include: {
        items: { include: { product: { select: { name: true } } } },
      },
    });

    // Notifica cliente via WhatsApp
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser?.phone) {
      notifyOrderCreated(dbUser.phone, dbUser.name, orderNumber, total).catch(console.error);
    }

    // Monta a mensagem admin
    const itemsList = order.items.map((i) => {
      const variants = [
        (i as any).selectedColor, (i as any).selectedSize, (i as any).selectedClosure
      ].filter(Boolean).join(", ");
      return `${i.product.name} ×${i.quantity}${variants ? ` (${variants})` : ""}`;
    }).join("\n  • ");

    const hasLogo = order.items.some((i) => (i as any).hasCustomization && (i as any).logoUrl);

    const adminMsg =
      `🛍 *Novo Pedido #${orderNumber}*${hasLogo ? " 🎨 *COM LOGO*" : ""}\n\n` +
      `👤 *Cliente:* ${dbUser?.name ?? "—"}\n` +
      `📱 *WhatsApp:* ${dbUser?.phone ?? "não informado"}\n` +
      `📦 *Itens:*\n  • ${itemsList}\n` +
      `💰 *Total:* ${formatCurrency(total)}\n` +
      `📍 *Cidade:* ${data.city}/${data.state}\n\n` +
      `Acesse o painel admin para gerenciar.\n` +
      `— *Triade Select*`;

    // 1. Notifica grupo WhatsApp específico (se configurado)
    const groupConfig = await prisma.siteConfig.findUnique({ where: { key: "whatsapp_group_id" } });
    const groupId = groupConfig?.value?.trim() || process.env.WHATSAPP_GROUP_ID;

    if (groupId) {
      sendWhatsAppGroupMessage(groupId, adminMsg).catch(console.error);

      // Envia preview da logo como imagem no grupo
      if (hasLogo) {
        for (const item of order.items as any[]) {
          if (item.hasCustomization && item.logoUrl) {
            const logoCaption =
              `📎 *Logo do pedido #${orderNumber}*\n` +
              `Produto: ${item.product.name}\n` +
              `Cliente: ${dbUser?.name ?? "—"}`;
            sendWhatsAppImageMessage(groupId, item.logoUrl, logoCaption, { raw: true }).catch(console.error);
          }
        }
      }
    }

    // 2. Notifica telefones individuais admin cadastrados
    const adminPhones = await prisma.notificationPhone.findMany({ where: { active: true } });
    for (const ap of adminPhones) {
      sendWhatsAppMessage(ap.phone, adminMsg).catch(console.error);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues?.[0]?.message ?? err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar pedido." }, { status: 500 });
  }
}
