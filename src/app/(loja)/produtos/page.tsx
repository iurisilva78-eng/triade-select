import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const COLOR_MAP: Record<string, string> = {
  "preto": "#1a1a1a", "branco": "#f5f5f0", "branco off-white": "#f0ebe0",
  "cinza": "#8a8a8a", "cinza claro": "#c8c8c8", "cinza escuro": "#3d3d3d",
  "azul": "#1e40af", "azul marinho": "#0d1b3e", "azul royal": "#2563eb",
  "azul claro": "#60a5fa", "azul petróleo": "#164e63",
  "verde": "#15803d", "verde militar": "#4a5c2e", "verde escuro": "#14532d",
  "vermelho": "#dc2626", "bordo": "#7f1d1d", "vinho": "#881337",
  "rosa": "#ec4899", "rosa claro": "#fbcfe8", "roxo": "#7c3aed",
  "laranja": "#ea580c", "amarelo": "#eab308",
  "bege": "#d4b896", "marrom": "#92400e", "caqui": "#c3a882",
  "dourado": "#b8860b", "prata": "#b0b0b0",
};
const getColorCss = (name: string) => COLOR_MAP[name.toLowerCase()] ?? "#ccc";

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string };
}) {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      include: { _count: { select: { products: { where: { active: true } } } } },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: {
        active: true,
        ...(searchParams.category ? { category: { slug: searchParams.category } } : {}),
        ...(searchParams.search
          ? { name: { contains: searchParams.search, mode: "insensitive" } }
          : {}),
      },
      include: {
        category: true,
        _count: { select: { orderItems: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // "MAIS PEDIDO" — top 2 products by order count (only if actually ordered)
  const sortedByOrders = [...products].sort((a, b) => b._count.orderItems - a._count.orderItems);
  const topSellerIds = new Set(
    sortedByOrders.slice(0, 2).filter((p) => p._count.orderItems > 0).map((p) => p.id)
  );

  // "NOVIDADE" — created in last 60 days
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const getBadge = (product: { id: string; createdAt: Date }): string | null => {
    if (topSellerIds.has(product.id)) return "MAIS PEDIDO";
    if (product.createdAt > sixtyDaysAgo) return "NOVIDADE";
    return null;
  };

  const totalActive = categories.reduce((sum, c) => sum + c._count.products, 0);

  return (
    <div style={{ background: "var(--bg)", color: "var(--ink)" }}>
      {/* Collection header */}
      <section className="px-5 md:px-8 pt-8 pb-6">
        <div className="max-w-[1440px] mx-auto flex justify-between items-end flex-wrap gap-6">
          <div>
            <p className="t-eyebrow mb-3">— Coleção permanente</p>
            <h1
              className="t-display m-0"
              style={{ fontSize: "clamp(40px,6vw,80px)", lineHeight: 0.95 }}
            >
              Toda a{" "}
              <span className="t-display-italic" style={{ color: "var(--gold)" }}>
                coleção
              </span>
              .
            </h1>
          </div>
          <p className="t-eyebrow">{products.length} peças</p>
        </div>
      </section>

      {/* ── A1: Category filter tabs ───────────────────────── */}
      <section className="px-5 md:px-8 py-4" style={{ borderBottom: "1px solid var(--line-soft)" }}>
        <div className="max-w-[1440px] mx-auto">
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            <Link
              href="/produtos"
              className="t-mono shrink-0"
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "8px 16px",
                border: `1px solid ${!searchParams.category ? "var(--ink)" : "var(--line-soft)"}`,
                background: !searchParams.category ? "var(--ink)" : "transparent",
                color: !searchParams.category ? "var(--bg)" : "var(--muted)",
                borderRadius: "var(--r-sm)",
                whiteSpace: "nowrap",
                textDecoration: "none",
                transition: "background 0.15s, border-color 0.15s",
              }}
            >
              Todos · {totalActive}
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/produtos?category=${cat.slug}`}
                className="t-mono shrink-0"
                style={{
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "8px 16px",
                  border: `1px solid ${searchParams.category === cat.slug ? "var(--ink)" : "var(--line-soft)"}`,
                  background: searchParams.category === cat.slug ? "var(--ink)" : "transparent",
                  color: searchParams.category === cat.slug ? "var(--bg)" : "var(--muted)",
                  borderRadius: "var(--r-sm)",
                  whiteSpace: "nowrap",
                  textDecoration: "none",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                {cat.name} · {cat._count.products}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="px-5 md:px-8 py-10" style={{ paddingBottom: 96 }}>
        <div className="max-w-[1440px] mx-auto">
          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="t-eyebrow mb-4">Nenhum produto encontrado</p>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>
                Volte em breve para novidades da coleção.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-7 md:gap-5">
              {products.map((product) => {
                const badge = getBadge(product);
                return (
                  <Link
                    key={product.id}
                    href={`/produto/${product.slug}`}
                    className="group flex flex-col"
                    style={{ textDecoration: "none" }}
                  >
                    {/* ── Info (aparece primeiro no mobile) ── */}
                    <div className="order-1 md:order-2 mb-2 md:mb-0 md:mt-3">
                      <p className="t-eyebrow mb-1" style={{ fontSize: 9, color: "var(--gold)" }}>
                        — {product.category.name}
                      </p>
                      <div className="flex justify-between items-baseline gap-1">
                        <div
                          className="t-display line-clamp-2"
                          style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-0.01em", lineHeight: 1.25 }}
                        >
                          {product.name}
                        </div>
                        {/* A4: "a partir de" prefix */}
                        <div className="shrink-0" style={{ textAlign: "right" }}>
                          <div
                            className="t-eyebrow"
                            style={{ fontSize: 8, color: "var(--muted)", display: "block", marginBottom: 1 }}
                          >
                            a partir de
                          </div>
                          <div className="t-mono" style={{ fontSize: 12, fontWeight: 600 }}>
                            {formatCurrency(product.priceBase)}
                          </div>
                        </div>
                      </div>
                      <p className="t-eyebrow mt-1" style={{ color: "var(--muted)" }}>
                        {product.productionDays}d · {product.allowsCustomization ? "personalizável" : "—"}
                      </p>

                      {/* A3: Circular color swatches */}
                      {product.availableColors.length > 0 && (
                        <div
                          style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6, flexWrap: "wrap" }}
                        >
                          {product.availableColors.slice(0, 7).map((color) => (
                            <div
                              key={color}
                              title={color}
                              style={{
                                width: 13,
                                height: 13,
                                borderRadius: "50%",
                                background: getColorCss(color),
                                border: "1px solid rgba(14,14,14,0.15)",
                                flexShrink: 0,
                              }}
                            />
                          ))}
                          {product.availableColors.length > 7 && (
                            <span
                              className="t-mono"
                              style={{ fontSize: 8, color: "var(--muted)", lineHeight: 1 }}
                            >
                              +{product.availableColors.length - 7}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ── Imagem (aparece depois no mobile) ── */}
                    <div
                      className="mockup-bg relative overflow-hidden order-2 md:order-1 aspect-square md:aspect-[3/4]"
                    >
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          style={{ mixBlendMode: "multiply" }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg width="36" height="36" viewBox="0 0 100 100" fill="none" style={{ opacity: 0.2 }}>
                            <polygon points="50,8 90,80 10,80" stroke="currentColor" strokeWidth="5" fill="none" strokeLinejoin="round" />
                            <polygon points="50,28 78,75 22,75" stroke="currentColor" strokeWidth="4" fill="none" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}

                      {/* A2: Badge overlay */}
                      {badge && (
                        <div
                          className="t-mono"
                          style={{
                            position: "absolute",
                            top: 10,
                            left: 10,
                            fontSize: 8,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            padding: "5px 10px",
                            background: badge === "MAIS PEDIDO" ? "var(--gold)" : "var(--ink)",
                            color: badge === "MAIS PEDIDO" ? "#000" : "var(--bg)",
                            borderRadius: "var(--r-xs)",
                          }}
                        >
                          {badge}
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
