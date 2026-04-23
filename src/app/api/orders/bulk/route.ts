import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { notifyStatusUpdate } from "@/lib/whatsapp";
import type { OrderStatus } from "@prisma/client";

const VALID_STATUSES: OrderStatus[] = ["RECEBIDO", "ACEITO", "EM_PRODUCAO", "ENVIADO", "ENTREGUE", "CANCELADO"];

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { ids, status } = await req.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Selecione pelo menos um pedido." }, { status: 400 });
  }
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  // Busca todos os pedidos para poder notificar clientes
  const orders = await prisma.order.findMany({
    where: { id: { in: ids } },
    include: { user: { select: { name: true, phone: true } } },
  });

  // Atualiza status em massa
  await prisma.order.updateMany({
    where: { id: { in: ids } },
    data: { status },
  });

  // Registra histórico e notifica para cada pedido
  await Promise.all(
    orders.map(async (order) => {
      await prisma.orderStatusHistory.create({
        data: { orderId: order.id, status, note: "Atualização em lote pelo administrador." },
      });

      if (order.user.phone) {
        await notifyStatusUpdate(order.user.phone, order.user.name, order.orderNumber, status).catch(() => {});
      }
    })
  );

  return NextResponse.json({ updated: ids.length });
}
