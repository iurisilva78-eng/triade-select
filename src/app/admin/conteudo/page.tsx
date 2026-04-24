"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Save, Upload, RefreshCw, Check, ExternalLink, AlertCircle } from "lucide-react";

/* ─── Types ───────────────────────────────────────────────── */
interface ConfigItem {
  key: string;
  label: string;
  type: string;
  section: string;
  value: string;
}

/* ─── Tab definitions ─────────────────────────────────────── */
const TABS = [
  { id: "identidade",   label: "🎨 Identidade Visual" },
  { id: "announcement", label: "📣 Barra de anúncios" },
  { id: "hero",         label: "🏠 Hero" },
  { id: "features",     label: "✨ Diferenciais" },
  { id: "b2b",          label: "🤝 Banner B2B" },
  { id: "footer",       label: "🔗 Rodapé" },
  { id: "geral",        label: "⚙️ Geral & SEO" },
] as const;
type TabId = (typeof TABS)[number]["id"];

/* ─── Font options ────────────────────────────────────────── */
const DISPLAY_FONTS = [
  { value: "DM Serif Display",  sample: "Aa Bb Cc" },
  { value: "Fraunces",          sample: "Aa Bb Cc" },
  { value: "Playfair Display",  sample: "Aa Bb Cc" },
  { value: "Oswald",            sample: "Aa Bb Cc" },
];

/* ─── Helpers ─────────────────────────────────────────────── */
function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

/* ─── Sub-components ──────────────────────────────────────── */
function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
        <h3 className="font-semibold text-[var(--text)] text-sm">{title}</h3>
        {description && <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>}
      </div>
      <div className="p-6 flex flex-col gap-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  helper,
  children,
}: {
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-[var(--text)] block mb-1.5">{label}</label>
      {children}
      {helper && <p className="text-xs text-[var(--text-muted)] mt-1">{helper}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)] transition-colors"
    />
  );
}

function TextareaInput({
  value,
  onChange,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)] resize-none transition-colors"
    />
  );
}

