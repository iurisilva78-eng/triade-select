"use client";

import { useState } from "react";
import { Ruler, X, ChevronDown } from "lucide-react";

const SIZES = [
  { label: "PP", num: 2,  torax: 100, length: 70 },
  { label: "P",  num: 3,  torax: 106, length: 70 },
  { label: "M",  num: 4,  torax: 110, length: 75 },
  { label: "G",  num: 5,  torax: 116, length: 80 },
  { label: "GG", num: 6,  torax: 120, length: 80 },
];

const PLUS_SIZES = [
  { label: "G1", num: 50, torax: 124, length: 85 },
  { label: "G2", num: 52, torax: 128, length: 85 },
  { label: "G3", num: 54, torax: 132, length: 88 },
  { label: "G4", num: 56, torax: 136, length: 88 },
];

const ALL_SIZES = [...SIZES, ...PLUS_SIZES];

function calcSize(torax: number): string {
  // Encontra o menor tamanho cujo torax >= medida do cliente
  const match = ALL_SIZES.find((s) => s.torax >= torax);
  if (!match) return ALL_SIZES[ALL_SIZES.length - 1].label; // G4 se maior que tudo
  return match.label;
}

export function SizeGuide() {
  const [open, setOpen] = useState(false);
  const [toraxInput, setToraxInput] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const handleCalc = () => {
    const v = parseFloat(toraxInput.replace(",", "."));
    if (!v || v < 50) { setResult("Informe uma medida válida (cm)."); return; }
    setResult(calcSize(v));
  };

  return (
    <>
      {/* Botão trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[var(--gold)] hover:text-amber-400 transition-colors underline underline-offset-2"
      >
        <Ruler size={13} /> Guia de tamanhos
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[var(--text)] flex items-center gap-2">
                <Ruler size={18} className="text-[var(--gold)]" /> Guia de Tamanhos
              </h2>
              <button onClick={() => setOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                <X size={20} />
              </button>
            </div>

            {/* Tabela regular */}
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Tamanhos regulares</p>
            <div className="rounded-xl overflow-hidden border border-[var(--border)] mb-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                    <th className="px-4 py-2.5 text-left text-[var(--text-muted)] font-semibold">Tamanho</th>
                    <th className="px-4 py-2.5 text-left text-[var(--text-muted)] font-semibold">Nº</th>
                    <th className="px-4 py-2.5 text-left text-[var(--text-muted)] font-semibold">Tórax (cm)</th>
                    <th className="px-4 py-2.5 text-left text-[var(--text-muted)] font-semibold">Comprimento (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {SIZES.map((s) => (
                    <tr key={s.label} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-4 py-2.5 font-bold text-[var(--gold)]">{s.label}</td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">{s.num}</td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">{s.torax}</td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">{s.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tabela plus */}
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">Tamanhos Plus</p>
            <div className="rounded-xl overflow-hidden border border-[var(--border)] mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--surface-2)] border-b border-[var(--border)]">
                    <th className="px-4 py-2.5 text-left text-[var(--text-muted)] font-semibold">Tamanho</th>
                    <th className="px-4 py-2.5 text-left text-[var(--text-muted)] font-semibold">Nº</th>
                    <th className="px-4 py-2.5 text-left text-[var(--text-muted)] font-semibold">Tórax (cm)</th>
                    <th className="px-4 py-2.5 text-left text-[var(--text-muted)] font-semibold">Comprimento (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {PLUS_SIZES.map((s) => (
                    <tr key={s.label} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)] transition-colors">
                      <td className="px-4 py-2.5 font-bold text-[var(--gold)]">{s.label}</td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">{s.num}</td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">{s.torax}</td>
                      <td className="px-4 py-2.5 text-[var(--text-secondary)]">{s.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculadora */}
            <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4">
              <p className="font-semibold text-[var(--text)] mb-1 flex items-center gap-2">
                🎯 Qual é o meu tamanho?
              </p>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                Meça a circunferência do seu tórax (a parte mais larga do peito) e insira abaixo.
              </p>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs text-[var(--text-muted)] font-medium block mb-1">Circunferência do tórax (cm)</label>
                  <input
                    type="number"
                    placeholder="Ex: 108"
                    value={toraxInput}
                    onChange={(e) => { setToraxInput(e.target.value); setResult(null); }}
                    className="w-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)]"
                  />
                </div>
                <button
                  onClick={handleCalc}
                  className="px-4 py-2.5 bg-[var(--gold)] text-black font-bold rounded-xl text-sm hover:bg-amber-400 transition-colors shrink-0"
                >
                  Calcular
                </button>
              </div>

              {result && (
                <div className={`mt-3 px-4 py-3 rounded-xl text-sm font-semibold ${
                  result.length <= 3
                    ? "bg-green-500/15 border border-green-500/30 text-green-400"
                    : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                }`}>
                  {result.length <= 3
                    ? `✅ Tamanho recomendado: ${result}`
                    : `⚠️ ${result}`}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
