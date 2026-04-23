"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_FLOW } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, MessageCircle, DollarSign, AlertCircle, MapPin, CheckSquare, Square, Layers } from "lucide-react";
import type { OrderStatus } from "@prisma/client";

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  total: number;
  paidAmount: number;
  cancelRequestedAt?: string | null;
  trackingCode?: string;
  createdAt: string;
  street: string; number: string; complement?: string;
  neighborhood: string; city: string; state: string; cep: string;
  user: { name: string; email: string; phone?: string };
  items: { quantity: number; product: { name: string }; selectedColor?: string; selectedSize?: string; selectedClosure?: string }[];
}

type Tab = "status" | "payment" | "whatsapp";

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [tab, setTab] = useState<Tab>("status");

  // Status tab
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [trackingCode, setTrackingCode] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // Payment tab
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("PIX");

  // WhatsApp tab
  const [waMessage, setWaMessage] = useState("");

  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Seleção em lote
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus | "">("");
  const [applyingBulk, setApplyingBulk] = useState(false);
  const [bulkMsg, setBulkMsg] = useState("");

  const load = () => {
    const url = filter === "all" ? "/api/orders" : `/api/orders?status=${filter}`;
    fetch(url).then((r) => r.json()).then((data) => { setOrders(data); setLoading(false); });
  };

  useEffect(() => { load(); }, [filter]);

  const openModal = (order: Order) => {
    setSelected(order);
    setTab("status");
    setNewStatus(order.status);
    setTrackingCode("");
    setStatusNote("");
    setPayAmount("");
    setPayMethod("PIX");
    setWaMessage("");
    setError("");
    setSuccess("");
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setUpdating(true); setError(""); setSuccess("");

    let body: any = {};

    if (tab === "status") {
      if (!newStatus) { setError("Selecione um status."); setUpdating(false); return; }
      body = { status: newStatus, ...(trackingCode ? { trackingCode } : {}), ...(statusNote ? { note: statusNote } : {}) };
    } else if (tab === "payment") {
      const amount = parseFloat(payAmount.replace(",", "."));
      if (!amount || amount <= 0) { setError("Valor inválido."); setUpdating(false); return; }
      body = { payment: { amount, method: payMethod } };
    } else if (tab === "whatsapp") {
      if (!waMessage.trim()) { setError("Digite uma mensagem."); setUpdating(false); return; }
      if (!selected.user.phone) { setError("Este cliente não tem WhatsApp cadastrado."); setUpdating(false); return; }
      body = { whatsappMessage: waMessage };
    }

    const res = await fetch(`/api/orders/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setUpdating(false);

    if (!res.ok) { setError(data.error ?? "Erro ao atualizar."); return; }

    setSuccess(tab === "payment" ? "Pagamento registrado!" : tab === "whatsapp" ? "Mensagem enviada!" : "Status atualizado!");
    load();
    if (tab === "status") setTimeout(() => { setSelected(null); }, 1000);
  };

  const handleDenyCancel = async () => {
    if (!selected) return;
    setUpdating(true); setError("");
    const res = await fetch(`/api/orders/${selected.id}/cancel-request`, { method: "DELETE" });
    setUpdating(false);
    if (!res.ok) { setError("Erro ao negar cancelamento."); return; }
    setSuccess("Cancelamento negado.");
    load();
    setSelected((prev) => prev ? { ...prev, cancelRequestedAt: null } : null);
  };

  const handleApproveCancel = () => {
    setTab("status");
    setNewStatus("CANCELADO");
  };

  const handleBulkApply = async () => {
    if (!bulkStatus || selectedIds.size === 0) return;
    setApplyingBulk(true); setBulkMsg("");
    const res = await fetch("/api/orders/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds), status: bulkStatus }),
    });
    const data = await res.json();
    setApplyingBulk(false);
    if (res.ok) {
      setBulkMsg(`✓ ${data.updated} pedido(s) atualizados`);
      setSelectedIds(new Set());
      setBulkStatus("");
      load();
      setTimeout(() => setBulkMsg(""), 4000);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map((o) => o.id)));
  };

  const filters = ["all", ...ORDER_STATUS_FLOW, "CANCELADO"];
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const remaining = selected ? Math.max(0, selected.total - selected.paidAmount) : 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text)] mb-6">Pedidos</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => {
          const active = filter === f;
          const color = f === "all" ? "var(--gold)" : ORDER_STATUS_COLORS[f as OrderStatus];
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
              style={active ? { backgroundColor: `${color}20`, color, borderColor: color } : { borderColor: "var(--border)", color: "var(--text-muted)" }}>
              {f === "all" ? "Todos" : ORDER_STATUS_LABELS[f as OrderStatus]}
            </button>
          );
        })}
      </div>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3">
                  <button onClick={toggleSelectAll} className="text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors">
                    {selectedIds.size === filtered.length && filtered.length > 0
                      ? <CheckSquare size={16} className="text-[var(--gold)]" />
                      : <Square size={16} />}
                  </button>
                </th>
                {["Pedido", "Cliente", "Itens", "Total", "Pago", "Status", "Data", "Ação"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const color = ORDER_STATUS_COLORS[order.status];
                const isLate = ["ACEITO", "EM_PRODUCAO"].includes(order.status) &&
                  new Date(order.createdAt) < new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
                const hasCancelReq = !!order.cancelRequestedAt;

                return (
                  <tr key={order.id} className={`border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors ${isLate ? "bg-red-500/5" : ""} ${hasCancelReq ? "bg-amber-500/5" : ""} ${selectedIds.has(order.id) ? "bg-[var(--gold)]/5" : ""}`}>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleSelect(order.id)} className="text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors">
                        {selectedIds.has(order.id) ? <CheckSquare size={16} className="text-[var(--gold)]" /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-[var(--gold)]">#{order.orderNumber}</p>
                      {isLate && <span className="text-xs text-red-400 font-semibold block">⚠ Atrasado</span>}
                      {hasCancelReq && <span className="text-xs text-amber-400 font-semibold block">⚡ Cancel. solicitado</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--text)]">{order.user.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{order.user.phone ?? order.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">
                      {order.items.map((i) => `${i.product.name} ×${i.quantity}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 font-bold text-[var(--text)]">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${order.paidAmount >= order.total * 0.5 ? "text-green-400" : "text-amber-400"}`}>
                        {formatCurrency(order.paidAmount)}
                      </span>
                    </td>
                    <td className="px-4 py-3"><Badge color={color}>{ORDER_STATUS_LABELS[order.status]}</Badge></td>
                    <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => openModal(order)}>Gerenciar</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="text-center py-12 text-[var(--text-muted)]">Nenhum pedido encontrado.</div>}
        </div>
      </div>

      {/* ── Barra de ações em lote ── */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--surface)] border border-[var(--gold)]/40 rounded-2xl shadow-2xl px-5 py-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-[var(--gold)]" />
            <span className="font-semibold text-[var(--text)] text-sm">
              {selectedIds.size} pedido(s) selecionado(s)
            </span>
          </div>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
            className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--gold)]"
          >
            <option value="">Selecione o novo status…</option>
            {[...ORDER_STATUS_FLOW, "CANCELADO" as OrderStatus].map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>
            ))}
          </select>
          <button
            onClick={handleBulkApply}
            disabled={!bulkStatus || applyingBulk}
            className="px-4 py-2 bg-[var(--gold)] text-black font-bold rounded-xl text-sm hover:bg-amber-400 transition-colors disabled:opacity-40"
          >
            {applyingBulk ? "Aplicando…" : "Aplicar em lote"}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-[var(--text-muted)] hover:text-[var(--text)] text-sm"
          >
            Cancelar
          </button>
          {bulkMsg && <span className="text-green-400 text-sm font-medium">{bulkMsg}</span>}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-[var(--text)]">#{selected.orderNumber}</h2>
                <p className="text-sm text-[var(--text-secondary)]">{selected.user.name} · {selected.user.phone ?? "sem tel."}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-[var(--text-muted)] hover:text-[var(--text)]"><X size={20} /></button>
            </div>

            {/* Endereço */}
            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-3 mb-4 text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-1 text-[var(--gold)] font-semibold mb-1"><MapPin size={12} /> Endereço de entrega</div>
              {selected.street}, {selected.number}{selected.complement ? `, ${selected.complement}` : ""} — {selected.neighborhood}<br />
              {selected.city}/{selected.state} · CEP {selected.cep}
            </div>

            {/* Itens com opções */}
            <div className="mb-4 flex flex-col gap-1">
              {selected.items.map((item, i) => (
                <div key={i} className="text-xs text-[var(--text-secondary)]">
                  <span className="font-medium">{item.product.name} ×{item.quantity}</span>
                  {(item.selectedColor || item.selectedSize || item.selectedClosure) && (
                    <span className="text-[var(--text-muted)] ml-1">
                      {[item.selectedColor, item.selectedSize, item.selectedClosure].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Alerta de cancelamento */}
            {selected.cancelRequestedAt && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-2">
                  <AlertCircle size={16} /> Cancelamento solicitado pelo cliente
                </div>
                <p className="text-xs text-amber-300 mb-3">
                  Solicitado em {new Date(selected.cancelRequestedAt).toLocaleString("pt-BR")}
                </p>
                <div className="flex gap-2">
                  <button onClick={handleApproveCancel}
                    className="flex-1 py-2 bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-semibold rounded-xl hover:bg-red-500/30 transition-colors">
                    Aprovar cancelamento
                  </button>
                  <button onClick={handleDenyCancel} disabled={updating}
                    className="flex-1 py-2 bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-semibold rounded-xl hover:bg-green-500/30 transition-colors">
                    Negar cancelamento
                  </button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-[var(--surface-2)] rounded-xl p-1 mb-4">
              {([["status", "Status"], ["payment", "Pagamento"], ["whatsapp", "WhatsApp"]] as const).map(([t, label]) => (
                <button key={t} onClick={() => { setTab(t); setError(""); setSuccess(""); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${tab === t ? "bg-[var(--gold)] text-black" : "text-[var(--text-muted)] hover:text-[var(--text)]"}`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Tab: Status */}
            {tab === "status" && (
              <div className="flex flex-col gap-2 mb-4">
                {[...ORDER_STATUS_FLOW, "CANCELADO" as OrderStatus].map((s) => {
                  const color = ORDER_STATUS_COLORS[s];
                  const active = newStatus === s;
                  return (
                    <button key={s} onClick={() => setNewStatus(s)}
                      className="flex items-center gap-3 p-3 rounded-xl border transition-colors text-left"
                      style={active ? { borderColor: color, backgroundColor: `${color}15` } : { borderColor: "var(--border)" }}>
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-sm flex-1" style={{ color: active ? color : "var(--text-secondary)" }}>
                        {ORDER_STATUS_LABELS[s]}
                      </span>
                      {active && <Check size={14} style={{ color }} />}
                    </button>
                  );
                })}
                {newStatus === "ENVIADO" && (
                  <input type="text" placeholder="Código de rastreio (AA000000000BR)"
                    value={trackingCode} onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-[var(--gold)]" />
                )}
                <textarea placeholder="Observação interna (opcional)" value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)} rows={2}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)] resize-none placeholder:text-[var(--text-muted)]" />
              </div>
            )}

            {/* Tab: Pagamento */}
            {tab === "payment" && (
              <div className="flex flex-col gap-3 mb-4">
                <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-3 text-sm">
                  <div className="flex justify-between text-[var(--text-secondary)] mb-1">
                    <span>Total do pedido</span><span className="font-bold text-[var(--text)]">{formatCurrency(selected.total)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--text-secondary)] mb-1">
                    <span>Já pago</span><span className="font-bold text-green-400">{formatCurrency(selected.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t border-[var(--border)] pt-2 mt-1">
                    <span className="text-[var(--text-secondary)]">Restante</span>
                    <span className="text-amber-400">{formatCurrency(remaining)}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">Valor recebido (R$)</label>
                  <input type="text" placeholder="Ex: 150,00" value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)]" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">Forma de pagamento</label>
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)]">
                    <option value="PIX">PIX</option>
                    <option value="Transferência">Transferência bancária</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de crédito">Cartão de crédito</option>
                    <option value="Cartão de débito">Cartão de débito</option>
                    <option value="Boleto">Boleto</option>
                  </select>
                </div>
              </div>
            )}

            {/* Tab: WhatsApp */}
            {tab === "whatsapp" && (
              <div className="flex flex-col gap-3 mb-4">
                {!selected.user.phone && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-400 text-sm">
                    Este cliente não tem WhatsApp cadastrado.
                  </div>
                )}
                <div className="text-xs text-[var(--text-muted)] mb-1">
                  Mensagem para <span className="text-[var(--text)] font-medium">{selected.user.name}</span>
                  {selected.user.phone && <span> ({selected.user.phone})</span>}
                </div>
                <textarea placeholder="Digite a mensagem que será enviada pelo WhatsApp..."
                  value={waMessage} onChange={(e) => setWaMessage(e.target.value)} rows={5}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)] resize-none placeholder:text-[var(--text-muted)]" />
                <div className="flex gap-2 flex-wrap">
                  {[
                    ["Pagamento", `Olá, *${selected.user.name}*! 👋\n\nVocê possui um saldo pendente no pedido *#${selected.orderNumber}*.\n\nValor restante: *${formatCurrency(remaining)}*\n\nPague via PIX ou transferência e nos informe para darmos andamento. 😊\n— *Triade Select*`],
                    ["Produção", `Olá, *${selected.user.name}*! ⚙️\n\nSeu pedido *#${selected.orderNumber}* entrou em produção!\n\nPrazo estimado: *15 dias úteis*.\nQualquer dúvida, estamos aqui! 💪\n— *Triade Select*`],
                  ].map(([label, msg]) => (
                    <button key={label} onClick={() => setWaMessage(msg)}
                      className="px-3 py-1.5 bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--text-secondary)] rounded-xl hover:border-[var(--gold)] transition-colors">
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm">{error}</div>}
            {success && <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4 text-green-400 text-sm">✓ {success}</div>}

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setSelected(null)}>Fechar</Button>
              <Button className="flex-1" onClick={handleUpdate} loading={updating}>
                {tab === "payment" ? <><DollarSign size={14} /> Registrar</> : tab === "whatsapp" ? <><MessageCircle size={14} /> Enviar</> : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
