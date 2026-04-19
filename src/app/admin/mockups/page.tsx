"use client";

import { useState, useEffect } from "react";
import { MockupPreview } from "@/components/produto/MockupPreview";
import { DEFAULT_MOCKUP_CONFIG, MockupTypeConfig } from "@/lib/mockup-config";

/* ── tipos internos (valores numéricos para sliders) ── */
type ZoneState = { top: number; left: number; size: number; label: string };
type ConfigState = Record<string, { image: string; zones: ZoneState[] }>;

function parsePercent(v: string) {
  return parseFloat(v.replace("%", "")) || 0;
}

function fromApi(config: Record<string, MockupTypeConfig>): ConfigState {
  const out: ConfigState = {};
  for (const [key, val] of Object.entries(config)) {
    out[key] = {
      image: val.image,
      zones: val.zones.map((z) => ({
        top: parsePercent(z.top),
        left: parsePercent(z.left),
        size: parsePercent(z.size),
        label: z.label ?? "",
      })),
    };
  }
  return out;
}

function toApi(state: ConfigState): Record<string, MockupTypeConfig> {
  const out: Record<string, MockupTypeConfig> = {};
  for (const [key, val] of Object.entries(state)) {
    out[key] = {
      image: val.image,
      zones: val.zones.map((z) => ({
        top: `${z.top}%`,
        left: `${z.left}%`,
        size: `${z.size}%`,
        label: z.label,
      })),
    };
  }
  return out;
}

const TABS = [
  { key: "capa", label: "Capa" },
  { key: "camiseta", label: "Camiseta" },
  { key: "camiseta-dupla", label: "Camiseta Dupla" },
];

/* ── componente principal ── */
export default function MockupsAdminPage() {
  const [config, setConfig] = useState<ConfigState>(() =>
    fromApi(DEFAULT_MOCKUP_CONFIG)
  );
  const [selected, setSelected] = useState("capa");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  /* carrega config salva */
  useEffect(() => {
    fetch("/api/admin/mockup-config")
      .then((r) => r.json())
      .then((data) => {
        if (data) setConfig(fromApi(data));
      })
      .finally(() => setLoading(false));
  }, []);

  const updateZone = (
    key: string,
    zoneIdx: number,
    field: keyof ZoneState,
    value: number
  ) => {
    setConfig((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        zones: prev[key].zones.map((z, i) =>
          i === zoneIdx ? { ...z, [field]: value } : z
        ),
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg("");
    try {
      const res = await fetch("/api/admin/mockup-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toApi(config)),
      });
      if (res.ok) {
        setSavedMsg("✓ Configurações salvas!");
        setTimeout(() => setSavedMsg(""), 4000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(fromApi(DEFAULT_MOCKUP_CONFIG));
    setSavedMsg("");
  };

  /* prévia em tempo real */
  const previewConfig = toApi(config);
  const currentZones = config[selected]?.zones ?? [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-white/40">
        Carregando…
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Posição dos Mockups</h1>
          <p className="text-white/50 text-sm mt-1">
            Ajuste posição e tamanho da logo em cada modelo de produto
          </p>
        </div>

        <div className="flex items-center gap-3">
          {savedMsg && (
            <span className="text-green-400 text-sm font-medium">{savedMsg}</span>
          )}
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg border border-white/20 text-white/60 hover:text-white hover:border-white/40 text-sm transition"
          >
            Restaurar padrão
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg transition disabled:opacity-50"
          >
            {saving ? "Salvando…" : "Salvar configurações"}
          </button>
        </div>
      </div>

      {/* tabs de modelo */}
      <div className="flex gap-2 border-b border-white/10 pb-0">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSelected(key)}
            className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition -mb-px border border-transparent ${
              selected === key
                ? "bg-[var(--surface)] border-white/10 border-b-transparent text-amber-400"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* grid: controles + prévia */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── controles ── */}
        <div className="space-y-4">
          {currentZones.length === 0 ? (
            <p className="text-white/40 text-sm">Nenhuma zona configurada.</p>
          ) : (
            currentZones.map((zone, idx) => (
              <div
                key={idx}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5"
              >
                {/* título da zona */}
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center text-black text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <h3 className="text-white font-semibold">
                    Logo — {zone.label || `Zona ${idx + 1}`}
                  </h3>
                </div>

                <SliderRow
                  label="Posição vertical (top)"
                  hint="0% = topo · 100% = base"
                  value={zone.top}
                  min={0}
                  max={90}
                  onChange={(v) => updateZone(selected, idx, "top", v)}
                />

                <SliderRow
                  label="Posição horizontal (left)"
                  hint="0% = esquerda · 100% = direita"
                  value={zone.left}
                  min={0}
                  max={100}
                  onChange={(v) => updateZone(selected, idx, "left", v)}
                />

                <SliderRow
                  label="Tamanho"
                  hint="porcentagem da largura total"
                  value={zone.size}
                  min={1}
                  max={70}
                  onChange={(v) => updateZone(selected, idx, "size", v)}
                />
              </div>
            ))
          )}

          {/* valores atuais */}
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-white/40 text-xs font-mono mb-2">Valores atuais:</p>
            <div className="space-y-1">
              {currentZones.map((z, i) => (
                <p key={i} className="text-white/60 text-xs font-mono">
                  <span className="text-amber-400">{z.label || `zona ${i + 1}`}</span>:{" "}
                  top={z.top}% · left={z.left}% · size={z.size}%
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* ── prévia ao vivo ── */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Prévia ao vivo</h3>
            <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
              Tempo real
            </span>
          </div>

          <div className="flex-1 aspect-[3/4] rounded-xl overflow-hidden bg-black/30">
            <MockupPreview
              mockupType={selected}
              logoPreview="/logo.png"
              configOverride={previewConfig}
            />
          </div>

          <p className="text-white/30 text-xs text-center mt-3">
            Logo de exemplo (sua logo oficial) · Reflecte as alterações em tempo real
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── slider reutilizável ── */
function SliderRow({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1">
        <div>
          <span className="text-white/70 text-sm">{label}</span>
          {hint && <p className="text-white/30 text-xs">{hint}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={(e) => onChange(clamp(Number(e.target.value)))}
            className="w-14 text-right bg-white/10 text-white text-sm rounded-lg px-2 py-1 border border-white/20 focus:outline-none focus:border-amber-500"
          />
          <span className="text-white/40 text-sm">%</span>
        </div>
      </div>

      {/* trilha customizada */}
      <div className="relative mt-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 appearance-none rounded-full cursor-pointer accent-amber-500"
          style={{
            background: `linear-gradient(to right, #f59e0b ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%)`,
          }}
        />
      </div>
    </div>
  );
}
