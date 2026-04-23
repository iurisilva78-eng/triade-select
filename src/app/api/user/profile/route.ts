import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: { id: true, name: true, email: true, phone: true },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { name, phone, currentPassword, newPassword } = await req.json();

  const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  // Se quiser trocar senha, verifica a senha atual
  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Informe a senha atual." }, { status: 400 });
    if (!user.password) return NextResponse.json({ error: "Conta sem senha definida." }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Senha atual incorreta." }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "Nova senha deve ter no mínimo 6 caracteres." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name?.trim() ? { name: name.trim() } : {}),
      ...(phone !== undefined ? { phone: phone.trim() || null } : {}),
      ...(newPassword ? { password: await bcrypt.hash(newPassword, 10) } : {}),
    },
    select: { id: true, name: true, email: true, phone: true },
  });

  return NextResponse.json(updated);
}
