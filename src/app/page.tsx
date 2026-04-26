import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { DEFAULT_SITE_CONFIG } from "@/lib/site-config-defaults";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getSiteConfig(): Promise<Record<string, string>> {
  try {
    const saved    = await prisma.siteConfig.findMany();
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
      select: { id: true, name: true, slug: true, priceBase: true, images: true, productionDays: true },
    });
  } catch {
    return [];
  }
}

async function getCategories() {
  try {
    return await prisma.category.findMany({
      include: { _count: { select: { products: { where: { active: true } } } } },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

// Category icon map — SVG paths keyed by partial slug/name match
const CATEGORY_ICONS: Record<string, string> = {
  capa:     "M20 20H4V8l8-6 8 6v12zm-8-2v-4H12v4m-4-4h2v4H8v-4zm8 0h2v4h-2v-4z",
  camiseta: "M20.5 6L12 2 3.5 6 5 8l1-0.5V20h12V7.5L19 8l1.5-2zm-8.5 0c-.6 0-1.1-.2-1.5-.5.4.3.9.5 1.5.5s1.1-.2 1.5-.5c-.4.3-.9.5-1.5.5z",
  avental:  "M12 2C9.8 2 8 3.8 8 6v1H5l1 13h12l1-13h-3V6c0-2.2-1.8-4-4-4zm0 2c1.1 0 2 .9 2 2v1h-4V6c0-1.1.9-2 2-2z",
  robe:     "M8 2L5 7v13h14V7l-3-5H8zm0 1.5L7 6h10l-1-2.5H8zM6 8h12v11H6V8z",
};

function getCategoryIcon(slug: string): string {
  const match = Object.keys(CATEGORY_ICONS).find((k) => slug.toLowerCase().includes(k));
  return match ? CATEGORY_ICONS[match] : "M12 2L2 20h20L12 2zm0 4l6.5 12h-13L12 6z";
}

function TriangleMark({ size = 28, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <polygon points="50,8 90,80 10,80" stroke={color} strokeWidth="5" fill="none" strokeLinejoin="round" />
      <polygon points="50,28 78,75 22,75" stroke={color} strokeWidth="4" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

export default async function HomePage() {
  const [cfg, products, categories] = await Promise.all([getSiteConfig(), getFeaturedProducts(), getCategories()]);

  const features = [1, 2, 3, 4].map((n) => ({
    n: `0${n}`,
    title: cfg[`feature_${n}_title`],
    desc:  cfg[`feature_${n}_desc`],
  }));

  // Announcement messages — filter empty ones
  const announcements = [
    cfg.announcement_1,
    cfg.announcement_2,
    cfg.announcement_3,
  ].filter(Boolean);

  // Footer links
  const footerLinks = [1, 2, 3]
    .map((n) => ({ label: cfg[`footer_link_${n}_label`], href: cfg[`footer_link_${n}_href`] }))
    .filter((l) => l.label && l.href);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>

      {/* ── Announcement Bar ───────────────────────────────── */}
      {announcements.length > 0 && (
        <div
          className="flex items-center justify-center gap-4 overflow-hidden shrink-0"
          style={{ background: "var(--ink)", color: "var(--bg)", height: 36 }}
        >
          {announcements.map((msg, i) => (
            <span key={i} className={`items-center gap-4 ${i === 0 ? "flex" : "hidden sm:flex"}`}>
              {i > 0 && <span className="opacity-30">●</span>}
              <span className="t-mono text-[10px] tracking-[0.12em] uppercase">
                {msg}
              </span>
            </span>
          ))}
        </div>
      )}

      <Header />

      {/* ── Hero V1 Split ──────────────────────────────────── */}
      <section style={{ borderBottom: "1px solid var(--line-soft)" }}>
        <div
          className="max-w-[1440px] mx-auto grid md:grid-cols-2"
          style={{ minHeight: "min(72svh, 620px)" }}
        >
          {/* Text */}
          <div className="flex flex-col justify-center px-5 py-8 md:px-16 md:py-12 order-1">
            {cfg.hero_eyebrow && (
              <div className="t-eyebrow mb-3">{cfg.hero_eyebrow}</div>
            )}
            <h1
              className="t-display mb-3 md:mb-4"
              style={{ fontSize: "clamp(36px, 5vw, 68px)" }}
            >
              {cfg.hero_title && (
                <>
                  {cfg.hero_title}
                  {cfg.hero_title_italic && (
                    <> <span className="t-display-italic" style={{ color: "var(--gold)" }}>{cfg.hero_title_italic}</span></>
                  )}
                </>
              )}
              {!cfg.hero_title && (
                <>
                  Vestir a<br />
                  <span className="t-display-italic" style={{ color: "var(--gold)" }}>barbearia</span><br />
                  com intenção.
                </>
              )}
            </h1>
            <p
              className="mb-5 leading-relaxed max-w-sm"
              style={{ fontSize: 14, color: "var(--ink-soft)" }}
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
                  {cfg.hero_cta_secondary || "Criar conta grátis"}
                </Button>
              </Link>
            </div>
          </div>

          {/* Image */}
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
          </div>
        </div>
      </section>

      {/* ── Features — lista editorial numerada ───────────── */}
      <section className="py-16 md:py-24 px-5 md:px-8" style={{ borderBottom: "1px solid var(--line-soft)" }}>
        <div className="max-w-[1440px] mx-auto">
          <div className="mb-10 md:mb-14">
            <div className="t-eyebrow mb-3">— O que nos diferencia</div>
            <h2 className="t-display" style={{ fontSize: "clamp(28px, 5vw, 52px)" }}>
              O detalhe que o cliente{" "}
              <span className="t-display-italic">nota</span>
              <br className="hidden md:block" /> antes de sentar na cadeira.
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

      {/* ── C1: Categorias com ícones ─────────────────────── */}
      {categories.length > 0 && (
        <section className="py-12 md:py-16 px-5 md:px-8" style={{ borderBottom: "1px solid var(--line-soft)" }}>
          <div className="max-w-[1440px] mx-auto">
            <div className="t-eyebrow mb-8 text-center">— Navegue por categoria</div>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 4)}, minmax(0, 1fr))` }}
            >
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/produtos?category=${cat.slug}`}
                  className="group flex flex-col items-center gap-4 py-8 px-4"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--line-soft)",
                    borderRadius: "var(--r-lg)",
                    textDecoration: "none",
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "50%",
                      border: "1px solid var(--line-soft)",
                      background: "var(--bg-2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.2s, border-color 0.2s",
                    }}
                  >
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--gold)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={getCategoryIcon(cat.slug)} />
                    </svg>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 15,
                        fontWeight: 500,
                        color: "var(--ink)",
                        marginBottom: 4,
                      }}
                    >
                      {cat.name}
                    </div>
                    <div className="t-eyebrow" style={{ fontSize: 9, color: "var(--muted)" }}>
                      {cat._count.products} {cat._count.products === 1 ? "peça" : "peças"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Grid de produtos ──────────────────────────────── */}
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
              {products.map((p) => (
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
                  </div>
                  <div className="flex justify-between items-baseline">
                    <div
                      className="font-medium truncate mr-2"
                      style={{ fontFamily: "var(--font-display)", fontSize: 16, lineHeight: 1.2 }}
                    >
                      {p.name}
                    </div>
                    <div className="text-sm font-medium shrink-0">{formatCurrency(p.priceBase)}</div>
                  </div>
                  <div className="t-eyebrow mt-1.5" style={{ fontSize: 9 }}>
                    {p.productionDays}d úteis · personalizável
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

      {/* ── C2: UGC — Barbeiros que vestem Triade ─────────── */}
      <section
        className="py-16 md:py-24 px-5 md:px-8 grain"
        style={{ background: "var(--ink)", borderBottom: "1px solid rgba(246,242,236,0.08)" }}
      >
        <div className="max-w-[1440px] mx-auto relative z-10">
          <div className="text-center mb-10 md:mb-14">
            <div className="t-eyebrow mb-3" style={{ color: "var(--gold)" }}>— Comunidade</div>
            <h2 className="t-display" style={{ fontSize: "clamp(28px, 5vw, 52px)", color: "var(--bg)" }}>
              Barbeiros que vestem{" "}
              <span className="t-display-italic" style={{ color: "var(--gold)" }}>Triade</span>
            </h2>
          </div>

          {/* Placeholder cards — will be replaced with real content */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { initials: "MB", name: "Marcel Barbeiro", city: "São Paulo, SP" },
              { initials: "RB", name: "Rodrigo Borges", city: "Rio de Janeiro, RJ" },
              { initials: "TL", name: "Thiago Lima", city: "Belo Horizonte, MG" },
              { initials: "AC", name: "André Costa", city: "Curitiba, PR" },
            ].map(({ initials, name, city }) => (
              <div
                key={name}
                className="mockup-bg"
                style={{
                  aspectRatio: "3/4",
                  background: "rgba(246,242,236,0.05)",
                  border: "1px solid rgba(246,242,236,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  padding: 16,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Avatar placeholder */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -60%)",
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "rgba(168,130,58,0.2)",
                    border: "1px solid var(--gold)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-display)",
                    fontSize: 20,
                    color: "var(--gold)",
                    opacity: 0.7,
                  }}
                >
                  {initials}
                </div>

                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: 13,
                      color: "var(--bg)",
                      marginBottom: 2,
                    }}
                  >
                    {name}
                  </div>
                  <div className="t-eyebrow" style={{ fontSize: 8, color: "rgba(246,242,236,0.45)" }}>
                    {city}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p
              className="t-eyebrow"
              style={{ color: "rgba(246,242,236,0.35)", fontSize: 9 }}
            >
              Marque @triadeselect para aparecer aqui
            </p>
          </div>
        </div>
      </section>

      {/* ── Banner B2B ─────────────────────────────────────── */}
      <section className="px-5 md:px-8 py-6 md:py-8" style={{ borderBottom: "1px solid var(--line-soft)" }}>
        <div
          className="max-w-[1440px] mx-auto grain relative overflow-hidden px-6 py-12 md:px-16 md:py-20"
          style={{ background: "var(--ink)", color: "var(--bg)" }}
        >
          <div className="relative z-10 max-w-2xl">
            <div className="t-eyebrow mb-4" style={{ color: "var(--gold)" }}>
              {cfg.b2b_eyebrow || "— Programa B2B"}
            </div>
            <h2 className="t-display mb-5" style={{ fontSize: "clamp(32px, 5vw, 64px)", color: "var(--bg)" }}>
              {cfg.b2b_title ? (
                cfg.b2b_title
              ) : (
                <>
                  Sua barbearia{" "}
                  <span className="t-display-italic" style={{ color: "var(--gold)" }}>merece</span>{" "}
                  um uniforme exclusivo.
                </>
              )}
            </h2>
            <p
              className="text-sm leading-relaxed mb-8 max-w-md"
              style={{ color: "rgba(246,242,236,0.65)" }}
            >
              {cfg.b2b_subtitle || "Cadastre sua barbearia e receba condições especiais em pedidos recorrentes, priority production e consultoria de identidade visual."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/cadastro">
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  style={{ background: "var(--bg)", color: "var(--ink)", borderColor: "var(--bg)" } as React.CSSProperties}
                >
                  {cfg.b2b_cta || "Abrir conta B2B"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer editorial ───────────────────────────────── */}
      <footer
        className="px-5 md:px-8 py-12 md:py-16 mt-auto"
        style={{ background: "var(--ink)", color: "var(--bg)" }}
      >
        <div className="max-w-[1440px] mx-auto">
          <TriangleMark size={28} color="var(--bg)" />
          <p className="t-display mt-4 mb-10 max-w-xs" style={{ fontSize: "clamp(18px, 3vw, 26px)", color: "var(--bg)" }}>
            {cfg.footer_tagline
              ? cfg.footer_tagline
              : <><span className="t-display-italic">Feito</span> para quem leva a barbearia a sério.</>
            }
          </p>

          {footerLinks.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-1 text-[13px] transition-opacity hover:opacity-100"
                  style={{ color: "rgba(246,242,236,0.75)" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          <div
            className="pt-5 t-mono text-[10px] tracking-[0.12em] uppercase"
            style={{ borderTop: "1px solid rgba(246,242,236,0.12)", color: "rgba(246,242,236,0.35)" }}
          >
            {cfg.footer_copy || `© ${new Date().getFullYear()} Triade Select — Todos os direitos reservados`}
          </div>
        </div>
      </footer>
    </div>
  );
}
