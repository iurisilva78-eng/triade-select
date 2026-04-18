"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_FLOW } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import type { OrderStatus } from "@prisma/client";

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  total: number;
  paidAmount: number;
  trackingCode?: string;
  createdAt: string;
  user: { name: string; email: string; phone?: string };
  items: { quantity: number; product: { name: string } }[];
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [trackingCode, setTrackingCode] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    const url = filter === "all" ? "/api/orders" : `/api/orders?status=${filter}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setOrders(data); setLoading(false); });
  };

  useEffect(() => { load(); }, [filter]);

  const handleUpdate = async () => {
    if (!selected || !newStatus) return;
    setUpdating(true);
    setError("");

    const res = await fetch(`/api/orders/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: newStatus,
        ...(trackingCode ? { trackingCode } : {}),
      }),
    });

    const data = await res.json();
    setUpdating(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao atualizar.");
      return;
    }

    setSelected(null);
    setNewStatus("");
    setTrackingCode("");
    load();
  };

  const filters = ["all", ...ORDER_STATUS_FLOW, "CANCELADO"];
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text)] mb-6">Pedidos</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => {
          const active = filter === f;
          const color = f === "all" ? "var(--gold)" : ORDER_STATUS_COLORS[f as OrderStatus];
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={active ? { backgroundColor: `${color}20`, color, borderColor: color } : { borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              {f === "all" ? "Todos" : ORDER_STATUS_LABELS[f as OrderStatus]}
            </button>
          );
        })}
      </div>

      {/* Tabela */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Pedido", "Cliente", "Itens", "Total", "Pago", "Status", "Data", "Ação"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const color = ORDER_STATUS_COLORS[order.status];
                const label = ORDER_STATUS_LABELS[order.status];
                const isLate =
                  ["ACEITO", "EM_PRODUCAO"].includes(order.status) &&
                  new Date(order.createdAt) < new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

                return (
                  <tr key={order.id} className={`border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors ${isLate ? "bg-red-500/5" : ""}`}>
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-[var(--gold)]">#{order.orderNumber}</p>
                      {isLate && (
                        <span className="text-xs text-red-400 font-semibold">⚠ Atrasado</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text)]">{order.user.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{order.user.phone ?? order.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {order.items.map((i) => `${i.product.name} ×${i.quantity}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--text)]">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${order.paidAmount >= order.total * 0.5 ? "text-green-400" : "text-amber-400"}`}>
                        {formatCurrency(order.paidAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge color={color}>{label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setSelected(order); setNewStatus(order.status); setError(""); }}
                      >
                        Atualizar
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-[var(--text-muted)]">
              Nenhum pedido encontrado.
            </div>
          )}
        </div>
      </div>

      {/* Modal de atualização */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[var(--text)]">
                Atualizar #{selected.orderNumber}
              </h2>
              <button onClick={() => setSelected(null)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Cliente: <strong>{selected.user.name}</strong>
            </p>

            {/* Status */}
            <div className="flex flex-col gap-2 mb-4">
              <p className="text-sm font-medium text-[var(--text-secondary)]">Novo status</p>
              {[...ORDER_STATUS_FLOW, "CANCELADO" as OrderStatus].map((s) => {
                const color = ORDER_STATUS_COLORS[s];
                const active = newStatus === s;
                return (
                  <button
                    key={s}
                    onClick={() => setNewStatus(s)}
                    className="flex items-center gap-3 p-3 rounded-xl border transition-colors text-left"
                    style={active ? { borderColor: color, backgroundColor: `${color}15` } : { borderColor: "var(--border)" }}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm flex-1" style={{ color: active ? color : "var(--text-secondary)" }}>
                      {ORDER_STATUS_LABELS[s]}
                    </span>
                    {active && <Check size={14} style={{ color }} />}
                  </button>
                );
              })}
            </div>

            {/* Código de rastreio */}
            {newStatus === "ENVIADO" && (
              <div className="mb-4">
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
                  Código de rastreio
                </label>
                <input
                  type="text"
                  placeholder="Ex: AA000000000BR"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-[var(--gold)]"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setSelected(null)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleUpdate} loading={updating}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
