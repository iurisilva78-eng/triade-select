/**
 * POST /api/admin/init-whatsapp
 * Semeia as credenciais da Evolution API no banco a partir das env vars.
 * Só preenche chaves que ainda estão vazias — nunca sobrescreve dados já salvos.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const defaults: Record<string, string> = {
    whatsapp_provider:     process.env.WHATSAPP_PROVIDER     ?? "evolution",
    whatsapp_evo_base_url: process.env.WHATSAPP_EVO_BASE_URL ?? "",
    whatsapp_evo_instance: process.env.WHATSAPP_EVO_INSTANCE ?? "triade-select",
    whatsapp_evo_api_key:  process.env.WHATSAPP_EVO_API_KEY  ?? "",
  };

  const labels: Record<string, { label: string; type: string; section: string }> = {
    whatsapp_provider:     { label: "Provedor WhatsApp",        type: "text", section: "whatsapp" },
    whatsapp_evo_base_url: { label: "Evolution API — Base URL", type: "text", section: "whatsapp" },
    whatsapp_evo_instance: { label: "Evolution API — Instância",type: "text", section: "whatsapp" },
    whatsapp_evo_api_key:  { label: "Evolution API — API Key",  type: "text", section: "whatsapp" },
  };

  const existing = await prisma.siteConfig.findMany({
    where: { key: { in: Object.keys(defaults) } },
  });
  const existingMap = Object.fromEntries(existing.map((r) => [r.key, r.value]));

  let seeded = 0;
  for (const [key, value] of Object.entries(defaults)) {
    if (!value) continue; // não sobe vazio
    if (existingMap[key]?.trim()) continue; // já tem valor salvo — preserva

    const meta = labels[key];
    await prisma.siteConfig.upsert({
      where: { key },
      update: { value, ...meta },
      create: { key, value, ...meta },
    });
    seeded++;
  }

  return NextResponse.json({ ok: true, seeded });
}
