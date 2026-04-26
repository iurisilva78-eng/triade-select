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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-7 md:gap-5">
              {products.map((product) => (
                <Link key={product.id} href={`/produto/${product.slug}`} className="group flex flex-col">

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
                      <div className="shrink-0 t-mono" style={{ fontSize: 12, fontWeight: 600 }}>
                        {formatCurrency(product.priceBase)}
                      </div>
                    </div>
                    <p className="t-eyebrow mt-1" style={{ color: "var(--muted)" }}>
                      {product.productionDays}d · {product.allowsCustomization ? "personalizável" : "—"}
                    </p>
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
                    {/* Mini color strip — fotos das cores */}
                    {product.images.length > 1 && (
                      <div className="absolute bottom-0 left-0 right-0 flex">
                        {product.images.slice(0, 4).map((img, i) => (
                          <div key={i} className="flex-1 overflow-hidden" style={{ height: 28 }}>
                            <img src={img} alt="" className="w-full h-full object-cover" style={{ mixBlendMode: "multiply" }} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
