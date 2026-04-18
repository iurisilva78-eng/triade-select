"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Bell, BellOff } from "lucide-react";

interface NotifPhone {
  id: string;
  name: string;
  phone: string;
  active: boolean;
}

export default function ConfiguracoesPage() {
  const [phones, setPhones] = useState<NotifPhone[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/admin/notification-phones")
      .then((r) => r.json())
      .then((d) => { setPhones(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) { setError("Preencha nome e telefone."); return; }
    setAdding(true); setError("");
    const res = await fetch("/api/admin/notification-phones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) { setError(data.error ?? "Erro ao adicionar."); return; }
    setName(""); setPhone("");
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este número?")) return;
    await fetch(`/api/admin/notification-phones?id=${id}`, { method: "DELETE" });
    load();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await fetch("/api/admin/notification-phones", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active: !active }),
    });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Configurações</h1>
      <p className="text-[var(--text-muted)] text-sm mb-8">Telefones que receberão notificações de novos pedidos.</p>

      {/* Adicionar novo */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
        <h2 className="font-bold text-[var(--text)] mb-4">Adicionar telefone</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">Nome</label>
            <input
              type="text"
              placeholder="Ex: Iuri (admin)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)] placeholder:text-[var(--text-muted)]"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">WhatsApp (com DDD)</label>
            <input
              type="text"
              placeholder="Ex: 11999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              maxLength={13}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)] placeholder:text-[var(--text-muted)]"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} loading={adding} className="flex items-center gap-2">
              <Plus size={16} /> Adicionar
            </Button>
          </div>
        </div>
        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        <p className="text-xs text-[var(--text-muted)] mt-3">
          Esses números receberão uma mensagem no WhatsApp a cada novo pedido feito na loja.
        </p>
      </div>

      {/* Lista */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-bold text-[var(--text)]">Telefones cadastrados</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : phones.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum telefone cadastrado ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {phones.map((p) => (
              <div key={p.id} className={`flex items-center justify-between px-5 py-4 ${!p.active ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${p.active ? "bg-green-400" : "bg-[var(--border)]"}`} />
                  <div>
                    <p className="font-medium text-[var(--text)] text-sm">{p.name}</p>
                    <p className="text-xs text-[var(--text-muted)] font-mono">{p.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(p.id, p.active)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      p.active
                        ? "text-green-400 border-green-400/30 hover:bg-green-400/10"
                        : "text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--gold)]"
                    }`}
                  >
                    {p.active ? <><Bell size={12} /> Ativo</> : <><BellOff size={12} /> Inativo</>}
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 rounded-xl text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/30 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
