import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
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

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const items = await prisma.barberSpotlight.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const item = await prisma.barberSpotlight.create({ data });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Erro ao criar." }, { status: 500 });
  }
}
