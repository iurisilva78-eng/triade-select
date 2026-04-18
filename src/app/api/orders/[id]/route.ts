import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { notifyStatusUpdate, notifyShipped, notifyDelivered, sendWhatsAppMessage } from "@/lib/whatsapp";
import { ORDER_STATUS_FLOW } from "@/types";
import type { OrderStatus, PaymentStatus } from "@prisma/client";

const updateSchema = z.object({
  status: z.enum(["RECEBIDO", "ACEITO", "EM_PRODUCAO", "ENVIADO", "ENTREGUE", "CANCELADO"]).optional(),
  trackingCode: z.string().optional(),
  note: z.string().optional(),
  payment: z.object({
    amount: z.number().positive(),
    method: z.string().min(1),
  }).optional(),
  whatsappMessage: z.string().optional(),
  denyCancel: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const user = session.user as any;
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      payments: true,
      user: { select: { name: true, email: true, phone: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  if (user.role !== "ADMIN" && order.userId !== user.id) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });

    // Valida ordem dos status
    if (data.status && data.status !== "CANCELADO") {
      const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status);
      const newIdx = ORDER_STATUS_FLOW.indexOf(data.status);
      if (newIdx < currentIdx) {
        return NextResponse.json({ error: "Não é possível retroceder o status do pedido." }, { status: 400 });
      }
    }

    // Bloqueia EM_PRODUCAO se não houver 50% pago
    if (data.status === "EM_PRODUCAO") {
      const minimumRequired = order.total * 0.5;
      if (order.paidAmount < minimumRequired) {
        return NextResponse.json(
          { error: `Pagamento mínimo de 50% (R$ ${minimumRequired.toFixed(2).replace(".", ",")}) necessário para iniciar produção.` },
          { status: 422 }
        );
      }
    }

    const updateData: any = {};

    // Atualiza status
    if (data.status) {
      updateData.status = data.status;
      if (data.status === "CANCELADO") updateData.cancelRequestedAt = null;
    }
    if (data.trackingCode) updateData.trackingCode = data.trackingCode;

    // Nega solicitação de cancelamento
    if (data.denyCancel) updateData.cancelRequestedAt = null;

    // Registra pagamento
    if (data.payment) {
      const newPaidAmount = order.paidAmount + data.payment.amount;
      let paymentStatus: PaymentStatus = "PARCIAL";
      if (newPaidAmount >= order.total) paymentStatus = "PAGO";

      await prisma.payment.create({
        data: {
          orderId: id,
          amount: data.payment.amount,
          method: data.payment.method,
          status: "PENDENTE",
          confirmedAt: new Date(),
        },
      });

      updateData.paidAmount = newPaidAmount;
      updateData.paymentStatus = paymentStatus;
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...updateData,
        ...(data.status
          ? {
              statusHistory: {
                create: {
                  status: data.status as OrderStatus,
                  note: data.note ?? `Status alterado para ${data.status}.`,
                },
              },
            }
          : {}),
      },
      include: { user: true },
    });

    // Notificações WhatsApp
    const phone = order.user.phone;
    if (phone) {
      const name = order.user.name;
      const orderNumber = order.orderNumber;

      // Mensagem customizada (sobrepõe a automática)
      if (data.whatsappMessage) {
        sendWhatsAppMessage(phone, data.whatsappMessage).catch(console.error);
      } else if (data.status) {
        if (data.status === "ENVIADO" && data.trackingCode) {
          notifyShipped(phone, name, orderNumber, data.trackingCode).catch(console.error);
        } else if (data.status === "ENTREGUE") {
          notifyDelivered(phone, name, orderNumber).catch(console.error);
        } else {
          notifyStatusUpdate(phone, name, orderNumber, data.status as OrderStatus).catch(console.error);
        }
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues?.[0]?.message ?? err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar pedido." }, { status: 500 });
  }
}
