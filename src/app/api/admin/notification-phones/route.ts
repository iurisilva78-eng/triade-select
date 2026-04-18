import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

function isAdmin(session: any) {
  return session && (session.user as any).role === "ADMIN";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const phones = await prisma.notificationPhone.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(phones);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const schema = z.object({ name: z.string().min(2), phone: z.string().min(10) });
  try {
    const { name, phone } = schema.parse(await req.json());
    const record = await prisma.notificationPhone.create({ data: { name, phone } });
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues?.[0]?.message }, { status: 400 });
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id, active } = await req.json();
  const record = await prisma.notificationPhone.update({ where: { id }, data: { active } });
  return NextResponse.json(record);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session)) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });

  await prisma.notificationPhone.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
