"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft } from "lucide-react";

export default function CarrinhoPage() {
  const { items, removeItem, updateQuantity, total } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <ShoppingBag size={64} className="mx-auto text-[var(--text-muted)] mb-4" />
        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Carrinho vazio</h1>
        <p className="text-[var(--text-secondary)] mb-6">Adicione produtos para continuar.</p>
        <Link href="/produtos">
          <Button size="lg">Ver produtos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-6">
        Carrinho ({items.length} {items.length === 1 ? "item" : "itens"})
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Itens */}
        <div className="md:col-span-2 flex flex-col gap-4">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex gap-4"
            >
              {/* Imagem */}
              <div className="w-20 h-20 bg-[var(--surface-2)] rounded-xl flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  "🧣"
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--text)]">{item.name}</p>
                {item.hasCustomization && (
                  <p className="text-xs text-[var(--gold)] mt-0.5">✓ Com personalização</p>
                )}
                {item.logoFileName && (
                  <p className="text-xs text-[var(--text-muted)] truncate">📎 {item.logoFileName}</p>
                )}
                {(item.selectedColor || item.selectedSize || item.selectedClosure) && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {item.selectedColor && (
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">🎨 {item.selectedColor}</span>
                    )}
                    {item.selectedSize && (
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">📐 {item.selectedSize}</span>
                    )}
                    {item.selectedClosure && (
                      <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-white/60">🔗 {item.selectedClosure}</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  {/* Quantidade */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm font-bold hover:border-[var(--gold)] transition-colors flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm font-bold hover:border-[var(--gold)] transition-colors flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="font-bold text-[var(--gold)]">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </p>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumo */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 h-fit">
          <h2 className="font-bold text-[var(--text)] mb-4">Resumo do pedido</h2>

          <div className="flex flex-col gap-2 text-sm mb-4">
            {items.map((item) => (
              <div key={item.productId} className="flex justify-between text-[var(--text-secondary)]">
                <span className="truncate mr-2">
                  {item.name} × {item.quantity}
                </span>
                <span className="flex-shrink-0">{formatCurrency(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border)] pt-3 mb-1">
            <div className="flex justify-between text-sm text-[var(--text-secondary)]">
              <span>Subtotal</span>
              <span>{formatCurrency(total())}</span>
            </div>
            <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
              <span>Frete</span>
              <span>Calculado no checkout</span>
            </div>
          </div>

          <div className="flex justify-between font-bold text-[var(--text)] text-lg mt-3 mb-5">
            <span>Total</span>
            <span className="text-[var(--gold)]">{formatCurrency(total())}</span>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-5 text-xs text-amber-300">
            💡 Mínimo de <strong>50%</strong> para iniciar a produção.
            Prazo: ~15 dias úteis.
          </div>

          <Link href="/checkout">
            <Button size="lg" className="w-full">
              Finalizar pedido <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/produtos">
            <Button size="lg" variant="outline" className="w-full mt-3 flex items-center gap-2 justify-center">
              <ArrowLeft size={16} /> Continuar comprando
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
