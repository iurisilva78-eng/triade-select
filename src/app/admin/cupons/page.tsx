"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Check, X, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  description: string;
  type: "percent" | "fixed" | "shipping";
  value: number;
  minOrderValue: number;
  maxUses: number | null;
  uses: number;
  active: boolean;
  expiresAt: string | null;
}

const TYPE_LABELS = { percent: "% Desconto", fixed: "R$ Fixo", shipping: "Frete grátis" };

export default function CuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [code, setCode]             = useState("");
  const [description, setDescription] = useState("");
  const [type, setType]             = useState<"percent" | "fixed" | "shipping">("percent");
  const [value, setValue]           = useState("");
  const [minOrder, setMinOrder]     = useState("0");
  const [maxUses, setMaxUses]       = useState("");
  const [expiresAt, setExpiresAt]   = useState("");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");

  const load = () => {
    fetch("/api/admin/coupons").then(r => r.json()).then(d => { setCoupons(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setError("");
    if (!code || !value) { setError("Código e valor são obrigatórios."); return; }
    setSaving(true);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, description, type, value, minOrderValue: minOrder, maxUses: maxUses || null, expiresAt: expiresAt || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Erro."); return; }
    setShowForm(false);
    setCode(""); setDescription(""); setValue(""); setMinOrder("0"); setMaxUses(""); setExpiresAt("");
    load();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await fetch("/api/admin/coupons", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, active: !active }) });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover cupom?")) return;
    await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Cupons de desconto</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Crie cupons de % desconto, valor fixo ou frete grátis.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} /> Novo cupom
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
          <h2 className="font-bold text-[var(--text)] mb-4">Criar cupom</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">Código *</label>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="EX: DESCONTO20"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2.5 text-sm font-mono outline-none focus:border-[var(--gold)] uppercase" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">Descrição</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: 20% para clientes locais"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">Tipo</label>
              <select value={type} onChange={e => setType(e.target.value as any)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)]">
                <option value="percent">% Desconto (ex: 20%)</option>
                <option value="fixed">Valor fixo (ex: R$ 10)</option>
                <option value="shipping">Frete grátis</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">
                {type === "percent" ? "Percentual (%)" : type === "fixed" ? "Valor (R$)" : "Desconto máximo no frete (R$)"}
              </label>
              <input type="number" min="0" step="0.01" value={value} onChange={e => setValue(e.target.value)}
                placeholder={type === "percent" ? "Ex: 20" : "Ex: 10.00"}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">Pedido mínimo (R$)</label>
              <input type="number" min="0" step="0.01" value={minOrder} onChange={e => setMinOrder(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">Uso máximo (deixe vazio para ilimitado)</label>
              <input type="number" min="1" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="Ilimitado"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">Expira em (opcional)</label>
              <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)]" />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          <div className="flex gap-3 mt-4">
            <Button onClick={handleCreate} loading={saving}><Check size={14} /> Criar cupom</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}><X size={14} /> Cancelar</Button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <Tag size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum cupom criado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  {["Código", "Tipo", "Valor", "Uso", "Pedido mín.", "Status", "Ação"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id} className={`border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors ${!c.active ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3">
                      <p className="font-bold font-mono text-[var(--gold)]">{c.code}</p>
                      {c.description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{c.description}</p>}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{TYPE_LABELS[c.type]}</td>
                    <td className="px-5 py-3 font-bold text-[var(--text)]">
                      {c.type === "percent" ? `${c.value}%` : formatCurrency(c.value)}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">
                      {c.uses}{c.maxUses !== null ? `/${c.maxUses}` : ""}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">
                      {c.minOrderValue > 0 ? formatCurrency(c.minOrderValue) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleToggle(c.id, c.active)} className={`flex items-center gap-1 text-xs font-medium ${c.active ? "text-green-400" : "text-[var(--text-muted)]"}`}>
                        {c.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        {c.active ? "Ativo" : "Inativo"}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
