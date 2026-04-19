import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { DEFAULT_SITE_CONFIG } from "@/lib/site-config-defaults";

export const dynamic = "force-dynamic";

// Re-exporta para compatibilidade interna
export const DEFAULT_CONFIG = DEFAULT_SITE_CONFIG;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  // Retorna configs salvas + defaults para as que não existem
  const saved = await prisma.siteConfig.findMany();
  const savedMap = Object.fromEntries(saved.map((c) => [c.key, c.value]));

  const result = DEFAULT_CONFIG.map((d) => ({
    ...d,
    value: savedMap[d.key] ?? d.value,
  }));

  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const updates: { key: string; value: string }[] = await req.json();

  for (const { key, value } of updates) {
    const def = DEFAULT_CONFIG.find((d) => d.key === key);
    if (!def) continue;

    await prisma.siteConfig.upsert({
      where: { key },
      update: { value, label: def.label, type: def.type, section: def.section },
      create: { key, value, label: def.label, type: def.type, section: def.section },
    });
  }

  return NextResponse.json({ ok: true });
}

// Endpoint público para a homepage ler as configs
export async function POST() {
  const saved = await prisma.siteConfig.findMany();
  const savedMap = Object.fromEntries(saved.map((c) => [c.key, c.value]));
  const result = Object.fromEntries(DEFAULT_CONFIG.map((d) => [d.key, savedMap[d.key] ?? d.value]));
  return NextResponse.json(result);
}
