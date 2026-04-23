import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Tag, Clock } from "lucide-react";
// searchParams kept for future search feature

export const dynamic = "force-dynamic";


export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string };
}) {
  const [products] = await Promise.all([
    prisma.product.findMany({
      where: {
        active: true,
        ...(searchParams.search
          ? { name: { contains: searchParams.search, mode: "insensitive" } }
          : {}),
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--text)] mb-3">
          Produtos <span className="text-[var(--gold)]">Profissionais</span>
        </h1>
        <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
          Capas, uniformes e aventais para barbearias. Com ou sem personalização.
          Prazo médio de{" "}
          <strong className="text-[var(--gold)]">15 dias úteis</strong>.
        </p>
      </div>


      {/* Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-lg">Nenhum produto encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/produto/${product.slug}`}>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--gold)]/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--gold)]/5 cursor-pointer h-full flex flex-col">
                {/* Imagem */}
                <div className="aspect-square bg-[var(--surface-2)] flex items-center justify-center text-6xl">
                  {product.images[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "🧣"
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--gold)] font-medium bg-[var(--gold)]/10 px-2 py-0.5 rounded-full">
                      {product.category.name}
                    </span>
                    {product.allowsCustomization && (
                      <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <Tag size={10} /> Personalizável
                      </span>
                    )}
                  </div>

                  <h2 className="font-semibold text-[var(--text)] text-base leading-snug">
                    {product.name}
                  </h2>

                  <p className="text-sm text-[var(--text-secondary)] line-clamp-2 flex-1">
                    {product.description}
                  </p>

                  <div className="flex items-end justify-between mt-2 pt-2 border-t border-[var(--border)]">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">A partir de</p>
                      <p className="text-lg font-bold text-[var(--gold)]">
                        {formatCurrency(product.priceBase)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Clock size={12} />
                      {product.productionDays}d úteis
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
