import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Scissors, Clock, Truck, Shield } from "lucide-react";
import { DEFAULT_SITE_CONFIG } from "@/lib/site-config-defaults";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FEATURE_ICONS = [Scissors, Clock, Truck, Shield];

async function getSiteConfig(): Promise<Record<string, string>> {
  try {
    const saved = await prisma.siteConfig.findMany();
    const savedMap = Object.fromEntries(saved.map((c) => [c.key, c.value]));
    return Object.fromEntries(DEFAULT_SITE_CONFIG.map((d) => [d.key, savedMap[d.key] ?? d.value]));
  } catch {
    return Object.fromEntries(DEFAULT_SITE_CONFIG.map((d) => [d.key, d.value]));
  }
}

export default async function HomePage() {
  const cfg = await getSiteConfig();

  const features = [1, 2, 3, 4].map((n, i) => ({
    icon: FEATURE_ICONS[i],
    title: cfg[`feature_${n}_title`],
    desc: cfg[`feature_${n}_desc`],
  }));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section
        className="flex items-center justify-center px-4 py-8 md:py-20 text-center relative overflow-hidden min-h-[calc(100dvh-64px)]"
        style={cfg.hero_image ? {
          backgroundImage: `url(${cfg.hero_image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        } : {
          background: "radial-gradient(ellipse 80% 50% at 50% -5%, rgba(184,146,42,0.10) 0%, transparent 65%)",
        }}
      >
        {cfg.hero_image && (
          <div className="absolute inset-0 bg-black/55" />
        )}
        <div className="max-w-3xl relative z-10 w-full">
          {cfg.hero_badge && (
            <div className="hidden sm:inline-flex items-center gap-2 bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded-full px-4 py-1.5 text-sm text-[var(--gold)] font-semibold mb-4 md:mb-6">
              {cfg.hero_badge}
            </div>
          )}
          <h1 className="text-[clamp(1.6rem,6vw,3.75rem)] font-bold text-[var(--text)] leading-tight mb-2 md:mb-5">
            {cfg.hero_title}
          </h1>
          <p className="text-sm md:text-lg text-[var(--text-secondary)] mb-5 md:mb-8 max-w-xl mx-auto leading-relaxed">
            {cfg.hero_subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/produtos">
              <Button size="lg" className="w-full sm:w-auto">
                {cfg.hero_cta_primary || "Ver produtos"}
              </Button>
            </Link>
            <Link href="/cadastro">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                {cfg.hero_cta_secondary || "Criar conta grátis"}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center mx-auto mb-3">
                <Icon size={20} className="text-[var(--gold)]" />
              </div>
              <h3 className="font-semibold text-[var(--text)] mb-1 text-sm md:text-base">{title}</h3>
              <p className="text-xs md:text-sm text-[var(--text-secondary)]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-6 px-4 text-center text-[var(--text-muted)] text-sm">
        © {new Date().getFullYear()} {cfg.footer_text || "Triade Select — Todos os direitos reservados"}
      </footer>
    </div>
  );
}
