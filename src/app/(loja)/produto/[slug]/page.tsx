import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductClient } from "./ProductClient";
import { MockupTypeConfig } from "@/lib/mockup-config";

export const dynamic = "force-dynamic";

async function getMockupConfig(): Promise<Record<string, MockupTypeConfig> | null> {
  try {
    const row = await prisma.siteConfig.findUnique({ where: { key: "mockup_positions" } });
    if (!row) return null;
    return JSON.parse(row.value);
  } catch {
    return null;
  }
}

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [product, mockupConfig] = await Promise.all([
    prisma.product.findUnique({
      where: { slug },
      include: { category: { select: { name: true, slug: true } } },
    }),
    getMockupConfig(),
  ]);

  if (!product || !product.active) notFound();

  return <ProductClient product={product as any} mockupConfig={mockupConfig} />;
}
