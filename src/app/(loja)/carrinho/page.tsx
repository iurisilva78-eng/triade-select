"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";

export default function CarrinhoPage() {
  const { items, removeItem, updateQuantity, total } = useCartStore();

  if (items.length === 0) {
    return (
      <div
        style={{
          background: "var(--bg)",
          color: "var(--ink)",
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: "80px 32px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p className="t-eyebrow mb-4">— Sacola vazia</p>
          <h1
            className="t-display"
            style={{ fontSize: "clamp(36px,5vw,56px)", margin: "0 0 16px", lineHeight: 0.95 }}
          >
            Sua{" "}
            <span className="t-display-italic" style={{ color: "var(--gold)" }}>
              sacola
            </span>{" "}
            está vazia.
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 40 }}>
            Adicione produtos para continuar.
          </p>
          <Link href="/produtos">
            <button
              style={{
                padding: "16px 32px",
                background: "var(--ink)",
                color: "var(--bg)",
                border: "1px solid var(--ink)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: "var(--r-sm)",
              }}
            >
              Explorar coleção →
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const sub = total();

  return (
    <div style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <section style={{ padding: "32px 32px 96px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          {/* Title */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 40,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <h1
              className="t-display"
              style={{ fontSize: "clamp(48px,7vw,72px)", margin: 0, lineHeight: 0.95 }}
            >
              Sua{" "}
              <span className="t-display-italic">sacola</span>
            </h1>
            <p className="t-eyebrow">
              {items.length} {items.length === 1 ? "item" : "itens"}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.6fr) minmax(0,1fr)",
              gap: 64,
            }}
            className="max-md:grid-cols-1 max-md:gap-10"
          >
            {/* Items list */}
            <div>
              {items.map((item, idx) => (
                <div
                  key={item.productId}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr auto",
                    gap: 24,
                    padding: "28px 0",
                    borderTop: "1px solid var(--line-soft)",
                    borderBottom:
                      idx === items.length - 1 ? "1px solid var(--line-soft)" : undefined,
                    alignItems: "start",
                  }}
                  className="max-sm:grid-cols-1"
                >
                  {/* Image */}
                  <div
                    className="mockup-bg"
                    style={{ aspectRatio: "3/4", overflow: "hidden", flexShrink: 0 }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          mixBlendMode: "multiply",
                        }}
                      />
                    ) : null}
                  </div>

                  {/* Info */}
                  <div>
                    <p className="t-eyebrow mb-1.5">{item.productId.slice(0, 8).toUpperCase()}</p>
                    <div
                      className="t-display"
                      style={{ fontSize: 24, marginBottom: 10, lineHeight: 1.1 }}
                    >
                      {item.name}
                    </div>

                    {/* Attributes */}
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6, lineHeight: 1.8 }}>
                      {item.selectedColor && (
                        <span>
                          Cor: <span style={{ color: "var(--ink)" }}>{item.selectedColor}</span>
                          {(item.selectedSize || item.selectedClosure) && " · "}
                        </span>
                      )}
                      {item.selectedSize && (
                        <span>
                          Tamanho: <span style={{ color: "var(--ink)" }}>{item.selectedSize}</span>
                          {item.selectedClosure && " · "}
                        </span>
                      )}
                      {item.selectedClosure && (
                        <span>
                          Fechamento: <span style={{ color: "var(--ink)" }}>{item.selectedClosure}</span>
                        </span>
                      )}
                    </div>

                    {item.hasCustomization && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--gold)",
                          marginBottom: 12,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        ✦ Personalização com logo
                      </div>
                    )}

                    {/* Qty + remove */}
                    <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 20 }}>
                      <div
                        style={{
                          display: "flex",
                          border: "1px solid var(--line-soft)",
                          alignItems: "center",
                        }}
                      >
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          style={{
                            width: 36,
                            height: 36,
                            border: 0,
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: 16,
                            color: "var(--ink)",
                          }}
                        >
                          −
                        </button>
                        <div
                          className="t-mono"
                          style={{ width: 36, textAlign: "center", fontSize: 13 }}
                        >
                          {item.quantity}
                        </div>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          style={{
                            width: 36,
                            height: 36,
                            border: 0,
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: 16,
                            color: "var(--ink)",
                          }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.productId)}
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "var(--muted)",
                          background: "transparent",
                          border: 0,
                          borderBottom: "1px solid var(--line-soft)",
                          padding: "2px 0",
                          cursor: "pointer",
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  {/* Price */}
                  <div
                    className="t-display"
                    style={{ fontSize: 22, textAlign: "right", whiteSpace: "nowrap" }}
                  >
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar summary */}
            <aside style={{ position: "sticky", top: 100, alignSelf: "start" }}>
              <div style={{ border: "1px solid var(--line-soft)", padding: 32 }}>
                <h2
                  className="t-display"
                  style={{ fontSize: 28, margin: "0 0 24px" }}
                >
                  Resumo
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        color: "var(--muted)",
                      }}
                    >
                      <span style={{ marginRight: 8 }}>
                        {item.name} × {item.quantity}
                      </span>
                      <span style={{ flexShrink: 0 }}>
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 13,
                    color: "var(--muted)",
                    paddingBottom: 8,
                  }}
                >
                  <span>Frete</span>
                  <span>Calculado no checkout</span>
                </div>

                <hr style={{ border: 0, borderTop: "1px solid var(--line-hair)", margin: "16px 0" }} />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 28,
                  }}
                >
                  <p className="t-eyebrow">Total estimado</p>
                  <div className="t-display" style={{ fontSize: 32 }}>
                    {formatCurrency(sub)}
                  </div>
                </div>

                <Link href="/checkout">
                  <button
                    style={{
                      width: "100%",
                      padding: "16px 24px",
                      background: "var(--ink)",
                      color: "var(--bg)",
                      border: "1px solid var(--ink)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      borderRadius: "var(--r-sm)",
                      marginBottom: 12,
                    }}
                  >
                    Finalizar pedido →
                  </button>
                </Link>

                <Link href="/produtos">
                  <button
                    style={{
                      width: "100%",
                      padding: "14px 24px",
                      background: "transparent",
                      color: "var(--muted)",
                      border: "1px solid var(--line-soft)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      borderRadius: "var(--r-sm)",
                    }}
                  >
                    ← Continuar comprando
                  </button>
                </Link>

                {/* Gold info bar */}
                <div
                  style={{
                    marginTop: 24,
                    padding: 16,
                    background: "var(--bg-2)",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 1,
                      minHeight: 36,
                      background: "var(--gold)",
                      flexShrink: 0,
                    }}
                  />
                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--ink-soft)",
                      margin: 0,
                      lineHeight: 1.6,
                    }}
                  >
                    <strong>Entrada de 50%</strong> inicia a produção.
                    Saldo cobrado ao envio. Prazo médio de 15 dias úteis.
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
