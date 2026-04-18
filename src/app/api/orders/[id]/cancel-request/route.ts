import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// Customer requests cancellation
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  const user = session.user as any;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  if (order.userId !== user.id) return NextResponse.json({ error: "Não autorizado." }, { status: 403 });

  if (!["RECEBIDO", "ACEITO"].includes(order.status)) {
    return NextResponse.json(
      { error: "Cancelamento não permitido neste estágio. Entre em contato pelo WhatsApp." },
      { status: 422 }
    );
  }

  if (order.cancelRequestedAt) {
    return NextResponse.json({ error: "Cancelamento já solicitado." }, { status: 422 });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { cancelRequestedAt: new Date() },
  });

  return NextResponse.json(updated);
}

// Admin denies cancel request
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const updated = await prisma.order.update({
    where: { id },
    data: { cancelRequestedAt: null },
  });

  return NextResponse.json(updated);
}
