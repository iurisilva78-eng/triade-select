"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function TriangleMark({ size = 22, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <polygon points="50,8 90,80 10,80" stroke={color} strokeWidth="5" fill="none" strokeLinejoin="round" />
      <polygon points="50,28 78,75 22,75" stroke={color} strokeWidth="4" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }
    if (form.password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone.replace(/\D/g, ""),
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao cadastrar.");
        setLoading(false);
        return;
      }

      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      router.push("/produtos");
      router.refresh();
    } catch {
      setError("Erro ao cadastrar. Tente novamente.");
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
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

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--ink)",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
      }}
      className="max-md:grid-cols-1"
    >
      {/* Left: form */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 32px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 440 }}>
          <p className="t-eyebrow mb-4">— Cadastro</p>
          <h1
            className="t-display"
            style={{ fontSize: "clamp(40px,5vw,56px)", margin: "0 0 10px", lineHeight: 0.95 }}
          >
            Crie sua
            <br />
            <span className="t-display-italic" style={{ color: "var(--gold)" }}>
              conta
            </span>
            .
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 36px" }}>
            Receba novidades, pedidos e acesso B2B.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            <div>
              <p className="t-eyebrow mb-1.5">Nome completo</p>
              <input
                placeholder="Seu nome"
                value={form.name}
                onChange={set("name")}
                required
                autoComplete="name"
                style={inputStyle}
              />
            </div>

            <div>
              <p className="t-eyebrow mb-1.5">E-mail</p>
              <input
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={set("email")}
                required
                autoComplete="email"
                style={inputStyle}
              />
            </div>

            <div>
              <p className="t-eyebrow mb-1.5">WhatsApp</p>
              <input
                type="tel"
                placeholder="(11) 99999-9999"
                value={form.phone}
                onChange={set("phone")}
                required
                autoComplete="tel"
                style={inputStyle}
              />
            </div>

            <div>
              <p className="t-eyebrow mb-1.5">Senha</p>
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={set("password")}
                required
                autoComplete="new-password"
                style={inputStyle}
              />
            </div>

            <div>
              <p className="t-eyebrow mb-1.5">Confirmar senha</p>
              <input
                type="password"
                placeholder="Repita a senha"
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                required
                autoComplete="new-password"
                style={inputStyle}
              />
            </div>

            {error && (
              <p style={{ fontSize: 13, color: "#c0392b", margin: 0 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 8,
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
              }}
            >
              {loading ? "Criando conta…" : "Criar conta"}
            </button>
          </form>

          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 24, textAlign: "center" }}>
            Já tem conta?{" "}
            <Link
              href="/login"
              style={{
                color: "var(--ink)",
                borderBottom: "1px solid var(--ink)",
                textDecoration: "none",
              }}
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>

      {/* Right: editorial image panel */}
      <div
        className="mockup-bg grain relative overflow-hidden hidden md:block"
        style={{ minHeight: "100vh" }}
      >
        <img
          src="/mockups/camiseta-dupla.png"
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            mixBlendMode: "multiply",
          }}
        />
        {/* Wordmark top-right */}
        <div className="absolute top-10 right-10 flex items-center gap-2.5">
          <TriangleMark size={22} color="var(--gold)" />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: 16,
              letterSpacing: "0.02em",
            }}
          >
            TRIADE <span style={{ fontStyle: "italic", fontWeight: 300, color: "var(--gold)" }}>select</span>
          </span>
        </div>
        {/* Quote bottom-left */}
        <div className="absolute bottom-10 left-10 right-10">
          <p className="t-eyebrow mb-4">— Programa B2B</p>
          <div
            className="t-display"
            style={{ fontSize: "clamp(28px,3vw,44px)", lineHeight: 0.95 }}
          >
            Condições{" "}
            <span className="t-display-italic" style={{ color: "var(--gold)" }}>
              especiais
            </span>{" "}
            para barbearias cadastradas.
          </div>
        </div>
      </div>
    </div>
  );
}
