"use client";

import React, { useState, useEffect } from "react";
import { MockupPreview } from "@/components/produto/MockupPreview";
import { DEFAULT_MOCKUP_CONFIG, MockupTypeConfig } from "@/lib/mockup-config";

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

const GROUPS = [
  {
    label: "Capas de Barbearia",
    color: "#f59e0b",
    tabs: [
      { key: "capa", label: "Capa Tradicional" },
    ],
  },
  {
    label: "Camisetas",
    color: "#3b82f6",
    tabs: [
      { key: "camiseta", label: "Camiseta — Peito" },
      { key: "camiseta-dupla", label: "Camiseta — Peito + Costas" },
    ],
  },
  {
    label: "Golas T-Confort",
    color: "#10b981",
    tabs: [
      { key: "polo", label: "Polo / Gola" },
      { key: "gola-tconfort", label: "T-Confort Lisa" },
      { key: "gola-tconfort-risca", label: "T-Confort Risca de Giz" },
    ],
  },
];

const ALL_TABS = GROUPS.flatMap((g) => g.tabs);

export default function MockupsAdminPage() {
  const [config, setConfig] = useState<ConfigState>(() =>
    fromApi(DEFAULT_MOCKUP_CONFIG)
  );
  const [selected, setSelected] = useState("capa");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/mockup-config")
      .then((r) => r.json())
      .then((data) => {
        if (data && typeof data === "object") {
          // Merge: defaults first, then saved config on top.
          // This ensures new types (polo, gola-tconfort, etc.) always have zones
          // even if they were added after the last DB save.
          const merged = { ...DEFAULT_MOCKUP_CONFIG, ...data };
          setConfig(fromApi(merged));
        }
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
        setSavedMsg("Configurações salvas!");
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

  const previewConfig = toApi(config);
  const currentZones = config[selected]?.zones ?? [];

  const activeGroup = GROUPS.find((g) => g.tabs.some((t) => t.key === selected));
  const activeColor = activeGroup?.color ?? "#f59e0b";
  const activeLabel = ALL_TABS.find((t) => t.key === selected)?.label ?? selected;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "256px", color: "#9ca3af" }}>
        Carregando…
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Cabeçalho */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#f9fafb", margin: 0 }}>
            Posição dos Mockups
          </h1>
          <p style={{ color: "#9ca3af", fontSize: "14px", marginTop: "4px", marginBottom: 0 }}>
            Ajuste posição e tamanho da logo em cada modelo de produto
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {savedMsg && (
            <span style={{ color: "#34d399", fontSize: "14px", fontWeight: 500 }}>
              ✓ {savedMsg}
            </span>
          )}
          <button
            onClick={handleReset}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #374151", background: "#1f2937", color: "#d1d5db", fontSize: "14px", cursor: "pointer" }}
          >
            Restaurar padrão
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: "10px 24px", borderRadius: "8px", border: "none", background: saving ? "#92400e" : "#f59e0b", color: "#000", fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Salvando…" : "Salvar configurações"}
          </button>
        </div>
      </div>

      {/* Grupos de tabs */}
      <div style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "8px" }}>
        {GROUPS.map((group) => (
          <div key={group.label} style={{ background: "#111827", borderRadius: "12px", border: "1px solid #1f2937", overflow: "hidden" }}>
            <div style={{ padding: "8px 16px", background: "#1f2937", borderBottom: "1px solid #374151", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: group.color, display: "inline-block", flexShrink: 0 }} />
              <span style={{ color: "#e5e7eb", fontSize: "13px", fontWeight: 600 }}>
                {group.label}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "10px 12px" }}>
              {group.tabs.map(({ key, label }) => {
                const isActive = selected === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: isActive ? `2px solid ${group.color}` : "2px solid #374151",
                      background: isActive ? `${group.color}22` : "#1f2937",
                      color: isActive ? group.color : "#9ca3af",
                      fontSize: "14px",
                      fontWeight: isActive ? 600 : 400,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Grid: controles + prévia */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "20px" }}>
        {/* Controles */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: "#1f2937", border: `1px solid ${activeColor}44`, borderRadius: "10px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: activeColor, display: "inline-block" }} />
            <span style={{ color: "#e5e7eb", fontSize: "13px" }}>
              Editando: <strong style={{ color: activeColor }}>{activeLabel}</strong>
            </span>
          </div>

          {currentZones.length === 0 ? (
            <p style={{ color: "#6b7280", fontSize: "14px" }}>Nenhuma zona configurada.</p>
          ) : (
            currentZones.map((zone, idx) => (
              <div key={idx} style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "12px", padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                  <span style={{ width: "28px", height: "28px", borderRadius: "50%", background: activeColor, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: "12px", fontWeight: 700, flexShrink: 0 }}>
                    {idx + 1}
                  </span>
                  <h3 style={{ color: "#f3f4f6", fontWeight: 600, margin: 0, fontSize: "15px" }}>
                    Logo — {zone.label || `Zona ${idx + 1}`}
                  </h3>
                </div>
                <SliderRow label="Posição vertical (top)" hint="0% = topo · 100% = base" value={zone.top} min={0} max={90} accentColor={activeColor} onChange={(v) => updateZone(selected, idx, "top", v)} />
                <SliderRow label="Posição horizontal (left)" hint="0% = esquerda · 100% = direita" value={zone.left} min={0} max={100} accentColor={activeColor} onChange={(v) => updateZone(selected, idx, "left", v)} />
                <SliderRow label="Tamanho" hint="porcentagem da largura total" value={zone.size} min={1} max={70} accentColor={activeColor} onChange={(v) => updateZone(selected, idx, "size", v)} />
              </div>
            ))
          )}

          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: "10px", padding: "14px" }}>
            <p style={{ color: "#6b7280", fontSize: "11px", fontFamily: "monospace", marginBottom: "8px", marginTop: 0 }}>Valores atuais:</p>
            {currentZones.map((z, i) => (
              <p key={i} style={{ color: "#9ca3af", fontSize: "12px", fontFamily: "monospace", margin: "4px 0" }}>
                <span style={{ color: activeColor }}>{z.label || `zona ${i + 1}`}</span>:{" "}
                top={z.top}% · left={z.left}% · size={z.size}%
              </p>
            ))}
          </div>
        </div>

        {/* Prévia ao vivo */}
        <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h3 style={{ color: "#f3f4f6", fontWeight: 600, margin: 0, fontSize: "15px" }}>Prévia ao vivo</h3>
            <span style={{ fontSize: "11px", background: `${activeColor}33`, color: activeColor, padding: "2px 10px", borderRadius: "20px", fontWeight: 600 }}>
              Tempo real
            </span>
          </div>
          <div style={{ aspectRatio: "3/4", borderRadius: "10px", overflow: "hidden", background: "#0f172a" }}>
            <MockupPreview mockupType={selected} logoPreview="/logo.png" configOverride={previewConfig} />
          </div>
          <p style={{ color: "#4b5563", fontSize: "11px", textAlign: "center", marginTop: "12px", marginBottom: 0 }}>
            Logo de exemplo · Reflecte as alterações em tempo real
          </p>
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label, hint, value, min, max, accentColor, onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  accentColor: string;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "6px" }}>
        <div>
          <span style={{ color: "#d1d5db", fontSize: "13px" }}>{label}</span>
          {hint && <p style={{ color: "#6b7280", fontSize: "11px", margin: "2px 0 0 0" }}>{hint}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={(e) => onChange(clamp(Number(e.target.value)))}
            style={{ width: "52px", textAlign: "right", background: "#111827", color: "#f3f4f6", fontSize: "13px", borderRadius: "6px", padding: "4px 8px", border: "1px solid #374151", outline: "none" }}
          />
          <span style={{ color: "#6b7280", fontSize: "13px" }}>%</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          height: "6px",
          appearance: "none" as React.CSSProperties["appearance"],
          borderRadius: "4px",
          cursor: "pointer",
          outline: "none",
          background: `linear-gradient(to right, ${accentColor} ${pct}%, #374151 ${pct}%)`,
        }}
      />
    </div>
  );
}
