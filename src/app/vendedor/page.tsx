"use client";

import { useState } from "react";
import { CheckCircle, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  priceBase: number;
  priceWithCustom: number;
  colorImages: Record<string, string>;
  allowsCustomization: boolean;
}

interface ItemEntry {
  productId: string;
  quantity: number;
  selectedColor: string;
  selectedSize: string;
  selectedClosure: string;
  hasCustomization: boolean;
  unitPriceOverride: string;
  notes: string;
}

const SIZES = ["P", "M", "G", "GG", "XG", "Único"];
const CLOSURES = ["Ajustável", "Snapback", "Fitted", "Sem aba"];
const PAY_METHODS = ["PIX", "Dinheiro", "Cartão de débito", "Cartão de crédito", "Fiado"];

function formatBRL(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function PinScreen({ onAuth }: { onAuth: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const tryPin = async (p: string) => {
    if (p.length < 4) return;
    setLoading(true);
    setError("");
    const res = await fetch(`/api/vendedor?pin=${p}`);
    if (res.ok) {
      onAuth(p);
    } else {
      setError("PIN incorreto. Tente novamente.");
      setPin("");
    }
    setLoading(false);
  };

  const handleDigit = (d: string) => {
    const next = pin + d;
    setPin(next);
    if (next.length === 4) tryPin(next);
  };

  const handleDel = () => setPin((p) => p.slice(0, -1));

  return (
    <div style={{
      minHeight: "100dvh",
      background: "#0a0a0a",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 32,
      padding: 24,
    }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#b89a4e", fontFamily: "monospace", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
          Triade Select
        </p>
        <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 700, margin: 0 }}>Vendedor</h1>
        <p style={{ color: "#555", fontSize: 14, marginTop: 6 }}>Digite seu PIN para acessar</p>
      </div>

      {/* PIN dots */}
      <div style={{ display: "flex", gap: 16 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            width: 18, height: 18, borderRadius: "50%",
            background: i < pin.length ? "#b89a4e" : "#222",
            border: "2px solid",
            borderColor: i < pin.length ? "#b89a4e" : "#333",
            transition: "all 0.15s",
          }} />
        ))}
      </div>

      {error && (
        <p style={{ color: "#e74c3c", fontSize: 13, textAlign: "center", margin: 0 }}>{error}</p>
      )}

      {/* Number pad */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, maxWidth: 240, width: "100%" }}>
        {[1,2,3,4,5,6,7,8,9].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(String(d))}
            disabled={loading || pin.length >= 4}
            style={{
              height: 64,
              background: "#161616",
              border: "1px solid #222",
              borderRadius: 12,
              color: "#fff",
              fontSize: 22,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.1s",
            }}
          >
            {d}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleDigit("0")}
          disabled={loading || pin.length >= 4}
          style={{
            height: 64,
            background: "#161616",
            border: "1px solid #222",
            borderRadius: 12,
            color: "#fff",
            fontSize: 22,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          0
        </button>
        <button
          onClick={handleDel}
          disabled={loading}
          style={{
            height: 64,
            background: "#161616",
            border: "1px solid #222",
            borderRadius: 12,
            color: "#888",
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          ⌫
        </button>
      </div>

      {loading && <p style={{ color: "#555", fontSize: 13 }}>Verificando…</p>}
    </div>
  );
}

export default function VendedorPage() {
  const [pin, setPin] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [step, setStep] = useState<"form" | "success">("form");
  const [orderNumber, setOrderNumber] = useState("");

  // Form fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [items, setItems] = useState<ItemEntry[]>([{
    productId: "",
    quantity: 1,
    selectedColor: "",
    selectedSize: "",
    selectedClosure: "",
    hasCustomization: false,
    unitPriceOverride: "",
    notes: "",
  }]);
  const [payMethod, setPayMethod] = useState("PIX");
  const [paidAmount, setPaidAmount] = useState("");
  const [totalOverride, setTotalOverride] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAuth = async (p: string) => {
    const res = await fetch(`/api/vendedor?pin=${p}`);
    const data = await res.json();
    setProducts(data);
    setPin(p);
  };

  const addItem = () => setItems((prev) => [...prev, {
    productId: "",
    quantity: 1,
    selectedColor: "",
    selectedSize: "",
    selectedClosure: "",
    hasCustomization: false,
    unitPriceOverride: "",
    notes: "",
  }]);

  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const updateItem = (i: number, patch: Partial<ItemEntry>) => {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, ...patch } : item));
  };

  const getProduct = (id: string) => products.find((p) => p.id === id);

  const getEffectivePrice = (item: ItemEntry) => {
    if (item.unitPriceOverride) return parseFloat(item.unitPriceOverride.replace(",", ".")) || 0;
    const p = getProduct(item.productId);
    if (!p) return 0;
    return item.hasCustomization ? p.priceWithCustom : p.priceBase;
  };

  const computedTotal = () => {
    if (totalOverride) return parseFloat(totalOverride.replace(",", ".")) || 0;
    return items.reduce((sum, item) => sum + getEffectivePrice(item) * item.quantity, 0);
  };

  const handleSubmit = async () => {
    setError("");
    if (!customerName.trim()) { setError("Informe o nome do cliente."); return; }
    if (!customerPhone.trim()) { setError("Informe o WhatsApp do cliente."); return; }
    if (items.some((i) => !i.productId)) { setError("Selecione o produto em todos os itens."); return; }

    setSubmitting(true);

    const body = {
      pin,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        selectedColor: i.selectedColor || undefined,
        selectedSize: i.selectedSize || undefined,
        selectedClosure: i.selectedClosure || undefined,
        hasCustomization: i.hasCustomization,
        unitPriceOverride: i.unitPriceOverride ? parseFloat(i.unitPriceOverride.replace(",", ".")) : undefined,
        notes: i.notes || undefined,
      })),
      paymentMethod: payMethod,
      paidAmount: parseFloat(paidAmount.replace(",", ".")) || 0,
      totalOverride: totalOverride ? parseFloat(totalOverride.replace(",", ".")) : undefined,
      notes: notes || undefined,
    };

    const res = await fetch("/api/vendedor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) { setError(data.error ?? "Erro ao registrar pedido."); return; }

    setOrderNumber(data.orderNumber);
    setStep("success");
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setItems([{ productId: "", quantity: 1, selectedColor: "", selectedSize: "", selectedClosure: "", hasCustomization: false, notes: "" }]);
    setPayMethod("PIX");
    setPaidAmount("");
    setTotalOverride("");
    setNotes("");
    setError("");
    setStep("form");
  };

  if (!pin) return <PinScreen onAuth={handleAuth} />;

  if (step === "success") {
    return (
      <div style={{
        minHeight: "100dvh",
        background: "#0a0a0a",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        padding: 24,
        textAlign: "center",
      }}>
        <CheckCircle size={64} color="#4ade80" />
        <div>
          <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 700, margin: "0 0 8px" }}>Pedido registrado!</h1>
          <p style={{ color: "#888", fontSize: 15, margin: 0 }}>
            Pedido <span style={{ color: "#b89a4e", fontWeight: 700 }}>#{orderNumber}</span> criado com sucesso.
          </p>
          <p style={{ color: "#555", fontSize: 13, marginTop: 8 }}>O admin já foi notificado.</p>
        </div>
        <button
          onClick={resetForm}
          style={{
            marginTop: 16,
            padding: "16px 48px",
            background: "#b89a4e",
            color: "#000",
            border: "none",
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Novo pedido
        </button>
      </div>
    );
  }

  const total = computedTotal();
  const paid = parseFloat(paidAmount.replace(",", ".")) || 0;
  const remaining = Math.max(0, total - paid);

  return (
    <div style={{ minHeight: "100dvh", background: "#0a0a0a", color: "#fff", padding: "24px 16px 120px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28, paddingTop: 8 }}>
        <p style={{ color: "#b89a4e", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 4px" }}>
          Triade Select
        </p>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Novo Pedido</h1>
      </div>

      {/* Customer */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#b89a4e", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>
          Cliente
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="text"
            placeholder="Nome do cliente *"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={inputStyle}
          />
          <input
            type="tel"
            placeholder="WhatsApp do cliente *"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            style={inputStyle}
          />
        </div>
      </section>

      {/* Items */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#b89a4e", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>
          Produtos
        </h2>

        {items.map((item, idx) => {
          const product = getProduct(item.productId);
          const colors = product ? Object.keys((product.colorImages as Record<string, string>) ?? {}) : [];

          return (
            <div key={idx} style={{ background: "#111", border: "1px solid #222", borderRadius: 14, padding: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "#888" }}>Item {idx + 1}</span>
                {items.length > 1 && (
                  <button onClick={() => removeItem(idx)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: 4 }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <select
                value={item.productId}
                onChange={(e) => updateItem(idx, { productId: e.target.value, selectedColor: "", selectedSize: "", selectedClosure: "" })}
                style={selectStyle}
              >
                <option value="">Selecione o produto…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              {product && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                    {/* Quantity */}
                    <div>
                      <label style={labelStyle}>Quantidade</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          onClick={() => updateItem(idx, { quantity: Math.max(1, item.quantity - 1) })}
                          style={qtyBtn}
                        >−</button>
                        <span style={{ color: "#fff", fontSize: 18, fontWeight: 700, minWidth: 24, textAlign: "center" }}>{item.quantity}</span>
                        <button
                          onClick={() => updateItem(idx, { quantity: item.quantity + 1 })}
                          style={qtyBtn}
                        >+</button>
                      </div>
                    </div>

                    {/* Price */}
                    <div>
                      <label style={labelStyle}>Preço unit.</label>
                      <p style={{ color: item.unitPriceOverride ? "#4ade80" : "#b89a4e", fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>
                        {formatBRL(getEffectivePrice(item))}
                      </p>
                      {!item.unitPriceOverride && (
                        <p style={{ color: "#444", fontSize: 10, margin: 0 }}>tabela</p>
                      )}
                      {item.unitPriceOverride && (
                        <p style={{ color: "#4ade80", fontSize: 10, margin: 0 }}>especial ✓</p>
                      )}
                    </div>
                  </div>

                  {/* Color */}
                  {colors.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <label style={labelStyle}>Cor</label>
                      <select value={item.selectedColor} onChange={(e) => updateItem(idx, { selectedColor: e.target.value })} style={selectStyle}>
                        <option value="">Sem cor</option>
                        {colors.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Size */}
                  <div style={{ marginTop: 10 }}>
                    <label style={labelStyle}>Tamanho</label>
                    <select value={item.selectedSize} onChange={(e) => updateItem(idx, { selectedSize: e.target.value })} style={selectStyle}>
                      <option value="">Sem tamanho</option>
                      {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Closure */}
                  <div style={{ marginTop: 10 }}>
                    <label style={labelStyle}>Fechamento</label>
                    <select value={item.selectedClosure} onChange={(e) => updateItem(idx, { selectedClosure: e.target.value })} style={selectStyle}>
                      <option value="">Sem fechamento</option>
                      {CLOSURES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Customization */}
                  {product.allowsCustomization && (
                    <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={item.hasCustomization}
                        onChange={(e) => updateItem(idx, { hasCustomization: e.target.checked })}
                        style={{ width: 20, height: 20, accentColor: "#b89a4e" }}
                      />
                      <span style={{ fontSize: 14, color: "#ccc" }}>Com personalização (logo)</span>
                    </label>
                  )}

                  {/* Price override */}
                  <div style={{ marginTop: 10 }}>
                    <label style={labelStyle}>
                      Preço especial (R$) — deixe em branco para usar tabela
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="text"
                        placeholder={`Tabela: ${formatBRL(item.hasCustomization ? product.priceWithCustom : product.priceBase)}`}
                        value={item.unitPriceOverride}
                        onChange={(e) => updateItem(idx, { unitPriceOverride: e.target.value })}
                        style={{ ...inputStyle, flex: 1, borderColor: item.unitPriceOverride ? "#4ade80" : "#222" }}
                      />
                      {item.unitPriceOverride && (
                        <button
                          onClick={() => updateItem(idx, { unitPriceOverride: "" })}
                          style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 18, padding: "0 4px", flexShrink: 0 }}
                          title="Remover preço especial"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <input
                    type="text"
                    placeholder="Observação do item…"
                    value={item.notes}
                    onChange={(e) => updateItem(idx, { notes: e.target.value })}
                    style={{ ...inputStyle, marginTop: 10 }}
                  />
                </>
              )}
            </div>
          );
        })}

        <button
          onClick={addItem}
          style={{
            width: "100%",
            padding: "14px",
            background: "transparent",
            border: "1px dashed #333",
            borderRadius: 12,
            color: "#555",
            fontSize: 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Plus size={16} /> Adicionar produto
        </button>
      </section>

      {/* Payment */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#b89a4e", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>
          Pagamento
        </h2>

        {/* Total override */}
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Valor total (deixe em branco para calcular automático)</label>
          <input
            type="text"
            placeholder={`Automático: ${formatBRL(total)}`}
            value={totalOverride}
            onChange={(e) => setTotalOverride(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#888", fontSize: 14 }}>Total</span>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>{formatBRL(total)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ color: "#888", fontSize: 14 }}>Pago agora</span>
            <span style={{ color: "#4ade80", fontWeight: 600 }}>{formatBRL(paid)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #222", paddingTop: 8 }}>
            <span style={{ color: "#888", fontSize: 14 }}>Restante</span>
            <span style={{ color: remaining > 0 ? "#f59e0b" : "#4ade80", fontWeight: 700 }}>{formatBRL(remaining)}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={labelStyle}>Forma de pag.</label>
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} style={selectStyle}>
              {PAY_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Valor pago agora (R$)</label>
            <input
              type="text"
              placeholder="0,00"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </section>

      {/* Notes */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: "#b89a4e", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0 0 12px" }}>
          Observações
        </h2>
        <textarea
          placeholder="Observações gerais do pedido…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "none" }}
        />
      </section>

      {error && (
        <div style={{ background: "#3b0f0f", border: "1px solid #7f1d1d", borderRadius: 12, padding: 14, marginBottom: 16, color: "#fca5a5", fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Submit */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px", background: "linear-gradient(to top, #0a0a0a 80%, transparent)", zIndex: 10 }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: "100%",
            padding: "18px",
            background: submitting ? "#555" : "#b89a4e",
            color: "#000",
            border: "none",
            borderRadius: 14,
            fontSize: 17,
            fontWeight: 800,
            cursor: submitting ? "not-allowed" : "pointer",
            letterSpacing: "0.02em",
          }}
        >
          {submitting ? "Registrando…" : `Confirmar Pedido · ${formatBRL(total)}`}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  background: "#111",
  border: "1px solid #222",
  borderRadius: 10,
  color: "#fff",
  fontSize: 16,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  background: "#111",
  border: "1px solid #222",
  borderRadius: 10,
  color: "#fff",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  appearance: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: 6,
  fontWeight: 600,
};

const qtyBtn: React.CSSProperties = {
  width: 36,
  height: 36,
  background: "#1a1a1a",
  border: "1px solid #333",
  borderRadius: 8,
  color: "#fff",
  fontSize: 20,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
