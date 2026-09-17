import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  instagramHandle: z.string().optional(),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  active: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const data = updateSchema.parse(body);
    const item = await prisma.barberSpotlight.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  await prisma.barberSpotlight.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
