"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export interface Conta { id: string; nome: string; tipo: "BANCO" | "CAIXA" | "SOCIO" }
export interface Categoria { id: string; nome: string; tipo: "RECEITA" | "DESPESA" | "RETIRADA" | "TRANSFERENCIA" | "AJUSTE" }

export const TIPO_CAT: Record<Categoria["tipo"], string> = {
  RECEITA: "Receitas", DESPESA: "Despesas", RETIRADA: "Retiradas",
  TRANSFERENCIA: "Transferências", AJUSTE: "Ajustes",
};

export function brl(centavos: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
}

/** "1.234,56" -> 123456 (centavos). Lança erro se inválido. */
export function lerValor(texto: string): number {
  let s = texto.replace(/R\$|\s/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  if (!s || !Number.isFinite(n)) throw new Error("Valor inválido");
  return Math.round(n * 100);
}

export const mesAtual = () => new Date().toISOString().slice(0, 7);
export const hoje = () => new Date().toISOString().slice(0, 10);

export function useMeta() {
  const [meta, setMeta] = useState<{ contas: Conta[]; categorias: Categoria[] } | null>(null);
  useEffect(() => { fetch("/api/admin/financeiro/meta").then((r) => r.json()).then(setMeta); }, []);
  return meta;
}

/** Mês escolhido, guardado na URL (?mes=) pra sobreviver ao trocar de aba. */
export function useMes(): [string, (m: string) => void] {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const m = params.get("mes");
  const mes = m && /^\d{4}-\d{2}$/.test(m) ? m : mesAtual();
  const trocar = (novo: string) => {
    const q = new URLSearchParams(params.toString());
    q.set("mes", novo);
    router.replace(`${path}?${q}`);
  };
  return [mes, trocar];
}

export function CategoriaSelect({ categorias, value, onChange, className }: {
  categorias: Categoria[]; value: string | null; onChange: (id: string) => void; className?: string;
}) {
  const grupos = (Object.keys(TIPO_CAT) as Categoria["tipo"][]).map((t) => ({
    tipo: t, itens: categorias.filter((c) => c.tipo === t),
  }));
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}
      className={`bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm text-[var(--text)] ${!value ? "border-amber-500/60" : ""} ${className ?? ""}`}>
      <option value="">— sem categoria —</option>
      {grupos.map((g) => (
        <optgroup key={g.tipo} label={TIPO_CAT[g.tipo]}>
          {g.itens.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </optgroup>
      ))}
    </select>
  );
}

export function Cabecalho({ titulo, subtitulo, mes, onMes }: {
  titulo: string; subtitulo?: string; mes?: string; onMes?: (m: string) => void;
}) {
  const path = usePathname();
  const abas = [
    { href: "/admin/financeiro", label: "Resumo" },
    { href: "/admin/financeiro/lancamentos", label: "Lançamentos" },
    { href: "/admin/financeiro/importar", label: "Importar extrato" },
  ];
  const q = mes ? `?mes=${mes}` : "";
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">{titulo}</h1>
          {subtitulo && <p className="text-sm text-[var(--text-muted)] mt-1">{subtitulo}</p>}
        </div>
        {mes && onMes && (
          <input type="month" value={mes} onChange={(e) => e.target.value && onMes(e.target.value)}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)]" />
        )}
      </div>
      <nav className="flex gap-1 mt-4 border-b border-[var(--border)] overflow-x-auto">
        {abas.map((a) => (
          <Link key={a.href} href={a.href + q}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${path === a.href
              ? "border-[var(--gold)] text-[var(--text)]" : "border-transparent text-[var(--text-muted)] hover:text-[var(--text)]"}`}>
            {a.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function Cartao({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 ${className ?? ""}`}>{children}</div>;
}