/* ─── Main page ───────────────────────────────────────────── */
export default function ConteudoPage() {
  const [configs, setConfigs]   = useState<ConfigItem[]>([]);
  const [values, setValues]     = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("identidade");
  const [dirty, setDirty]       = useState(false);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  /* Load */
  useEffect(() => {
    fetch("/api/admin/site-config")
      .then((r) => r.json())
      .then((data: ConfigItem[]) => {
        setConfigs(data);
        setValues(Object.fromEntries(data.map((c) => [c.key, c.value])));
        setLoading(false);
      });
  }, []);

  const set = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const v = (key: string, fallback = "") => values[key] ?? fallback;

  /* Save */
  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const updates = Object.entries(values).map(([key, value]) => ({ key, value }));
    await fetch("/api/admin/site-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    setSaving(false);
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 3000);
  };

  /* Image upload */
  const handleImageUpload = async (key: string, file: File) => {
    setUploading(key);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res  = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) { set(key, data.url); }
      else        { alert(data.error ?? "Erro ao enviar imagem."); }
    } catch {
      alert("Erro ao enviar imagem.");
    }
    setUploading(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Top bar */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Editor de Conteúdo</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Mude textos, imagens, fontes e cores sem tocar em código.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {dirty && (
            <div className="flex items-center gap-1.5 text-xs text-amber-500">
              <AlertCircle size={13} /> Alterações não salvas
            </div>
          )}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors px-3 py-2 border border-[var(--border)] rounded-xl"
          >
            <ExternalLink size={13} /> Ver site
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: saved ? "#16a34a" : "var(--ink)",
              color: "var(--bg)",
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "not-allowed" : "pointer",
            }}
          >
            {saving ? (
              <><RefreshCw size={14} className="animate-spin" /> Salvando…</>
            ) : saved ? (
              <><Check size={14} /> Salvo!</>
            ) : (
              <><Save size={14} /> Salvar alterações</>
            )}
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 flex-wrap mb-6 p-1 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
            style={{
              background: activeTab === tab.id ? "var(--ink)" : "transparent",
              color: activeTab === tab.id ? "var(--bg)" : "var(--text-secondary)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Identidade Visual ── */}
      {activeTab === "identidade" && (
        <div className="flex flex-col gap-6">
          <SectionCard
            title="Cor de destaque"
            description="Usada em números, detalhes dourados e micro-elementos. Não afeta botões."
          >
            <Field label="Cor de destaque">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={v("design_accent_color", "#A8823A")}
                  onChange={(e) => set("design_accent_color", e.target.value)}
                  className="w-12 h-12 rounded-xl border border-[var(--border)] cursor-pointer p-1 bg-[var(--surface-2)]"
                />
                <input
                  type="text"
                  value={v("design_accent_color", "#A8823A")}
                  onChange={(e) => {
                    if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) set("design_accent_color", e.target.value);
                  }}
                  className="w-32 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-[var(--gold)]"
                />
                <div className="flex gap-2 flex-wrap">
                  {["#A8823A", "#8B5E3C", "#4B6B4B", "#1D3A5F", "#7B2D3E"].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => set("design_accent_color", preset)}
                      title={preset}
                      className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        background: preset,
                        borderColor: v("design_accent_color") === preset ? "var(--ink)" : "transparent",
                        outline: v("design_accent_color") === preset ? "2px solid var(--bg)" : "none",
                        outlineOffset: -3,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div
                className="mt-3 p-4 rounded-xl flex items-center gap-4"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  style={{ background: v("design_accent_color", "#A8823A") }}
                />
                <div>
                  <p className="text-xs font-semibold" style={{ color: v("design_accent_color", "#A8823A") }}>
                    Preview — Texto na cor de destaque
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Eyebrows, preços, tags, números de seção
                  </p>
                </div>
              </div>
            </Field>
          </SectionCard>

          <SectionCard
            title="Fonte de títulos"
            description="Aplica em H1, H2 e display. A fonte de corpo (Inter Tight) e mono (JetBrains Mono) não mudam."
          >
            <Field label="Selecione a fonte de títulos">
              <div className="grid grid-cols-2 gap-3">
                {DISPLAY_FONTS.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => set("design_display_font", font.value)}
                    className="p-4 rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor:
                        v("design_display_font", "DM Serif Display") === font.value
                          ? "var(--ink)"
                          : "var(--border)",
                      background:
                        v("design_display_font", "DM Serif Display") === font.value
                          ? "var(--surface-2)"
                          : "transparent",
                    }}
                  >
                    <p
                      className="text-2xl mb-1"
                      style={{ fontFamily: `'${font.value}', serif` }}
                    >
                      {font.sample}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{font.value}</p>
                    {v("design_display_font", "DM Serif Display") === font.value && (
                      <span className="text-xs font-semibold text-[var(--gold)]">✓ Ativa</span>
                    )}
                  </button>
                ))}
              </div>
            </Field>
          </SectionCard>

          <SectionCard
            title="Raio dos cantos"
            description="Controla o arredondamento de botões e cards."
          >
            <Field label={`Raio: ${v("design_border_radius", "4")}px`}>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={parseInt(v("design_border_radius", "4")) || 0}
                onChange={(e) => set("design_border_radius", e.target.value)}
                className="w-full accent-[var(--gold)]"
              />
              <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                <span>0px — quadrado</span>
                <span>20px — arredondado</span>
              </div>
              <div className="flex gap-3 mt-3">
                {[0, 4, 8, 14, 20].map((r) => (
                  <button
                    key={r}
                    onClick={() => set("design_border_radius", String(r))}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-10 h-10 border-2"
                      style={{
                        borderRadius: r,
                        borderColor: parseInt(v("design_border_radius", "4")) === r ? "var(--ink)" : "var(--border)",
                        background: parseInt(v("design_border_radius", "4")) === r ? "var(--surface-2)" : "transparent",
                      }}
                    />
                    <span className="text-xs text-[var(--text-muted)]">{r}px</span>
                  </button>
                ))}
              </div>
            </Field>
          </SectionCard>

          <SectionCard title="Tema padrão" description="Tema claro para lojas de vestuário (recomendado). Tema escuro tem visual mais premium/noturno.">
            <Field label="Tema">
              <div className="flex gap-3">
                {[
                  { value: "light", label: "☀️ Claro", desc: "Fundo off-white quente" },
                  { value: "dark",  label: "🌙 Escuro", desc: "Fundo preto profundo" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => set("design_theme", opt.value)}
                    className="flex-1 p-4 rounded-xl border-2 text-left transition-all"
                    style={{
                      borderColor: v("design_theme", "light") === opt.value ? "var(--ink)" : "var(--border)",
                      background: v("design_theme", "light") === opt.value ? "var(--surface-2)" : "transparent",
                    }}
                  >
                    <p className="font-semibold text-sm text-[var(--text)]">{opt.label}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </Field>
          </SectionCard>
        </div>
      )}

      {/* ── Tab: Barra de anúncios ── */}
      {activeTab === "announcement" && (
        <div className="flex flex-col gap-6">
          <SectionCard
            title="Barra de anúncios"
            description="Mensagens rotativas exibidas no topo do site. Deixe em branco para desativar."
          >
            {[1, 2, 3].map((n) => (
              <Field key={n} label={`Mensagem ${n}`}>
                <TextInput
                  value={v(`announcement_${n}`)}
                  onChange={(val) => set(`announcement_${n}`, val)}
                  placeholder={`Ex: Frete grátis acima de R$ 500`}
                />
              </Field>
            ))}
          </SectionCard>
          <div className="p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl flex gap-3 items-start text-sm text-[var(--text-muted)]">
            <span className="text-base">💡</span>
            <span>As mensagens ficam visíveis na barra preta no topo do site. Elas ficam em loop automático.</span>
          </div>
        </div>
      )}

      {/* ── Tab: Hero ── */}
      {activeTab === "hero" && (
        <div className="flex flex-col gap-6">
          <SectionCard title="Textos do Hero" description="Primeira seção da página inicial.">
            <Field label="Eyebrow (texto pequeno acima do título)" helper="Ex: '— Coleção permanente'">
              <TextInput value={v("hero_eyebrow")} onChange={(val) => set("hero_eyebrow", val)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Título — parte normal" helper="Exibido em fonte display">
                <TextInput value={v("hero_title")} onChange={(val) => set("hero_title", val)} />
              </Field>
              <Field label="Título — parte itálica/dourada" helper="Aparece em itálico com cor de destaque">
                <TextInput value={v("hero_title_italic")} onChange={(val) => set("hero_title_italic", val)} />
              </Field>
            </div>
            <Field label="Subtítulo / corpo de texto">
              <TextareaInput value={v("hero_subtitle")} onChange={(val) => set("hero_subtitle", val)} rows={3} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Botão principal">
                <TextInput value={v("hero_cta_primary")} onChange={(val) => set("hero_cta_primary", val)} placeholder="Ex: Explorar coleção" />
              </Field>
              <Field label="Botão secundário">
                <TextInput value={v("hero_cta_secondary")} onChange={(val) => set("hero_cta_secondary", val)} placeholder="Ex: Criar conta grátis" />
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Imagem do Hero" description="Imagem do produto exibida no lado direito do hero (desktop).">
            <Field label="Imagem principal">
              <ImageUploadField
                value={v("hero_image")}
                onChange={(url) => set("hero_image", url)}
                onUpload={(file) => handleImageUpload("hero_image", file)}
                uploading={uploading === "hero_image"}
              />
            </Field>
          </SectionCard>
        </div>
      )}

      {/* ── Tab: Diferenciais ── */}
      {activeTab === "features" && (
        <div className="flex flex-col gap-6">
          {[1, 2, 3, 4].map((n) => (
            <SectionCard key={n} title={`Diferencial ${n}`}>
              <Field label="Título">
                <TextInput value={v(`feature_${n}_title`)} onChange={(val) => set(`feature_${n}_title`, val)} />
              </Field>
              <Field label="Descrição">
                <TextareaInput value={v(`feature_${n}_desc`)} onChange={(val) => set(`feature_${n}_desc`, val)} rows={2} />
              </Field>
            </SectionCard>
          ))}
          <div className="p-4 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl flex gap-3 items-start text-sm text-[var(--text-muted)]">
            <span>💡</span>
            <span>Os diferenciais aparecem numerados (01–04) na seção abaixo do hero.</span>
          </div>
        </div>
      )}

      {/* ── Tab: Banner B2B ── */}
      {activeTab === "b2b" && (
        <div className="flex flex-col gap-6">
          <SectionCard title="Banner B2B" description="Seção escura no final da home direcionada para barbearias.">
            <Field label="Eyebrow" helper="Texto pequeno acima do título">
              <TextInput value={v("b2b_eyebrow")} onChange={(val) => set("b2b_eyebrow", val)} />
            </Field>
            <Field label="Título">
              <TextInput value={v("b2b_title")} onChange={(val) => set("b2b_title", val)} />
            </Field>
            <Field label="Subtítulo / descrição">
              <TextareaInput value={v("b2b_subtitle")} onChange={(val) => set("b2b_subtitle", val)} rows={3} />
            </Field>
            <Field label="Texto do botão">
              <TextInput value={v("b2b_cta")} onChange={(val) => set("b2b_cta", val)} placeholder="Ex: Quero ser B2B" />
            </Field>
          </SectionCard>
        </div>
      )}

      {/* ── Tab: Rodapé ── */}
      {activeTab === "footer" && (
        <div className="flex flex-col gap-6">
          <SectionCard title="Rodapé">
            <Field label="Tagline (frase abaixo da logo)">
              <TextInput value={v("footer_tagline")} onChange={(val) => set("footer_tagline", val)} />
            </Field>
            <Field label="Texto de copyright">
              <TextInput value={v("footer_copy")} onChange={(val) => set("footer_copy", val)} />
            </Field>
          </SectionCard>
          <SectionCard title="Links do rodapé" description="3 links exibidos na parte inferior.">
            {[1, 2, 3].map((n) => (
              <div key={n} className="grid grid-cols-2 gap-3">
                <Field label={`Link ${n} — Texto`}>
                  <TextInput value={v(`footer_link_${n}_label`)} onChange={(val) => set(`footer_link_${n}_label`, val)} placeholder="Ex: Produtos" />
                </Field>
                <Field label={`Link ${n} — URL`}>
                  <TextInput value={v(`footer_link_${n}_href`)} onChange={(val) => set(`footer_link_${n}_href`, val)} placeholder="/produtos" />
                </Field>
              </div>
            ))}
          </SectionCard>
        </div>
      )}

      {/* ── Tab: Geral & SEO ── */}
      {activeTab === "geral" && (
        <div className="flex flex-col gap-6">
          <SectionCard title="Informações gerais">
            <Field label="Nome do site">
              <TextInput value={v("site_name")} onChange={(val) => set("site_name", val)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="WhatsApp de contato (ex: 5511999999999)" helper="Com código do país, sem espaços ou traços">
                <TextInput value={v("whatsapp_contact")} onChange={(val) => set("whatsapp_contact", val)} placeholder="5511999999999" />
              </Field>
              <Field label="Instagram (URL completa)">
                <TextInput value={v("instagram_url")} onChange={(val) => set("instagram_url", val)} placeholder="https://instagram.com/triade" />
              </Field>
            </div>
          </SectionCard>
          <SectionCard title="SEO — Metatags" description="Aparece na aba do navegador e nos resultados de busca (Google).">
            <Field label="Título da aba (máx. 60 caracteres)" helper={`${v("meta_title").length}/60`}>
              <TextInput value={v("meta_title")} onChange={(val) => set("meta_title", val)} />
            </Field>
            <Field label="Descrição (máx. 160 caracteres)" helper={`${v("meta_description").length}/160`}>
              <TextareaInput value={v("meta_description")} onChange={(val) => set("meta_description", val)} rows={3} />
            </Field>
          </SectionCard>
        </div>
      )}

      {/* Bottom save bar */}
      <div className="mt-8 pt-6 border-t border-[var(--border)] flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold"
          style={{
            background: saved ? "#16a34a" : "var(--ink)",
            color: "var(--bg)",
            opacity: saving ? 0.7 : 1,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? (
            <><RefreshCw size={14} className="animate-spin" /> Salvando…</>
          ) : saved ? (
            <><Check size={14} /> Salvo com sucesso!</>
          ) : (
            <><Save size={14} /> Salvar todas as alterações</>
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── Image upload field ──────────────────────────────────── */
function ImageUploadField({
  value,
  onChange,
  onUpload,
  uploading,
}: {
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {value && (
        <div className="relative w-full max-w-sm">
          <img
            src={value}
            alt="Preview"
            className="w-full h-48 object-cover rounded-xl border border-[var(--border)]"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <button
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 bg-red-500 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-400"
          >
            ×
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Cole a URL da imagem…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)]"
        />
        <label
          className={`flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-secondary)] cursor-pointer hover:border-[var(--gold)] transition-colors whitespace-nowrap ${uploading ? "opacity-50 pointer-events-none" : ""}`}
        >
          {uploading ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : (
            <Upload size={14} />
          )}
          Upload
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
        </label>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        Cole uma URL pública ou faça upload. Formatos: JPG, PNG, WebP.
      </p>
    </div>
  );
}
