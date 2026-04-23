"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ShoppingBag, LogOut, Settings, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const itemCount = useCartStore((s) => s.items.length);
  const user = session?.user as any;

  return (
    <header className="sticky top-0 z-50 bg-[var(--bg)]/95 backdrop-blur border-b border-[var(--border)]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-1 shadow-sm">
            <img src="/logo.png" alt="Triade Select" className="w-full h-full object-contain" onError={(e)=>{(e.target as HTMLImageElement).src="/logo.svg"}} />
          </div>
          <span className="font-bold text-lg text-[var(--text)]">
            Triade <span className="text-[var(--gold)]">Select</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/produtos"
            className="text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors text-sm font-medium"
          >
            Produtos
          </Link>
          {session && (
            <>
              <Link href="/pedidos" className="text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors text-sm font-medium">
                Meus Pedidos
              </Link>
              <Link href="/conta" className="text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors text-sm font-medium flex items-center gap-1">
                <User size={13} /> Minha Conta
              </Link>
            </>
          )}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-[var(--gold)] hover:text-[var(--gold-light)] transition-colors text-sm font-medium flex items-center gap-1"
            >
              <Settings size={14} /> Admin
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Carrinho */}
          <Link href="/carrinho" className="relative p-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors">
            <ShoppingBag size={20} className="text-[var(--text-secondary)]" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[var(--gold)] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </Link>

          {session ? (
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-[var(--text-secondary)]">
                Olá, {session.user?.name?.split(" ")[0]}
              </span>
              <button
                onClick={() => signOut()}
                className="p-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">Entrar</Button>
              </Link>
              <Link href="/cadastro">
                <Button size="sm">Cadastrar</Button>
              </Link>
            </div>
          )}

          {/* Mobile menu */}
          <button
            className="md:hidden p-2 rounded-xl hover:bg-[var(--surface-2)] transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--surface)] px-4 py-4 flex flex-col gap-3">
          <Link href="/produtos" onClick={() => setMenuOpen(false)} className="py-2 text-[var(--text-secondary)] font-medium">
            Produtos
          </Link>
          {session && (
            <>
              <Link href="/pedidos" onClick={() => setMenuOpen(false)} className="py-2 text-[var(--text-secondary)] font-medium">
                Meus Pedidos
              </Link>
              <Link href="/conta" onClick={() => setMenuOpen(false)} className="py-2 text-[var(--text-secondary)] font-medium">
                Minha Conta
              </Link>
            </>
          )}
          {user?.role === "ADMIN" && (
            <Link href="/admin" onClick={() => setMenuOpen(false)} className="py-2 text-[var(--gold)] font-medium">
              Painel Admin
            </Link>
          )}
          <div className="pt-2 border-t border-[var(--border)] flex flex-col gap-2">
            {session ? (
              <Button variant="ghost" onClick={() => { signOut(); setMenuOpen(false); }}>
                <LogOut size={16} /> Sair
              </Button>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Entrar</Button>
                </Link>
                <Link href="/cadastro" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full">Cadastrar</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
