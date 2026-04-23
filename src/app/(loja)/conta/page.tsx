"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Eye, EyeOff, User, Phone, Lock, Save } from "lucide-react";

export default function ContaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName]                   = useState("");
  const [phone, setPhone]                 = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent]     = useState(false);
  const [showNew, setShowNew]             = useState(false);

  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/user/profile")
        .then(r => r.json())
        .then(data => {
          if (data.name)  setName(data.name);
          if (data.phone) setPhone(data.phone);
        });
    }
  }, [session]);

  const handleSave = async () => {
    setError(""); setSuccess("");
    if (newPassword && newPassword !== confirmPassword) {
      setError("As senhas não conferem."); return;
    }
    setSaving(true);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Erro ao salvar."); return; }
    setSuccess("Dados atualizados com sucesso!");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setTimeout(() => setSuccess(""), 4000);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Minha Conta</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-8">Edite seus dados pessoais e senha.</p>

      {/* Dados pessoais */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-[var(--gold)]" />
          <h2 className="font-bold text-[var(--text)]">Dados pessoais</h2>
        </div>
        <div className="flex flex-col gap-4">
          <Input label="Nome completo" value={name} onChange={e => setName(e.target.value)} />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
              <Phone size={13} /> WhatsApp (com DDD)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
              maxLength={13}
              placeholder="11999999999"
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)]"
            />
          </div>
        </div>
      </div>

      {/* Alterar senha */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-5">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-[var(--gold)]" />
          <h2 className="font-bold text-[var(--text)]">Alterar senha</h2>
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-4">Deixe em branco para não alterar.</p>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Senha atual</label>
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)] pr-11"
            />
            <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 bottom-3 text-[var(--text-muted)] hover:text-[var(--text)]">
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="relative">
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Nova senha</label>
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)] pr-11"
            />
            <button onClick={() => setShowNew(!showNew)} className="absolute right-3 bottom-3 text-[var(--text-muted)] hover:text-[var(--text)]">
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">Confirmar nova senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full bg-[var(--surface-2)] border rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)] ${confirmPassword && newPassword !== confirmPassword ? "border-red-500/50 text-red-400" : "border-[var(--border)] text-[var(--text)]"}`}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm mb-4 flex items-center gap-2">
          <Check size={14} /> {success}
        </div>
      )}

      <Button size="lg" className="w-full flex items-center gap-2" onClick={handleSave} loading={saving}>
        <Save size={16} /> Salvar alterações
      </Button>
    </div>
  );
}
