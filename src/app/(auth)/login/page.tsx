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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-mail ou senha inválidos.");
    } else {
      router.push("/produtos");
      router.refresh();
    }
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
      {/* Left: editorial image panel */}
      <div
        className="mockup-bg grain relative overflow-hidden hidden md:block"
        style={{ minHeight: "100vh" }}
      >
        <img
          src="/mockups/capa.png"
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            mixBlendMode: "multiply",
          }}
        />
        {/* Wordmark top-left */}
        <div className="absolute top-10 left-10 flex items-center gap-2.5">
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
          <p className="t-eyebrow mb-4">— Área do cliente</p>
          <div
            className="t-display"
            style={{ fontSize: "clamp(32px,3.5vw,52px)", lineHeight: 0.95 }}
          >
            A mesma{" "}
            <span className="t-display-italic" style={{ color: "var(--gold)" }}>
              qualidade
            </span>{" "}
            da cadeira, na sua conta.
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 32px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 400 }}>
          <p className="t-eyebrow mb-4">— Entrar</p>
          <h1
            className="t-display"
            style={{ fontSize: "clamp(40px,5vw,56px)", margin: "0 0 10px", lineHeight: 0.95 }}
          >
            Bem-vindo
            <br />
            de{" "}
            <span className="t-display-italic" style={{ color: "var(--gold)" }}>
              volta
            </span>
            .
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 40px" }}>
            Acesse sua conta Triade Select.
          </p>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 22 }}
          >
            {/* Email field */}
            <div>
              <p className="t-eyebrow mb-1.5">E-mail</p>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
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
                }}
              />
            </div>

            {/* Password field */}
            <div>
              <p className="t-eyebrow mb-1.5">Senha</p>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
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
                }}
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
                transition: "background 0.2s, color 0.2s",
              }}
            >
              {loading ? "Entrando…" : "Entrar"}
            </button>
          </form>

          <div style={{ margin: "32px 0", display: "flex", alignItems: "center", gap: 16 }}>
            <hr style={{ flex: 1, border: 0, borderTop: "1px solid var(--line-hair)" }} />
            <span className="t-eyebrow" style={{ color: "var(--muted)" }}>ou</span>
            <hr style={{ flex: 1, border: 0, borderTop: "1px solid var(--line-hair)" }} />
          </div>

          <Link href="/cadastro">
            <button
              style={{
                width: "100%",
                padding: "16px 32px",
                background: "transparent",
                color: "var(--ink)",
                border: "1px solid var(--ink)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
                borderRadius: "var(--r-sm)",
              }}
            >
              Criar conta grátis
            </button>
          </Link>

          <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 40, lineHeight: 1.5 }}>
            Ao continuar você aceita os{" "}
            <span style={{ borderBottom: "1px solid var(--muted)", cursor: "pointer" }}>
              Termos
            </span>{" "}
            e a{" "}
            <span style={{ borderBottom: "1px solid var(--muted)", cursor: "pointer" }}>
              Política de Privacidade
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
