import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { DEFAULT_SITE_CONFIG } from "@/lib/site-config-defaults";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getSiteConfig(): Promise<Record<string, string>> {
  try {
    const saved = await prisma.siteConfig.findMany();
    const savedMap = Object.fromEntries(saved.map((c) => [c.key, c.value]));
    return Object.fromEntries(DEFAULT_SITE_CONFIG.map((d) => [d.key, savedMap[d.key] ?? d.value]));
  } catch {
    return Object.fromEntries(DEFAULT_SITE_CONFIG.map((d) => [d.key, d.value]));
  }
}

async function getFeaturedProducts() {
  try {
    return await prisma.product.findMany({
      where: { active: true },
      take: 4,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true, price: true, images: true },
    });
  } catch {
    return [];
  }
}

/* ── Triângulo (reusado no footer) ─────────────────────── */
function TriangleMark({ size = 28, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <polygon points="50,8 90,80 10,80" stroke={color} strokeWidth="5" fill="none" strokeLinejoin="round" />
      <polygon points="50,28 78,75 22,75" stroke={color} strokeWidth="4" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

export default async function HomePage() {
  const [cfg, products] = await Promise.all([getSiteConfig(), getFeaturedProducts()]);

  const features = [1, 2, 3, 4].map((n) => ({
    n: `0${n}`,
    title: cfg[`feature_${n}_title`],
    desc: cfg[`feature_${n}_desc`],
  }));

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>

      {/* ── Announcement Bar ──────────────────────────────── */}
      <div
        className="flex items-center justify-center gap-4 overflow-hidden shrink-0"
        style={{ background: "var(--ink)", color: "var(--bg)", height: 36 }}
      >
        <span className="t-mono text-[10px] tracking-[0.12em] uppercase hidden sm:block">
          Frete grátis acima de R$ 500
        </span>
        <span className="opacity-30 hidden sm:block">●</span>
        <span className="t-mono text-[10px] tracking-[0.12em] uppercase">
          Personalização gratuita com seu logo
        </span>
        <span className="opacity-30 hidden sm:block">●</span>
        <span className="t-mono text-[10px] tracking-[0.12em] uppercase hidden sm:block">
          Prazo 15 dias úteis
        </span>
      </div>

      <Header />

      {/* ── Hero V1 Split ─────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--line-soft)" }}>
        <div
          className="max-w-[1440px] mx-auto grid md:grid-cols-2"
          style={{ minHeight: "min(88svh, 780px)" }}
        >
          {/* Texto */}
          <div className="flex flex-col justify-center px-5 py-10 md:px-16 md:py-20 order-1">
            <div className="t-eyebrow mb-4">— Coleção permanente</div>
            <h1
              className="t-display mb-4 md:mb-6"
              style={{ fontSize: "clamp(44px, 8vw, 82px)" }}
            >
              {cfg.hero_title || (
                <>
                  Vestir a<br />
                  <span className="t-display-italic" style={{ color: "var(--gold)" }}>barbearia</span><br />
                  com intenção.
                </>
              )}
            </h1>
            <p
              className="mb-7 leading-relaxed max-w-sm"
              style={{ fontSize: 15, color: "var(--ink-soft)" }}
            >
              {cfg.hero_subtitle || "Capas, aventais e uniformes feitos para quem entende que o cuidado começa no que o profissional veste."}
            </p>
            <div className="flex flex-col gap-3 max-w-[280px]">
              <Link href="/produtos">
                <Button size="lg" className="w-full">
                  {cfg.hero_cta_primary || "Ver coleção"}
                </Button>
              </Link>
              <Link href="/cadastro">
                <Button size="lg" variant="outline" className="w-full">
                  {cfg.hero_cta_secondary || "Personalizar com logo"}
                </Button>
              </Link>
            </div>
          </div>

          {/* Imagem */}
          <div className="mockup-bg relative overflow-hidden aspect-[4/3] md:aspect-auto order-2">
            {cfg.hero_image ? (
              <img
                src={cfg.hero_image}
                alt="Produto Triade Select"
                className="w-full h-full object-cover"
                style={{ mixBlendMode: "multiply" }}
              />
            ) : products[0]?.images[0] ? (
              <img
                src={products[0].images[0]}
                alt={products[0].name}
                className="w-full h-full object-cover"
                style={{ mixBlendMode: "multiply" }}
              />
            ) : null}
            <div
              className="absolute bottom-4 left-4 t-mono text-[9px] tracking-[0.14em] uppercase px-2 py-1"
              style={{ background: "rgba(246,242,236,0.75)", color: "var(--muted)" }}
            >
              TS-001 · Capa Signature
            </div>
          </div>
        </div>
      </section>

      {/* ── Features — lista editorial numerada ──────────── */}
      <section className="py-16 md:py-24 px-5 md:px-8" style={{ borderBottom: "1px solid var(--line-soft)" }}>
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-10 md:mb-14">
            <div className="t-eyebrow mb-3">— O que nos diferencia</div>
            <h2 className="t-display" style={{ fontSize: "clamp(28px, 5vw, 52px)" }}>
              Um uniforme <span className="t-display-italic">bem feito</span>
              <br className="hidden md:block" /> diz muito.
            </h2>
          </div>

          <div style={{ borderTop: "1px solid var(--line-soft)" }}>
            {features.map((f) => (
              <div
                key={f.n}
                className="flex gap-5 py-5 md:py-6"
                style={{ borderBottom: "1px solid var(--line-soft)" }}
              >
                <div
                  className="t-mono shrink-0 pt-0.5"
                  style={{ fontSize: 10, color: "var(--gold)", letterSpacing: "0.1em", width: 28 }}
                >
                  {f.n}
                </div>
                <div>
                  <div
                    className="font-medium mb-1.5"
                    style={{ fontFamily: "var(--font-display)", fontSize: 18, lineHeight: 1.2 }}
                  >
                    {f.title}
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted)", maxWidth: 520 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Grid de produtos ─────────────────────────────── */}
      {products.length > 0 && (
        <section className="py-16 md:py-24 px-5 md:px-8" style={{ borderBottom: "1px solid var(--line-soft)" }}>
          <div className="max-w-[1440px] mx-auto">
            <div className="flex items-baseline justify-between mb-10 md:mb-12 flex-wrap gap-4">
              <div>
                <div className="t-eyebrow mb-3">— Destaques</div>
                <h2 className="t-display" style={{ fontSize: "clamp(28px, 5vw, 48px)" }}>
                  Peças <span className="t-display-italic">assinatura</span>
                </h2>
              </div>
              <Link
                href="/produtos"
                className="hidden md:inline-flex text-[13px] font-medium pb-0.5 transition-all"
                style={{ borderBottom: "1px solid var(--ink)" }}
              >
                Ver todos os produtos →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {products.map((p, i) => (
                <Link key={p.id} href={`/produto/${p.slug}`} className="group">
                  <div className="mockup-bg aspect-[3/4] relative overflow-hidden mb-3">
                    {p.images[0] && (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        style={{ mixBlendMode: "multiply" }}
                      />
                    )}
                    <div
                      className="absolute bottom-3 left-3 t-mono"
                      style={{ fontSize: 9, letterSpacing: "0.12em", color: "var(--muted)" }}
                    >
                      TS-00{i + 1}
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <div
                      className="font-medium truncate mr-2"
                      style={{ fontFamily: "var(--font-display)", fontSize: 16, lineHeight: 1.2 }}
                    >
                      {p.name}
                    </div>
                    <div className="text-sm font-medium shrink-0">{formatCurrency(p.price)}</div>
                  </div>
                  <div className="t-eyebrow mt-1.5" style={{ fontSize: 9 }}>
                    15 dias · personalizável
                  </div>
                </Link>
              ))}
            </div>

            <Link href="/produtos" className="md:hidden mt-8 block">
              <Button variant="outline" className="w-full">Ver todos os produtos</Button>
            </Link>
          </div>
        </section>
      )}

      {/* ── Banner B2B ────────────────────────────────────── */}
      <section className="px-5 md:px-8 py-6 md:py-8" style={{ borderBottom: "1px solid var(--line-soft)" }}>
        <div
          className="max-w-[1440px] mx-auto grain relative overflow-hidden px-6 py-12 md:px-16 md:py-20"
          style={{ background: "var(--ink)", color: "var(--bg)" }}
        >
          <div className="relative z-10 max-w-2xl">
            <div className="t-eyebrow mb-4" style={{ color: "var(--gold)" }}>— Programa B2B</div>
            <h2 className="t-display mb-5" style={{ fontSize: "clamp(32px, 5vw, 64px)", color: "var(--bg)" }}>
              Sua barbearia{" "}
              <span className="t-display-italic" style={{ color: "var(--gold)" }}>merece</span>{" "}
              um uniforme exclusivo.
            </h2>
            <p
              className="text-sm leading-relaxed mb-8 max-w-md"
              style={{ color: "rgba(246,242,236,0.65)" }}
            >
              Cadastre sua barbearia e receba condições especiais em pedidos recorrentes,
              priority production e consultoria de identidade visual.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/cadastro">
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  style={{
                    background: "var(--bg)",
                    color: "var(--ink)",
                    borderColor: "var(--bg)",
                  } as React.CSSProperties}
                >
                  Abrir conta B2B
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
                style={{ color: "var(--bg)", borderColor: "var(--bg)" } as React.CSSProperties}
              >
                Falar com consultor
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer editorial ─────────────────────────────── */}
      <footer
        className="px-5 md:px-8 py-12 md:py-16 mt-auto"
        style={{ background: "var(--ink)", color: "var(--bg)" }}
      >
        <div className="max-w-[1440px] mx-auto">
          <TriangleMark size={28} color="var(--bg)" />
          <p className="t-display mt-4 mb-10 max-w-xs" style={{ fontSize: "clamp(20px, 3vw, 28px)", color: "var(--bg)" }}>
            Cada peça <span className="t-display-italic">conta</span> a história da cadeira.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-10">
            {[
              ["Loja", ["Capas", "Aventais", "Camisetas", "Uniformes"]],
              ["Conta", ["Entrar", "Cadastrar", "Meus Pedidos", "Rastrear"]],
              ["Contato", ["WhatsApp", "Instagram", "FAQ"]],
            ].map(([title, links]) => (
              <div key={title as string}>
                <div className="t-eyebrow mb-3" style={{ color: "rgba(246,242,236,0.4)" }}>
                  {title as string}
                </div>
                {(links as string[]).map((l) => (
                  <div key={l} className="py-1 text-[13px]" style={{ color: "rgba(246,242,236,0.75)" }}>
                    {l}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div
            className="pt-5 t-mono text-[10px] tracking-[0.12em] uppercase"
            style={{ borderTop: "1px solid rgba(246,242,236,0.12)", color: "rgba(246,242,236,0.35)" }}
          >
            © {new Date().getFullYear()} Triade Select — Todos os direitos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}
