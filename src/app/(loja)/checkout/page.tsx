"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import type { FreightOption, AddressData } from "@/types";
import { Check, X, Tag, Lock } from "lucide-react";

/* ─── Shared input style ─────────────────────────── */
const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  border: "1px solid var(--line-soft)",
  background: "transparent",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  outline: "none",
  color: "var(--ink)",
  borderRadius: "var(--r-sm)",
  boxSizing: "border-box",
};

/* ─── Triangle wordmark ─────────────────────────── */
function TriangleMark({ size = 20, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <polygon points="50,8 90,80 10,80" stroke={color} strokeWidth="5" fill="none" strokeLinejoin="round" />
      <polygon points="50,28 78,75 22,75" stroke={color} strokeWidth="4" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Field with eyebrow label ─────────────────── */
function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  wide,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  wide?: boolean;
  disabled?: boolean;
}) {
  return (
    <div style={{ flex: wide ? 2 : 1 }}>
      <p className="t-eyebrow mb-2">{label}</p>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{ ...fieldStyle, color: disabled ? "var(--muted)" : "var(--ink)" }}
      />
    </div>
  );
}

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { items, total, clear } = useCartStore();

  const [cep, setCep]                     = useState("");
  const [address, setAddress]             = useState<AddressData | null>(null);
  const [number, setNumber]               = useState("");
  const [complement, setComplement]       = useState("");
  const [freightOptions, setFreightOptions] = useState<FreightOption[]>([]);
  const [selectedFreight, setSelectedFreight] = useState<FreightOption | null>(null);
  const [loadingCep, setLoadingCep]       = useState(false);
  const [loadingOrder, setLoadingOrder]   = useState(false);
  const [cepError, setCepError]           = useState("");

  // Coupon
  const [couponCode, setCouponCode]         = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponType, setCouponType]         = useState<"percent" | "fixed" | "shipping" | null>(null);
  const [couponApplied, setCouponApplied]   = useState("");
  const [loadingCoupon, setLoadingCoupon]   = useState(false);
  const [couponError, setCouponError]       = useState("");

  /* ── Not logged in ── */
  if (!session) {
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
          padding: 40,
          textAlign: "center",
        }}
      >
        <p className="t-eyebrow mb-2">— Checkout</p>
        <h1 className="t-display" style={{ fontSize: "clamp(36px,5vw,52px)", margin: 0, lineHeight: 0.95 }}>
          Login <span className="t-display-italic">necessário</span>.
        </h1>
        <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 360 }}>
          Faça login para finalizar seu pedido.
        </p>
        <Link href="/login">
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
            Entrar →
          </button>
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    router.push("/carrinho");
    return null;
  }

  const subtotal    = total();
  const freightCost = selectedFreight?.price ?? 0;
  const applyFreightDiscount = couponType === "shipping" ? Math.min(couponDiscount, freightCost) : 0;
  const applyCartDiscount    = couponType !== "shipping" ? couponDiscount : 0;
  const totalDiscount        = applyFreightDiscount + applyCartDiscount;
  const orderTotal           = Math.max(0, subtotal + freightCost - totalDiscount);
  const minimumPayment       = orderTotal * 0.5;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(""); setLoadingCoupon(true);
    const res  = await fetch("/api/coupon/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, orderTotal: subtotal + freightCost }),
    });
    const data = await res.json();
    setLoadingCoupon(false);
    if (!res.ok) { setCouponError(data.error ?? "Cupom inválido."); return; }
    setCouponDiscount(data.discount);
    setCouponType(data.type);
    setCouponApplied(data.code);
  };

  const removeCoupon = () => {
    setCouponCode(""); setCouponDiscount(0); setCouponType(null);
    setCouponApplied(""); setCouponError("");
  };

  const searchCep = async () => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) { setCepError("CEP inválido."); return; }
    setCepError(""); setLoadingCep(true); setFreightOptions([]); setSelectedFreight(null);
    try {
      const res  = await fetch("/api/freight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: clean, weightGrams: 500, heightCm: 10, widthCm: 20, lengthCm: 30 }),
      });
      const data = await res.json();
      if (!res.ok) { setCepError(data.error); return; }
      setAddress(data.address);
      setFreightOptions(data.options);
      setSelectedFreight(data.options[0]);
    } catch {
      setCepError("Erro ao calcular frete.");
    } finally {
      setLoadingCep(false);
    }
  };

  const handleFinalize = async () => {
    if (!address || !selectedFreight) { alert("Calcule o frete antes de continuar."); return; }
    if (!number)                       { alert("Informe o número do endereço."); return; }
    setLoadingOrder(true);
    try {
      const res  = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId, quantity: i.quantity,
            hasCustomization: i.hasCustomization, logoUrl: i.logoUrl,
            logoFileName: i.logoFileName, notes: i.notes,
            selectedColor: i.selectedColor, selectedSize: i.selectedSize,
            selectedClosure: i.selectedClosure,
          })),
          cep: address.cep, street: address.street, number, complement,
          neighborhood: address.neighborhood, city: address.city, state: address.state,
          freightService: selectedFreight.service, freightCost: selectedFreight.price,
          couponCode: couponApplied || undefined, couponDiscount: totalDiscount || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Erro ao criar pedido."); return; }
      clear();
      router.push(`/pedido/${data.id}`);
    } catch {
      alert("Erro ao finalizar pedido. Tente novamente.");
    } finally {
      setLoadingOrder(false);
    }
  };

  return (
    <div style={{ background: "var(--bg)", color: "var(--ink)", minHeight: "100vh" }}>
      {/* Simplified checkout header */}
      <header
        style={{
          borderBottom: "1px solid var(--line-hair)",
          padding: "18px 32px",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "var(--ink)" }}>
            <TriangleMark size={20} color="var(--gold)" />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 16, letterSpacing: "0.02em" }}>
              TRIADE <span style={{ fontStyle: "italic", fontWeight: 300, color: "var(--gold)" }}>select</span>
            </span>
          </Link>

          <div
            className="t-mono hidden md:flex"
            style={{ gap: 32, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" }}
          >
            {["Endereço", "Entrega", "Pagamento"].map((s, i) => (
              <div key={s} style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--muted)" }}>
                <span
                  style={{
                    width: 20, height: 20, borderRadius: "50%",
                    border: "1px solid var(--muted)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10,
                  }}
                >
                  {i + 1}
                </span>
                {s}
              </div>
            ))}
          </div>

          <div className="t-mono hidden md:flex" style={{ alignItems: "center", gap: 6, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)" }}>
            <Lock size={10} /> Conexão segura
          </div>
        </div>
      </header>

      <section style={{ padding: "40px 32px 96px" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)",
            gap: 64,
          }}
          className="max-md:grid-cols-1"
        >
          {/* ── Left: form ── */}
          <div>
            <p className="t-eyebrow mb-3">— Checkout</p>
            <h1
              className="t-display"
              style={{ fontSize: "clamp(36px,5vw,56px)", margin: "0 0 32px", lineHeight: 0.95 }}
            >
              Onde <span className="t-display-italic">entregamos</span>?
            </h1>

            {/* Address */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                <Field label="CEP" value={cep} onChange={setCep} placeholder="00000-000" />
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    onClick={searchCep}
                    disabled={loadingCep}
                    style={{
                      padding: "14px 24px",
                      background: "var(--ink)",
                      color: "var(--bg)",
                      border: "1px solid var(--ink)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      cursor: loadingCep ? "not-allowed" : "pointer",
                      borderRadius: "var(--r-sm)",
                      opacity: loadingCep ? 0.6 : 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {loadingCep ? "Buscando…" : "Buscar CEP"}
                  </button>
                </div>
              </div>
              {cepError && (
                <p style={{ fontSize: 12, color: "#c0392b", marginBottom: 12 }}>{cepError}</p>
              )}

              {address && (
                <>
                  <div
                    style={{
                      padding: "14px 16px",
                      border: "1px solid var(--line-soft)",
                      fontSize: 14,
                      color: "var(--muted)",
                      marginBottom: 14,
                      borderRadius: "var(--r-sm)",
                    }}
                  >
                    {address.street}, {address.neighborhood} — {address.city}/{address.state}
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Field label="Número" value={number} onChange={setNumber} placeholder="123" />
                    <Field label="Complemento" value={complement} onChange={setComplement} placeholder="Apto, sala..." wide />
                  </div>
                </>
              )}
            </div>

            {/* Freight */}
            {freightOptions.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <hr style={{ border: 0, borderTop: "1px solid var(--line-soft)", marginBottom: 24 }} />
                <p className="t-eyebrow mb-4">— Modo de envio</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {freightOptions.map((opt) => (
                    <label
                      key={opt.service}
                      style={{
                        display: "flex",
                        padding: 20,
                        border: `1px solid ${selectedFreight?.service === opt.service ? "var(--ink)" : "var(--line-soft)"}`,
                        alignItems: "center",
                        gap: 16,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        checked={selectedFreight?.service === opt.service}
                        onChange={() => setSelectedFreight(opt)}
                        style={{ accentColor: "var(--ink)" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div className="t-display" style={{ fontSize: 17 }}>{opt.name}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                          Prazo: {opt.deliveryDays} dias úteis após produção
                        </div>
                      </div>
                      <div className="t-display" style={{ fontSize: 20 }}>
                        {formatCurrency(opt.price)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Finalize button */}
            {address && selectedFreight && (
              <button
                onClick={handleFinalize}
                disabled={loadingOrder || !number}
                style={{
                  padding: "18px 40px",
                  background: loadingOrder || !number ? "var(--muted)" : "var(--ink)",
                  color: "var(--bg)",
                  border: "1px solid var(--ink)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: loadingOrder || !number ? "not-allowed" : "pointer",
                  borderRadius: "var(--r-sm)",
                  width: "100%",
                  marginTop: 8,
                }}
              >
                {loadingOrder ? "Finalizando…" : `Confirmar pedido · ${formatCurrency(orderTotal)}`}
              </button>
            )}

            <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 12, textAlign: "center" }}>
              Você receberá as instruções de pagamento pelo WhatsApp
            </p>
          </div>

          {/* ── Right: order summary ── */}
          <aside>
            <div
              style={{ border: "1px solid var(--line-soft)", padding: 28, position: "sticky", top: 100 }}
            >
              <h2 className="t-display" style={{ fontSize: 24, margin: "0 0 20px" }}>
                Resumo
              </h2>

              {/* Items */}
              <div style={{ marginBottom: 16 }}>
                {items.map((item, i) => (
                  <div
                    key={item.productId}
                    style={{
                      display: "flex",
                      gap: 12,
                      padding: "12px 0",
                      borderTop: i > 0 ? "1px solid var(--line-hair)" : undefined,
                    }}
                  >
                    <div
                      className="mockup-bg"
                      style={{ width: 52, height: 68, overflow: "hidden", flexShrink: 0 }}
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "multiply" }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                        Qtd. {item.quantity}
                        {item.hasCustomization && " · ✦ Personalizado"}
                      </div>
                    </div>
                    <div className="t-mono" style={{ fontSize: 13, flexShrink: 0 }}>
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              <hr style={{ border: 0, borderTop: "1px solid var(--line-hair)", margin: "12px 0" }} />

              {/* Coupon */}
              <div style={{ marginBottom: 16 }}>
                {couponApplied ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      border: "1px solid var(--line-soft)",
                      background: "var(--bg-2)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Tag size={13} style={{ color: "var(--gold)" }} />
                      <span
                        className="t-mono"
                        style={{ fontSize: 11, letterSpacing: "0.12em", color: "var(--gold)" }}
                      >
                        {couponApplied}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--gold)" }}>
                        −{formatCurrency(totalDiscount)}
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      style={{ background: "none", border: 0, cursor: "pointer", color: "var(--muted)" }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                      placeholder="CUPOM DE DESCONTO"
                      className="t-mono"
                      style={{
                        flex: 1,
                        padding: "12px 14px",
                        border: "1px solid var(--line-soft)",
                        background: "transparent",
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        outline: "none",
                        color: "var(--ink)",
                      }}
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={loadingCoupon || !couponCode.trim()}
                      style={{
                        padding: "12px 16px",
                        background: "transparent",
                        color: "var(--ink)",
                        border: "1px solid var(--ink)",
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                        opacity: loadingCoupon || !couponCode.trim() ? 0.5 : 1,
                      }}
                    >
                      {loadingCoupon ? "…" : "Aplicar"}
                    </button>
                  </div>
                )}
                {couponError && (
                  <p style={{ fontSize: 11, color: "#c0392b", marginTop: 6 }}>{couponError}</p>
                )}
              </div>

              {/* Totals */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
                  <span>Frete ({selectedFreight?.name ?? "—"})</span>
                  <span>{selectedFreight ? formatCurrency(freightCost) : "—"}</span>
                </div>
                {totalDiscount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--gold)" }}>
                    <span>Desconto</span>
                    <span>−{formatCurrency(totalDiscount)}</span>
                  </div>
                )}
              </div>

              <hr style={{ border: 0, borderTop: "1px solid var(--line-hair)", margin: "14px 0" }} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <p className="t-eyebrow">Total</p>
                <div className="t-display" style={{ fontSize: 28 }}>
                  {formatCurrency(orderTotal)}
                </div>
              </div>

              <div style={{ marginTop: 16, padding: "14px 16px", background: "var(--bg-2)", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 1, minHeight: 36, background: "var(--gold)", flexShrink: 0 }} />
                <div>
                  <p className="t-eyebrow" style={{ color: "var(--gold)", marginBottom: 4 }}>
                    Entrada de 50%
                  </p>
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
                    {formatCurrency(minimumPayment)} inicia a produção.
                    Saldo cobrado no envio.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
