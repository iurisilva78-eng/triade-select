"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { Filter, X } from "lucide-react";

export function DateFilter() {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();

  const [from, setFrom] = useState(sp.get("from") ?? "");
  const [to, setTo] = useState(sp.get("to") ?? "");

  const apply = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`${pathname}?${params}`);
  };

  const clear = () => {
    setFrom("");
    setTo("");
    router.push(pathname);
  };

  const hasFilter = !!(sp.get("from") || sp.get("to"));

  return (
    <div className="flex flex-wrap items-end gap-3 mb-6">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--text-muted)] font-medium">De</label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--gold)]"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--text-muted)] font-medium">Até</label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--gold)]"
        />
      </div>
      <button
        onClick={apply}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--gold)] text-black text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
      >
        <Filter size={14} /> Filtrar
      </button>
      {hasFilter && (
        <button
          onClick={clear}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)] text-sm rounded-xl hover:border-[var(--gold)] transition-colors"
        >
          <X size={14} /> Limpar filtro
        </button>
      )}
    </div>
  );
}
