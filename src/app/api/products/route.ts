import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const productSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres."),
  description: z.string().min(1, "Descrição é obrigatória."),
  categoryId: z.string().min(1, "Selecione uma categoria."),
  priceBase: z.number().positive("Preço base deve ser positivo."),
  priceWithCustom: z.number().positive("Preço com logo deve ser positivo."),
  productionDays: z.number().int().positive().default(15),
  weightGrams: z.number().int().positive("Peso deve ser positivo."),
  heightCm: z.number().positive().default(5),
  widthCm: z.number().positive().default(20),
  lengthCm: z.number().positive().default(30),
  allowsCustomization: z.boolean().default(true),
  mockupType: z.string().default("capa"),
  images: z.array(z.string()).default([]),
  availableColors: z.array(z.string()).default([]),
  availableSizes: z.array(z.string()).default([]),
  availableClosures: z.array(z.string()).default([]),
});

/** Gera um slug único, adicionando sufixo numérico se necessário */
async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let slug = base;
  let i = 2;

  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = `${base}-${i}`;
    i++;
  }

  return slug;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const slug = searchParams.get("slug");

  if (slug) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: { select: { name: true, slug: true } } },
    });
    if (!product || !product.active) {
      return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }
    return NextResponse.json(product);
  }

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(category ? { category: { slug: category } } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    },
    include: { category: { select: { name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = productSchema.parse(body);
    const slug = await uniqueSlug(data.name);

    const product = await prisma.product.create({
      data: { ...data, slug },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
    }
    console.error("[POST /api/products]", err);
    const msg = (err as any)?.message ?? "";
    if (msg.includes("Foreign key") || msg.includes("categoryId")) {
      return NextResponse.json({ error: "Categoria inválida. Selecione uma categoria existente." }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao salvar produto. Verifique os campos e tente novamente." }, { status: 500 });
  }
}
