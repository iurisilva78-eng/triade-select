"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import { Check, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";

interface Step { name: string; done: boolean; doneAt?: string }
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  productionSteps: Step[];
  user: { name: string; phone?: string };
  items: { quantity: number; product: { name: string }; selectedColor?: string; selectedSize?: string }[];
  createdAt: string;
}

const DEFAULT_STEPS = [
  "Separar matéria-prima",
  "Corte do tecido",
  "Costura",
  "Bordado / Logo",
  "Acabamento",
  "Controle de qualidade",
  "Embalagem",
];

export default function ProducaoPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/orders?status=EM_PRODUCAO").then(r => r.json()),
      fetch("/api/orders?status=PRODUTO_PRONTO").then(r => r.json()),
    ]).then(([a, b]) => {
      const combined = [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])];
      const enriched = combined.map((o: Order) => ({
        ...o,
        productionSteps: Array.isArray(o.productionSteps) && o.productionSteps.length
          ? o.productionSteps
          : DEFAULT_STEPS.map(name => ({ name, done: false })),
      }));
      setOrders(enriched);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const toggle = (orderId: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(orderId) ? n.delete(orderId) : n.add(orderId);
      return n;
    });
  };

  const toggleStep = async (order: Order, idx: number) => {
    const newSteps = order.productionSteps.map((s, i) =>
      i === idx ? { ...s, done: !s.done, doneAt: !s.done ? new Date().toISOString() : undefined } : s
    );
    setSaving(order.id);
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, productionSteps: newSteps } : o));
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productionSteps: newSteps }),
    });
    setSaving(null);
  };

  const addStep = async (order: Order, name: string) => {
    if (!name.trim()) return;
    const newSteps = [...order.productionSteps, { name: name.trim(), done: false }];
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, productionSteps: newSteps } : o));
    await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productionSteps: newSteps }),
    });
  };

  const pct = (steps: Step[]) => steps.length ? Math.round((steps.filter(s => s.done).length / steps.length) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Fila de Produção</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Marque as etapas concluídas para cada pedido.</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors">
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-muted)]">
          <p className="text-5xl mb-4">🏭</p>
          <p>Nenhum pedido em produção no momento.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map(order => {
            const isOpen = expanded.has(order.id);
            const done = order.productionSteps.filter(s => s.done).length;
            const total = order.productionSteps.length;
            const p = pct(order.productionSteps);

            return (
              <div key={order.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
                <button
                  onClick={() => toggle(order.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--surface-2)] transition-colors text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[var(--text)] flex items-center gap-2 flex-wrap">
                      #{order.orderNumber}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-normal ${order.status === "PRODUTO_PRONTO" ? "bg-teal-500/20 text-teal-400" : "bg-amber-500/20 text-amber-400"}`}>
                        {order.status === "PRODUTO_PRONTO" ? "Produto Pronto ✓" : "Em Produção ⚙️"}
                      </span>
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                      {order.user.name} · {order.items.map(i => `${i.product.name}×${i.quantity}`).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="hidden sm:block text-right">
                      <p className="text-xs text-[var(--text-muted)]">{done}/{total}</p>
                      <div className="w-20 h-1.5 bg-[var(--surface-2)] rounded-full mt-1">
                        <div className={`h-full rounded-full transition-all ${p === 100 ? "bg-green-400" : "bg-[var(--gold)]"}`} style={{ width: `${p}%` }} />
                      </div>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-[var(--border)] px-5 py-4">
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[var(--text-muted)] mb-4">
                      <span>👤 {order.user.name}</span>
                      {order.user.phone && <span>📱 {order.user.phone}</span>}
                      <span>📅 {formatDate(order.createdAt)}</span>
                      {order.items.map((item, i) => (
                        <span key={i}>
                          📦 {item.product.name} ×{item.quantity}
                          {item.selectedColor ? ` — ${item.selectedColor}` : ""}
                          {item.selectedSize ? ` / ${item.selectedSize}` : ""}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-2">
                      {order.productionSteps.map((step, idx) => (
                        <button
                          key={idx}
                          onClick={() => toggleStep(order, idx)}
                          disabled={saving === order.id}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                            step.done ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold)]/50"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${step.done ? "bg-green-500 border-green-500" : "border-current opacity-40"}`}>
                            {step.done && <Check size={11} className="text-white" />}
                          </div>
                          <span className={`text-sm font-medium flex-1 ${step.done ? "line-through opacity-60" : ""}`}>{step.name}</span>
                          {step.done && step.doneAt && (
                            <span className="text-xs text-green-400/50">{new Date(step.doneAt).toLocaleDateString("pt-BR")}</span>
                          )}
                        </button>
                      ))}
                    </div>
                    <AddStepInput onAdd={(name) => addStep(order, name)} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AddStepInput({ onAdd }: { onAdd: (name: string) => void }) {
  const [val, setVal] = useState("");
  const submit = () => { if (val.trim()) { onAdd(val); setVal(""); } };
  return (
    <div className="flex gap-2 mt-3">
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === "Enter" && submit()}
        placeholder="+ Etapa personalizada (Enter para adicionar)"
        className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--gold)]"
      />
      <button onClick={submit} className="px-3 py-2 rounded-xl bg-[var(--gold)]/10 text-[var(--gold)] hover:bg-[var(--gold)]/20 text-sm font-medium transition-colors">
        <Check size={14} />
      </button>
    </div>
  );
}
