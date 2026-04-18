"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { KeyRound, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  orders: {
    total: number;
    status: string;
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    cep?: string;
  }[];
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetResult, setResetResult] = useState<{ name: string; phone?: string; tempPassword: string } | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/orders")
      .then(() => {}) // just to ensure session
      .catch(() => {});

    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((data) => { setCustomers(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleResetPassword = async (id: string) => {
    setResetting(id);
    const res = await fetch(`/api/admin/customers/${id}/reset-password`, { method: "POST" });
    const data = await res.json();
    setResetting(null);
    if (res.ok) setResetResult(data);
    else alert(data.error ?? "Erro ao redefinir senha.");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text)] mb-6">Clientes</h1>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Nome", "WhatsApp", "Último endereço", "Pedidos", "Total gasto", "Cadastro", "Ações"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const totalSpent = c.orders.reduce((acc, o) => acc + o.total, 0);
                const lastOrder = c.orders[0];
                const hasAddress = lastOrder?.city;
                return (
                  <tr key={c.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-[var(--text)]">{c.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{c.email}</p>
                    </td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{c.phone ?? "—"}</td>
                    <td className="px-5 py-3">
                      {hasAddress ? (
                        <div className="flex items-start gap-1 text-xs text-[var(--text-secondary)]">
                          <MapPin size={12} className="text-[var(--gold)] mt-0.5 flex-shrink-0" />
                          <span>
                            {lastOrder.street}, {lastOrder.number} — {lastOrder.neighborhood}<br />
                            {lastOrder.city}/{lastOrder.state} · {lastOrder.cep}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] text-xs">Sem pedidos</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{c.orders.length}</td>
                    <td className="px-5 py-3 font-bold text-[var(--gold)]">{formatCurrency(totalSpent)}</td>
                    <td className="px-5 py-3 text-[var(--text-muted)]">{formatDate(c.createdAt)}</td>
                    <td className="px-5 py-3">
                      <Button size="sm" variant="outline" loading={resetting === c.id}
                        onClick={() => handleResetPassword(c.id)}
                        className="flex items-center gap-1.5 text-xs">
                        <KeyRound size={12} /> Redefinir senha
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-[var(--text-muted)]">Nenhum cliente cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de senha redefinida */}
      {resetResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-[var(--text)]">Senha redefinida</h2>
              <button onClick={() => setResetResult(null)} className="text-[var(--text-muted)] hover:text-[var(--text)]"><X size={20} /></button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Envie as informações abaixo para <strong>{resetResult.name}</strong> pelo WhatsApp:
            </p>
            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4 mb-4">
              <p className="text-xs text-[var(--text-muted)] mb-1">Nova senha temporária</p>
              <p className="text-2xl font-mono font-bold text-[var(--gold)]">{resetResult.tempPassword}</p>
            </div>
            <div className="bg-[var(--surface-2)] rounded-xl p-3 text-xs text-[var(--text-secondary)] mb-4">
              📋 Mensagem sugerida para WhatsApp:<br /><br />
              <span className="text-[var(--text)]">
                Olá, {resetResult.name}! Sua senha foi redefinida. 🔑<br />
                Nova senha: <strong>{resetResult.tempPassword}</strong><br />
                Acesse: triadeselect.netlify.app/login<br />
                Recomendamos alterar após o login.
              </span>
            </div>
            {resetResult.phone && (
              <a href={`https://wa.me/55${resetResult.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá, ${resetResult.name}! Sua senha foi redefinida. 🔑\nNova senha: ${resetResult.tempPassword}\nAcesse: triadeselect.netlify.app/login`)}`}
                target="_blank" rel="noopener noreferrer">
                <Button className="w-full mb-2">Enviar pelo WhatsApp</Button>
              </a>
            )}
            <Button variant="secondary" className="w-full" onClick={() => setResetResult(null)}>Fechar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
