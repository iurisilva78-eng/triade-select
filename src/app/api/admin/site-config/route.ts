import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Conteúdo padrão do site
export const DEFAULT_CONFIG = [
  // Hero
  { key: "hero_badge", label: "Badge (topo do hero)", type: "text", section: "hero", value: "✂️ Uniformes profissionais para barbearias" },
  { key: "hero_title", label: "Título principal", type: "textarea", section: "hero", value: "Equipamentos que refletem o profissionalismo da sua barbearia" },
  { key: "hero_subtitle", label: "Subtítulo", type: "textarea", section: "hero", value: "Capas, uniformes e aventais personalizados com o logo da sua barbearia. Qualidade premium, entrega em todo o Brasil." },
  { key: "hero_cta_primary", label: "Botão principal", type: "text", section: "hero", value: "Ver produtos" },
  { key: "hero_cta_secondary", label: "Botão secundário", type: "text", section: "hero", value: "Criar conta grátis" },
  { key: "hero_image", label: "Imagem de fundo (URL)", type: "image", section: "hero", value: "" },
  // Features
  { key: "feature_1_title", label: "Destaque 1 — Título", type: "text", section: "features", value: "Feito sob encomenda" },
  { key: "feature_1_desc", label: "Destaque 1 — Descrição", type: "textarea", section: "features", value: "Cada produto produzido com atenção e qualidade para a sua barbearia." },
  { key: "feature_2_title", label: "Destaque 2 — Título", type: "text", section: "features", value: "Prazo de 15 dias úteis" },
  { key: "feature_2_desc", label: "Destaque 2 — Descrição", type: "textarea", section: "features", value: "Produção e entrega com prazo garantido após confirmação de pagamento." },
  { key: "feature_3_title", label: "Destaque 3 — Título", type: "text", section: "features", value: "Entrega em todo o Brasil" },
  { key: "feature_3_desc", label: "Destaque 3 — Descrição", type: "textarea", section: "features", value: "Envio pelos Correios (PAC e SEDEX) para qualquer cidade." },
  { key: "feature_4_title", label: "Destaque 4 — Título", type: "text", section: "features", value: "Qualidade garantida" },
  { key: "feature_4_desc", label: "Destaque 4 — Descrição", type: "textarea", section: "features", value: "Materiais profissionais selecionados para o dia a dia da barbearia." },
  // Geral
  { key: "site_name", label: "Nome do site", type: "text", section: "geral", value: "Triade Select" },
  { key: "footer_text", label: "Texto do rodapé", type: "text", section: "geral", value: "Triade Select — Todos os direitos reservados" },
  { key: "whatsapp_contact", label: "WhatsApp para contato (com DDD)", type: "text", section: "geral", value: "" },
  { key: "instagram_url", label: "Instagram (URL)", type: "text", section: "geral", value: "" },
  { key: "whatsapp_group_id", label: "ID do grupo WhatsApp (Z-API)", type: "text", section: "geral", value: "" },
];

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
