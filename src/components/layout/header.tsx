"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { LogOut, Settings, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";

/* ── Triângulo duplo da marca ──────────────────────────── */
function TriangleMark({ size = 26, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <polygon points="50,8 90,80 10,80" stroke={color} strokeWidth="5" fill="none" strokeLinejoin="round" />
      <polygon points="50,28 78,75 22,75" stroke={color} strokeWidth="4" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const itemCount = useCartStore((s) => s.items.length);
  const user = session?.user as any;

  return (
    <header className="sticky top-0 z-50" style={{ background: "color-mix(in oklab, var(--bg) 92%, transparent)", backdropFilter: "blur(14px)", borderBottom: "1px solid var(--line-hair)" }}>
      <div className="max-w-[1440px] mx-auto px-5 md:px-8 h-[68px] flex items-center justify-between">

        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-2.5">
          <TriangleMark size={26} color="var(--gold)" />
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: 17, letterSpacing: "0.02em", lineHeight: 1 }}>
            TRIADE <span style={{ fontStyle: "italic", fontWeight: 300, color: "var(--gold)" }}>select</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-[13px] tracking-[0.02em]">
          <Link href="/produtos" className="text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">
            Produtos
          </Link>
          {session && (
            <>
              <Link href="/pedidos" className="text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">
                Meus Pedidos
              </Link>
              <Link href="/conta" className="text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors flex items-center gap-1">
                <User size={13} /> Minha Conta
              </Link>
            </>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="text-[var(--gold)] hover:text-[var(--gold-dark)] transition-colors flex items-center gap-1">
              <Settings size={13} /> Admin
            </Link>
          )}
        </nav>

        {/* Direita — sacola + login */}
        <div className="flex items-center gap-4">
          {session ? (
            <div className="hidden md:flex items-center gap-4 text-[13px] tracking-[0.02em]">
              <span className="text-[var(--muted)]">Olá, {session.user?.name?.split(" ")[0]}</span>
              <button onClick={() => signOut()} className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-5 text-[13px] tracking-[0.04em] uppercase font-medium">
              <Link href="/login" className="text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">
                Entrar
              </Link>
              <Link href="/cadastro" className="text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">
                Cadastrar
              </Link>
            </div>
          )}

          {/* Sacola */}
          <Link href="/carrinho" className="flex items-center gap-1.5 text-[13px] tracking-[0.04em] uppercase font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors">
            Sacola
            <span className="t-mono text-[11px] text-[var(--muted)]">
              ({String(itemCount).padStart(2, "0")})
            </span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-[var(--ink)] p-1"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden px-5 py-5 flex flex-col gap-4 text-[15px] font-medium"
          style={{ borderTop: "1px solid var(--line-soft)", background: "var(--bg)" }}
        >
          <Link href="/produtos" onClick={() => setMenuOpen(false)} className="text-[var(--ink)]">Produtos</Link>
          {session && (
            <>
              <Link href="/pedidos" onClick={() => setMenuOpen(false)} className="text-[var(--ink)]">Meus Pedidos</Link>
              <Link href="/conta" onClick={() => setMenuOpen(false)} className="text-[var(--ink)]">Minha Conta</Link>
            </>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-[var(--gold)]">Painel Admin</Link>
          )}
          <div style={{ borderTop: "1px solid var(--line-soft)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {session ? (
              <button onClick={() => { signOut(); setMenuOpen(false); }} className="text-[var(--muted)] text-left text-sm flex items-center gap-2">
                <LogOut size={15} /> Sair
              </button>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="text-[var(--ink-soft)]">Entrar</Link>
                <Link href="/cadastro" onClick={() => setMenuOpen(false)} className="text-[var(--ink)]">Cadastrar</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
