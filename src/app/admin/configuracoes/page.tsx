"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Bell, BellOff, Save, Check, Users, RefreshCw, ChevronDown } from "lucide-react";

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

  // Grupo WhatsApp
  const [groupId, setGroupId] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [savedGroup, setSavedGroup] = useState(false);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState("");
  const [showGroupList, setShowGroupList] = useState(false);

  const load = () => {
    fetch("/api/admin/notification-phones")
      .then((r) => r.json())
      .then((d) => { setPhones(d); setLoading(false); });
  };

  useEffect(() => {
    load();
    // Carrega ID do grupo salvo
    fetch("/api/admin/site-config")
      .then((r) => r.json())
      .then((data: any[]) => {
        const g = data.find((d) => d.key === "whatsapp_group_id");
        if (g?.value) setGroupId(g.value);
      })
      .catch(() => {});
  }, []);

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

  const handleFetchGroups = async () => {
    setLoadingGroups(true);
    setGroupsError("");
    setShowGroupList(false);
    try {
      const res = await fetch("/api/admin/whatsapp-groups");
      const data = await res.json();
      if (!res.ok) { setGroupsError(data.error ?? "Erro ao buscar grupos."); }
      else { setGroups(data); setShowGroupList(true); }
    } catch {
      setGroupsError("Erro ao buscar grupos.");
    }
    setLoadingGroups(false);
  };

  const handleSaveGroup = async () => {
    setSavingGroup(true);
    await fetch("/api/admin/site-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ key: "whatsapp_group_id", value: groupId.trim() }]),
    });
    setSavingGroup(false);
    setSavedGroup(true);
    setTimeout(() => setSavedGroup(false), 3000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Configurações</h1>
      <p className="text-[var(--text-muted)] text-sm mb-8">Notificações e integrações de WhatsApp.</p>

      {/* ── Grupo de novos pedidos ── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Users size={16} className="text-[var(--gold)]" />
          <h2 className="font-bold text-[var(--text)]">Grupo de novos pedidos</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          Quando configurado, cada novo pedido (e a logo do cliente, se houver) será enviado neste grupo do WhatsApp.
        </p>

        {/* Buscar grupos automaticamente */}
        <div className="mb-3">
          <button
            onClick={handleFetchGroups}
            disabled={loadingGroups}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--gold)] transition-colors disabled:opacity-50"
          >
            {loadingGroups ? <RefreshCw size={14} className="animate-spin" /> : <ChevronDown size={14} />}
            Buscar meus grupos do WhatsApp
          </button>
          {groupsError && <p className="text-red-400 text-xs mt-2">{groupsError}</p>}
        </div>

        {/* Lista de grupos */}
        {showGroupList && groups.length > 0 && (
          <div className="mb-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => { setGroupId(g.id); setShowGroupList(false); }}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-[var(--gold)]/10 transition-colors border-b border-[var(--border)] last:border-0 ${groupId === g.id ? "text-[var(--gold)] bg-[var(--gold)]/5" : "text-[var(--text-secondary)]"}`}
              >
                <span className="font-medium">{g.name}</span>
                <span className="block text-xs font-mono text-[var(--text-muted)] mt-0.5">{g.id}</span>
              </button>
            ))}
          </div>
        )}

        {showGroupList && groups.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] mb-3">Nenhum grupo encontrado. Verifique se o WhatsApp está conectado.</p>
        )}

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">ID do grupo selecionado</label>
            <input
              type="text"
              placeholder="Clique em 'Buscar grupos' acima ou cole o ID manualmente"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)] font-mono placeholder:text-[var(--text-muted)]"
            />
          </div>
          <Button onClick={handleSaveGroup} loading={savingGroup} disabled={!groupId} className="flex items-center gap-2 shrink-0">
            {savedGroup ? <><Check size={14} /> Salvo!</> : <><Save size={14} /> Salvar</>}
          </Button>
        </div>
      </div>

      {/* ── Telefones individuais ── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
        <h2 className="font-bold text-[var(--text)] mb-1">Adicionar telefone individual</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">Além do grupo, esses números também receberão notificações de novos pedidos.</p>
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
      </div>

      {/* ── Lista de telefones ── */}
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
