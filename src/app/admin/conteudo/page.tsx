"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Save, Upload, ImageIcon, RefreshCw, Check, ExternalLink } from "lucide-react";

interface ConfigItem {
  key: string;
  label: string;
  type: string; // text | textarea | image
  section: string;
  value: string;
}

const SECTION_LABELS: Record<string, string> = {
  hero: "🏠 Página inicial — Hero",
  features: "✨ Diferenciais",
  geral: "⚙️ Configurações gerais",
};

export default function ConteudoPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch("/api/admin/site-config")
      .then((r) => r.json())
      .then((data: ConfigItem[]) => {
        setConfigs(data);
        setValues(Object.fromEntries(data.map((c) => [c.key, c.value])));
        setLoading(false);
      });
  }, []);

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
    setTimeout(() => setSaved(false), 3000);
  };

  const handleImageUpload = async (key: string, file: File) => {
    setUploading(key);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setValues((prev) => ({ ...prev, [key]: data.url }));
      } else {
        alert(data.error ?? "Erro ao enviar imagem.");
      }
    } catch {
      alert("Erro ao enviar imagem.");
    }
    setUploading(null);
  };

  const sections = [...new Set(configs.map((c) => c.section))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Editor de Conteúdo</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Edite textos e imagens do site sem precisar de código.</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors">
            <ExternalLink size={14} /> Ver site
          </a>
          <Button onClick={handleSave} loading={saving} className="flex items-center gap-2">
            {saved ? <><Check size={16} /> Salvo!</> : <><Save size={16} /> Salvar alterações</>}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {sections.map((section) => {
          const items = configs.filter((c) => c.section === section);
          return (
            <div key={section} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-2)]">
                <h2 className="font-bold text-[var(--text)]">{SECTION_LABELS[section] ?? section}</h2>
              </div>

              <div className="p-5 flex flex-col gap-5">
                {items.map((item) => (
                  <div key={item.key}>
                    <label className="text-sm font-semibold text-[var(--text)] block mb-1.5">
                      {item.label}
                    </label>

                    {item.type === "textarea" ? (
                      <textarea
                        value={values[item.key] ?? ""}
                        onChange={(e) => setValues((p) => ({ ...p, [item.key]: e.target.value }))}
                        rows={3}
                        className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)] resize-none"
                      />
                    ) : item.type === "image" ? (
                      <div className="flex flex-col gap-2">
                        {values[item.key] && (
                          <div className="relative w-full max-w-xs">
                            <img
                              src={values[item.key]}
                              alt="Preview"
                              className="w-full h-40 object-cover rounded-xl border border-[var(--border)]"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Cole a URL da imagem aqui..."
                            value={values[item.key] ?? ""}
                            onChange={(e) => setValues((p) => ({ ...p, [item.key]: e.target.value }))}
                            className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)]"
                          />
                          <label className={`flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-secondary)] cursor-pointer hover:border-[var(--gold)] transition-colors ${uploading === item.key ? "opacity-50" : ""}`}>
                            {uploading === item.key ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Upload size={14} />
                            )}
                            Upload
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={!!uploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(item.key, file);
                              }}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-[var(--text-muted)]">
                          Cole uma URL ou faça upload. Para upload funcionar em produção, configure IMGBB_API_KEY no Netlify.
                        </p>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={values[item.key] ?? ""}
                        onChange={(e) => setValues((p) => ({ ...p, [item.key]: e.target.value }))}
                        className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)]"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} loading={saving} size="lg" className="flex items-center gap-2">
          {saved ? <><Check size={16} /> Salvo com sucesso!</> : <><Save size={16} /> Salvar todas as alterações</>}
        </Button>
      </div>
    </div>
  );
}
