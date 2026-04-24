import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string };
}) {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(searchParams.search
        ? { name: { contains: searchParams.search, mode: "insensitive" } }
        : {}),
    },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

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

      {/* Divider */}
      <div className="px-5 md:px-8" style={{ borderBottom: "1px solid var(--line-soft)" }}>
        <div className="max-w-[1440px] mx-auto" />
      </div>

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6">
              {products.map((product) => (
                <Link key={product.id} href={`/produto/${product.slug}`} className="group block">
                  {/* Image */}
                  <div
                    className="mockup-bg relative overflow-hidden mb-4"
                    style={{ aspectRatio: "3/4" }}
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
                        <svg
                          width="48"
                          height="48"
                          viewBox="0 0 100 100"
                          fill="none"
                          style={{ opacity: 0.2 }}
                        >
                          <polygon
                            points="50,8 90,80 10,80"
                            stroke="currentColor"
                            strokeWidth="5"
                            fill="none"
                            strokeLinejoin="round"
                          />
                          <polygon
                            points="50,28 78,75 22,75"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    )}
                    {/* Category tag */}
                    <div
                      className="absolute top-3 left-3 t-mono"
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--gold)",
                        borderBottom: "1px solid var(--gold)",
                        paddingBottom: 2,
                      }}
                    >
                      {product.category.name}
                    </div>
                    {/* Category code */}
                    <div
                      className="absolute bottom-3 left-3 t-mono"
                      style={{ fontSize: 10, color: "var(--muted)", letterSpacing: "0.12em" }}
                    >
                      {product.category.name.slice(0, 3).toUpperCase()}-{product.id.slice(0, 4).toUpperCase()}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex justify-between items-baseline">
                    <div
                      className="t-display"
                      style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em" }}
                    >
                      {product.name}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, flexShrink: 0, marginLeft: 8 }}>
                      {formatCurrency(product.priceBase)}
                    </div>
                  </div>
                  <p
                    className="t-eyebrow mt-1.5"
                    style={{ color: "var(--muted)" }}
                  >
                    {product.productionDays}d · {product.allowsCustomization ? "personalizável" : "sem personalização"}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
