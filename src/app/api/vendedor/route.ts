import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber, formatCurrency } from "@/lib/utils";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

const schema = z.object({
  pin: z.string().min(1),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    selectedColor: z.string().optional(),
    selectedSize: z.string().optional(),
    selectedClosure: z.string().optional(),
    hasCustomization: z.boolean().default(false),
    unitPriceOverride: z.number().positive().optional(),
    notes: z.string().optional(),
  })).min(1),
  paymentMethod: z.string().optional(),
  paidAmount: z.number().min(0).default(0),
  totalOverride: z.number().positive().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Validate PIN
    const pinConfig = await prisma.siteConfig.findUnique({ where: { key: "vendor_pin" } });
    const validPin = pinConfig?.value?.trim() ?? process.env.VENDOR_PIN ?? "1234";
    if (data.pin !== validPin) {
      return NextResponse.json({ error: "PIN inválido." }, { status: 401 });
    }

    // Find admin user to attach the order to
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!adminUser) {
      return NextResponse.json({ error: "Nenhum usuário administrador encontrado." }, { status: 500 });
    }

    // Load products
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    if (products.length !== data.items.length) {
      return NextResponse.json({ error: "Um ou mais produtos não encontrados." }, { status: 400 });
    }

    let subtotal = 0;
    const itemsData = data.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const tablePrice = item.hasCustomization ? product.priceWithCustom : product.priceBase;
      const unitPrice = item.unitPriceOverride ?? tablePrice;
      subtotal += unitPrice * item.quantity;
      return { ...item, unitPrice };
    });

    const total = data.totalOverride ?? subtotal;
    const orderNumber = generateOrderNumber();

    const customerNote = `[VENDEDOR] Cliente: ${data.customerName} | WhatsApp: ${data.customerPhone}${data.notes ? ` | Obs: ${data.notes}` : ""}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: adminUser.id,
        status: "ACEITO",
        paymentStatus: data.paidAmount >= total ? "PAGO" : data.paidAmount > 0 ? "PARCIAL" : "PENDENTE",
        subtotal,
        freightCost: 0,
        total,
        paidAmount: data.paidAmount,
        cep: "00000000",
        street: "Entrega pessoal",
        number: "-",
        neighborhood: "Porta em porta",
        city: "Londrina",
        state: "PR",
        shippingService: "Entrega pessoal",
        notes: customerNote,
        items: {
          create: itemsData.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            hasCustomization: item.hasCustomization,
            notes: item.notes,
            selectedColor: item.selectedColor,
            selectedSize: item.selectedSize,
            selectedClosure: item.selectedClosure,
          })),
        },
        statusHistory: {
          create: {
            status: "ACEITO",
            note: `Pedido lançado pelo vendedor externo. Cliente: ${data.customerName} (${data.customerPhone})`,
          },
        },
        ...(data.paidAmount > 0 && data.paymentMethod
          ? {
              payments: {
                create: {
                  amount: data.paidAmount,
                  method: data.paymentMethod,
                  status: "PENDENTE",
                  confirmedAt: new Date(),
                },
              },
            }
          : {}),
      },
      include: {
        items: { include: { product: { select: { name: true } } } },
      },
    });

    // Notify admin phones
    const adminPhones = await prisma.notificationPhone.findMany({ where: { active: true } });
    const itemsList = order.items
      .map((i) => `${i.product.name} ×${(i as any).quantity}`)
      .join(", ");
    const adminMsg =
      `🧑‍💼 *Pedido do Vendedor #${orderNumber}*\n\n` +
      `👤 *Cliente:* ${data.customerName}\n` +
      `📱 *WhatsApp:* ${data.customerPhone}\n` +
      `📦 *Itens:* ${itemsList}\n` +
      `💰 *Total:* ${formatCurrency(total)}` +
      (data.paidAmount > 0 ? `\n✅ *Pago:* ${formatCurrency(data.paidAmount)}` : "") +
      `\n— *Triade Select (via vendedor)*`;

    for (const ap of adminPhones) {
      sendWhatsAppMessage(ap.phone, adminMsg).catch(console.error);
    }

    // Try to notify customer too
    const cleanPhone = data.customerPhone.replace(/\D/g, "");
    if (cleanPhone.length >= 10) {
      const customerMsg =
        `Olá, *${data.customerName}*! 👋\n\n` +
        `Seu pedido foi registrado com sucesso! 🎉\n\n` +
        `📦 *Pedido:* #${orderNumber}\n` +
        `💰 *Total:* ${formatCurrency(total)}\n\n` +
        `Acompanhe pelo site: triadeselect.com.br\n` +
        `— *Triade Select*`;
      sendWhatsAppMessage(cleanPhone, customerMsg).catch(console.error);
    }

    return NextResponse.json({ orderNumber, total, status: "ACEITO" }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues?.[0]?.message ?? err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao registrar pedido." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const pin = req.headers.get("x-vendor-pin") ?? new URL(req.url).searchParams.get("pin");
  if (!pin) return NextResponse.json({ error: "PIN necessário." }, { status: 401 });

  const pinConfig = await prisma.siteConfig.findUnique({ where: { key: "vendor_pin" } });
  const validPin = pinConfig?.value?.trim() ?? process.env.VENDOR_PIN ?? "1234";
  if (pin !== validPin) return NextResponse.json({ error: "PIN inválido." }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      priceBase: true,
      priceWithCustom: true,
      colorImages: true,
      allowsCustomization: true,
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}
