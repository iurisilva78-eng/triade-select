"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

/* ─── Tab sidebar navigation ─────────────────────── */
const TABS = [
  { id: "perfil",     label: "Perfil" },
  { id: "seguranca",  label: "Segurança" },
  { id: "enderecos",  label: "Endereços" },
  { id: "sair",       label: "Sair" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* ─── Shared input style ───────────────────────────── */
const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 0",
  border: 0,
  borderBottom: "1px solid var(--line-soft)",
  background: "transparent",
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  outline: "none",
  color: "var(--ink)",
  boxSizing: "border-box",
};

export default function ContaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("perfil");

  // Profile state
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/user/profile")
        .then((r) => r.json())
        .then((data) => {
          if (data.name)  setName(data.name);
          if (data.phone) setPhone(data.phone);
        });
    }
  }, [session]);

  const handleSave = async () => {
    setError(""); setSuccess("");
    if (tab === "seguranca" && newPassword && newPassword !== confirmPassword) {
      setError("As senhas não conferem."); return;
    }
    setSaving(true);
    const body: Record<string, string | undefined> = { name, phone };
    if (tab === "seguranca") {
      body.currentPassword = currentPassword || undefined;
      body.newPassword     = newPassword || undefined;
    }
    const res  = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Erro ao salvar."); return; }
    setSuccess("Dados atualizados com sucesso!");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleTabClick = (id: TabId) => {
    if (id === "sair") { signOut({ callbackUrl: "/" }); return; }
    setTab(id);
    setError(""); setSuccess("");
  };

  if (status === "loading") {
    return (
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 32, height: 32, border: "2px solid var(--line-soft)", borderTop: "2px solid var(--gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  const firstName = name.split(" ")[0] || session?.user?.name?.split(" ")[0] || "você";

  return (
    <div style={{ background: "var(--bg)", color: "var(--ink)" }}>
      {/* Page hero */}
      <section style={{ padding: "40px 32px 32px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <p className="t-eyebrow mb-3">— Minha conta</p>
          <h1
            className="t-display"
            style={{ fontSize: "clamp(48px,7vw,72px)", margin: 0, lineHeight: 0.95 }}
          >
            Olá,{" "}
            <span className="t-display-italic" style={{ color: "var(--gold)" }}>
              {firstName}
            </span>
            .
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 12 }}>
            {session?.user?.email}
          </p>
        </div>
      </section>

      {/* Content */}
      <section style={{ padding: "0 32px 96px" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: 64,
          }}
          className="max-md:grid-cols-1 max-md:gap-8"
        >
          {/* Sidebar */}
          <aside>
            <nav
              style={{
                display: "flex",
                flexDirection: "column",
                borderTop: "1px solid var(--line-soft)",
              }}
            >
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => handleTabClick(id)}
                  style={{
                    padding: "18px 0",
                    textAlign: "left",
                    borderBottom: "1px solid var(--line-soft)",
                    background: "transparent",
                    border: 0,
                    borderBottomColor: "var(--line-soft)",
                    borderBottomStyle: "solid",
                    borderBottomWidth: 1,
                    fontFamily: "var(--font-sans)",
                    fontSize: 14,
                    fontWeight: tab === id ? 600 : 400,
                    color: tab === id ? "var(--ink)" : "var(--muted)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    transition: "color 0.15s",
                  }}
                >
                  {label}
                  <span style={{ color: tab === id ? "var(--ink)" : "var(--line-soft)" }}>→</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <div>
            {/* ── Perfil ── */}
            {tab === "perfil" && (
              <div>
                <h2
                  className="t-display"
                  style={{ fontSize: 40, margin: "0 0 28px", lineHeight: 0.95 }}
                >
                  Perfil
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 28,
                    maxWidth: 640,
                  }}
                  className="max-sm:grid-cols-1"
                >
                  <div>
                    <p className="t-eyebrow mb-1.5">Nome completo</p>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      style={fieldStyle}
                    />
                  </div>
                  <div>
                    <p className="t-eyebrow mb-1.5">WhatsApp</p>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      maxLength={13}
                      placeholder="11999999999"
                      style={fieldStyle}
                    />
                  </div>
                  <div>
                    <p className="t-eyebrow mb-1.5">E-mail</p>
                    <input
                      value={session?.user?.email ?? ""}
                      disabled
                      style={{ ...fieldStyle, color: "var(--muted)", cursor: "not-allowed" }}
                    />
                  </div>
                </div>

                {error   && <p style={{ fontSize: 13, color: "#c0392b", marginTop: 16 }}>{error}</p>}
                {success && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#27ae60", marginTop: 16 }}>
                    <Check size={14} /> {success}
                  </div>
                )}

                <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
                  <SaveButton loading={saving} onClick={handleSave} />
                </div>
              </div>
            )}

            {/* ── Segurança ── */}
            {tab === "seguranca" && (
              <div>
                <h2
                  className="t-display"
                  style={{ fontSize: 40, margin: "0 0 28px", lineHeight: 0.95 }}
                >
                  Segurança
                </h2>
                <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 28 }}>
                  Deixe os campos em branco para não alterar a senha.
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 28,
                    maxWidth: 640,
                  }}
                  className="max-sm:grid-cols-1"
                >
                  <div style={{ gridColumn: "1 / -1" }}>
                    <p className="t-eyebrow mb-1.5">Senha atual</p>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      style={fieldStyle}
                    />
                  </div>
                  <div>
                    <p className="t-eyebrow mb-1.5">Nova senha</p>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      style={fieldStyle}
                    />
                  </div>
                  <div>
                    <p className="t-eyebrow mb-1.5">Confirmar nova senha</p>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a senha"
                      style={fieldStyle}
                    />
                  </div>
                </div>

                {error   && <p style={{ fontSize: 13, color: "#c0392b", marginTop: 16 }}>{error}</p>}
                {success && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#27ae60", marginTop: 16 }}>
                    <Check size={14} /> {success}
                  </div>
                )}

                <div style={{ marginTop: 32 }}>
                  <SaveButton loading={saving} onClick={handleSave} label="Atualizar senha" />
                </div>
              </div>
            )}

            {/* ── Endereços ── */}
            {tab === "enderecos" && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 28,
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <h2
                    className="t-display"
                    style={{ fontSize: 40, margin: 0, lineHeight: 0.95 }}
                  >
                    Endereços
                  </h2>
                  <button
                    style={{
                      padding: "10px 20px",
                      background: "transparent",
                      color: "var(--ink)",
                      border: "1px solid var(--ink)",
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      borderRadius: "var(--r-sm)",
                    }}
                  >
                    + Novo endereço
                  </button>
                </div>
                <p style={{ fontSize: 14, color: "var(--muted)" }}>
                  Gerencie seus endereços de entrega aqui.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function SaveButton({
  loading,
  onClick,
  label = "Salvar alterações",
}: {
  loading: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: "16px 32px",
        background: loading ? "var(--muted)" : "var(--ink)",
        color: "var(--bg)",
        border: "1px solid var(--ink)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        cursor: loading ? "not-allowed" : "pointer",
        borderRadius: "var(--r-sm)",
        transition: "background 0.2s",
      }}
    >
      {loading ? "Salvando…" : label}
    </button>
  );
}
