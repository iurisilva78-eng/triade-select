import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

  const tempPassword = `Triade@${Math.floor(1000 + Math.random() * 9000)}`;
  const hashed = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({ where: { id }, data: { password: hashed } });

  return NextResponse.json({ tempPassword, name: user.name, phone: user.phone });
}
