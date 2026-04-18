import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { notifyStatusUpdate, notifyShipped, notifyDelivered } from "@/lib/whatsapp";
import { ORDER_STATUS_FLOW } from "@/types";
import type { OrderStatus } from "@prisma/client";

const updateSchema = z.object({
  status: z.enum(["RECEBIDO", "ACEITO", "EM_PRODUCAO", "ENVIADO", "ENTREGUE", "CANCELADO"]).optional(),
  trackingCode: z.string().optional(),
  note: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

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

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

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

    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    // Valida ordem obrigatória dos status (exceto cancelamento)
    if (data.status && data.status !== "CANCELADO") {
      const currentIdx = ORDER_STATUS_FLOW.indexOf(order.status);
      const newIdx = ORDER_STATUS_FLOW.indexOf(data.status);
      if (newIdx < currentIdx) {
        return NextResponse.json(
          { error: "Não é possível retroceder o status do pedido." },
          { status: 400 }
        );
      }
    }

    // Bloqueia "EM_PRODUCAO" se não houver 50% pago
    if (data.status === "EM_PRODUCAO") {
      const minimumRequired = order.total * 0.5;
      if (order.paidAmount < minimumRequired) {
        return NextResponse.json(
          {
            error: `Pagamento mínimo de 50% (${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(minimumRequired)}) necessário para iniciar produção.`,
          },
          { status: 422 }
        );
      }
    }

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.trackingCode) updateData.trackingCode = data.trackingCode;

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
    if (phone && data.status) {
      const name = order.user.name;
      const orderNumber = order.orderNumber;

      if (data.status === "ENVIADO" && data.trackingCode) {
        notifyShipped(phone, name, orderNumber, data.trackingCode).catch(console.error);
      } else if (data.status === "ENTREGUE") {
        notifyDelivered(phone, name, orderNumber).catch(console.error);
      } else {
        notifyStatusUpdate(phone, name, orderNumber, data.status as OrderStatus).catch(
          console.error
        );
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
