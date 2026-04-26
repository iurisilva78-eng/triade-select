"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";

export default function CarrinhoPage() {
  const { items, removeItem, updateQuantity, total } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="px-4 md:px-8 py-20 flex flex-col items-center justify-center text-center" style={{ background: "var(--bg)", color: "var(--ink)", minHeight: "60vh" }}>
        <p className="t-eyebrow mb-4">— Sacola vazia</p>
        <h1 className="t-display" style={{ fontSize: "clamp(32px,5vw,56px)", margin: "0 0 16px", lineHeight: 0.95 }}>
          Sua <span className="t-display-italic" style={{ color: "var(--gold)" }}>sacola</span> está vazia.
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>
          Adicione produtos para continuar.
        </p>
        <Link href="/produtos">
          <button style={{ padding: "16px 32px", background: "var(--ink)", color: "var(--bg)", border: "1px solid var(--ink)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", borderRadius: "var(--r-sm)" }}>
            Explorar coleção →
          </button>
        </Link>
      </div>
    );
  }

  const sub = total();

  return (
    <div style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <section className="px-4 md:px-8 pt-8 pb-24">
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>

          {/* Title */}
          <div className="flex justify-between items-baseline flex-wrap gap-3 mb-8 md:mb-10">
            <h1 className="t-display" style={{ fontSize: "clamp(36px,6vw,72px)", margin: 0, lineHeight: 0.95 }}>
              Sua <span className="t-display-italic">sacola</span>
            </h1>
            <p className="t-eyebrow">{items.length} {items.length === 1 ? "item" : "itens"}</p>
          </div>

          {/* Outer grid — 1 col mobile, 2 col desktop */}
          <div className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr] gap-10 md:gap-16">

            {/* Items list */}
            <div>
              {items.map((item, idx) => (
                <div
                  key={item.productId}
                  className="grid gap-4 py-6 items-start"
                  style={{
                    gridTemplateColumns: "80px 1fr",
                    borderTop: "1px solid var(--line-soft)",
                    borderBottom: idx === items.length - 1 ? "1px solid var(--line-soft)" : undefined,
                  }}
                >
                  {/* Image */}
                  <div className="mockup-bg" style={{ aspectRatio: "3/4", overflow: "hidden" }}>
                    {item.image && (
                      <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "multiply" }} />
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <p className="t-eyebrow mb-1">{item.productId.slice(0, 8).toUpperCase()}</p>
                    <div className="t-display" style={{ fontSize: "clamp(16px,3vw,22px)", marginBottom: 8, lineHeight: 1.15 }}>
                      {item.name}
                    </div>

                    {/* Price — inline on mobile */}
                    <div className="t-display" style={{ fontSize: 20, color: "var(--ink)", marginBottom: 8 }}>
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </div>

                    {/* Attributes */}
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6, lineHeight: 1.8 }}>
                      {item.selectedColor && <span>Cor: <span style={{ color: "var(--ink)" }}>{item.selectedColor}</span>{(item.selectedSize || item.selectedClosure) && " · "}</span>}
                      {item.selectedSize && <span>Tamanho: <span style={{ color: "var(--ink)" }}>{item.selectedSize}</span>{item.selectedClosure && " · "}</span>}
                      {item.selectedClosure && <span>Fechamento: <span style={{ color: "var(--ink)" }}>{item.selectedClosure}</span></span>}
                    </div>

                    {item.hasCustomization && (
                      <div style={{ fontSize: 11, color: "var(--gold)", marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
                        ✦ Personalização com logo
                      </div>
                    )}

                    {/* Qty + remove */}
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", border: "1px solid var(--line-soft)", alignItems: "center" }}>
                        <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} style={{ width: 36, height: 36, border: 0, background: "transparent", cursor: "pointer", fontSize: 16, color: "var(--ink)" }}>−</button>
                        <div className="t-mono" style={{ width: 32, textAlign: "center", fontSize: 13 }}>{item.quantity}</div>
                        <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} style={{ width: 36, height: 36, border: 0, background: "transparent", cursor: "pointer", fontSize: 16, color: "var(--ink)" }}>+</button>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId)}
                        style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", background: "transparent", border: 0, borderBottom: "1px solid var(--line-soft)", padding: "2px 0", cursor: "pointer" }}
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar summary */}
            <aside style={{ position: "sticky", top: 100, alignSelf: "start" }}>
              <div className="p-5 md:p-8" style={{ border: "1px solid var(--line-soft)" }}>
                <h2 className="t-display" style={{ fontSize: 26, margin: "0 0 20px" }}>Resumo</h2>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                  {items.map((item) => (
                    <div key={item.productId} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)" }}>
                      <span style={{ marginRight: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{item.name} × {item.quantity}</span>
                      <span style={{ flexShrink: 0 }}>{formatCurrency(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--muted)", paddingBottom: 8 }}>
                  <span>Frete</span>
                  <span>Calculado no checkout</span>
                </div>

                <hr style={{ border: 0, borderTop: "1px solid var(--line-hair)", margin: "14px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 24 }}>
                  <p className="t-eyebrow">Total estimado</p>
                  <div className="t-display" style={{ fontSize: 28 }}>{formatCurrency(sub)}</div>
                </div>

                <Link href="/checkout">
                  <button style={{ width: "100%", padding: "16px 24px", background: "var(--ink)", color: "var(--bg)", border: "1px solid var(--ink)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", borderRadius: "var(--r-sm)", marginBottom: 10 }}>
                    Finalizar pedido →
                  </button>
                </Link>

                <Link href="/produtos">
                  <button style={{ width: "100%", padding: "14px 24px", background: "transparent", color: "var(--muted)", border: "1px solid var(--line-soft)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", borderRadius: "var(--r-sm)" }}>
                    ← Continuar comprando
                  </button>
                </Link>

                {/* Gold info bar */}
                <div style={{ marginTop: 20, padding: 14, background: "var(--bg-2)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 1, minHeight: 32, background: "var(--gold)", flexShrink: 0 }} />
                  <p style={{ fontSize: 12, color: "var(--ink-soft)", margin: 0, lineHeight: 1.6 }}>
                    <strong>Entrada de 50%</strong> inicia a produção. Saldo cobrado ao envio. Prazo médio de 15 dias úteis.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
