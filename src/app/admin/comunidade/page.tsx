"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, Pencil, X, Check, Upload, GripVertical, Instagram, Eye, EyeOff } from "lucide-react";

interface BarberSpotlight {
  id: string;
  name: string;
  city: string;
  instagramHandle?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  active: boolean;
  displayOrder: number;
}

const emptyForm = {
  name: "",
  city: "",
  instagramHandle: "",
  imageUrl: "",
  videoUrl: "",
  active: true,
  displayOrder: 0,
};

export default function ComunidadePage() {
  const [items, setItems] = useState<BarberSpotlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/barbers");
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setEditId(null);
    setForm({ ...emptyForm, displayOrder: items.length });
    setError("");
    setShowForm(true);
  }

  function openEdit(item: BarberSpotlight) {
    setEditId(item.id);
    setForm({
      name: item.name,
      city: item.city,
      instagramHandle: item.instagramHandle ?? "",
      imageUrl: item.imageUrl ?? "",
      videoUrl: item.videoUrl ?? "",
      active: item.active,
      displayOrder: item.displayOrder,
    });
    setError("");
    setShowForm(true);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) {
        setForm((f) => ({ ...f, imageUrl: data.url }));
      } else {
        setError(data.error ?? "Erro no upload.");
      }
    } catch {
      setError("Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.city.trim()) {
      setError("Nome e cidade são obrigatórios.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        city: form.city.trim(),
        instagramHandle: form.instagramHandle.trim() || undefined,
        imageUrl: form.imageUrl.trim() || undefined,
        videoUrl: form.videoUrl.trim() || undefined,
        active: form.active,
        displayOrder: Number(form.displayOrder) || 0,
      };

      const res = editId
        ? await fetch(`/api/admin/barbers/${editId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/admin/barbers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erro ao salvar.");
        return;
      }
      setShowForm(false);
      load();
    } catch {
      setError("Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este barbeiro/cliente do destaque?")) return;
    await fetch(`/api/admin/barbers/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleActive(item: BarberSpotlight) {
    await fetch(`/api/admin/barbers/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !item.active }),
    });
    load();
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Comunidade</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Barbeiros e clientes em destaque na seção "Barbeiros que vestem Triade"
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: "var(--gold)", color: "#fff" }}
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center text-[var(--text-muted)] py-16 text-sm">Carregando…</div>
      ) : items.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl border border-dashed"
          style={{ borderColor: "var(--border)" }}
        >
          <p className="text-[var(--text-muted)] text-sm mb-3">Nenhum destaque cadastrado ainda.</p>
          <button
            onClick={openAdd}
            className="text-sm font-medium px-4 py-2 rounded-lg"
            style={{ background: "var(--gold)", color: "#fff" }}
          >
            Adicionar primeiro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl overflow-hidden border"
              style={{
                borderColor: "var(--border)",
                background: "var(--surface)",
                opacity: item.active ? 1 : 0.55,
              }}
            >
              {/* Photo area */}
              <div
                style={{
                  aspectRatio: "3/4",
                  position: "relative",
                  background: "var(--surface-2)",
                  overflow: "hidden",
                }}
              >
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexDirection: "column", gap: 4,
                    }}
                  >
                    <div
                      style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: "rgba(168,130,58,0.15)",
                        border: "1px solid var(--gold)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontFamily: "var(--font-display)", fontSize: 18,
                        color: "var(--gold)",
                      }}
                    >
                      {item.name.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                    </div>
                    <span style={{ fontSize: 10, color: "var(--text-muted)" }}>sem foto</span>
                  </div>
                )}
                {item.videoUrl && (
                  <div
                    style={{
                      position: "absolute", top: 8, right: 8,
                      background: "rgba(0,0,0,.6)", borderRadius: 4,
                      padding: "2px 5px", fontSize: 9, color: "#fff",
                      letterSpacing: "0.08em",
                    }}
                  >
                    ▶ vídeo
                  </div>
                )}
              </div>

              {/* Info + actions */}
              <div className="p-3">
                <div className="font-semibold text-[var(--text)] text-sm truncate">{item.name}</div>
                <div className="text-xs text-[var(--text-muted)] truncate mt-0.5">{item.city}</div>
                {item.instagramHandle && (
                  <div className="flex items-center gap-1 mt-1 text-[var(--gold)] text-xs">
                    <Instagram size={10} />
                    <span className="truncate">@{item.instagramHandle.replace(/^@/, "")}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => openEdit(item)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium"
                    style={{ background: "var(--surface-2)", color: "var(--text)" }}
                  >
                    <Pencil size={11} /> Editar
                  </button>
                  <button
                    onClick={() => toggleActive(item)}
                    className="p-1.5 rounded-lg"
                    style={{ background: "var(--surface-2)", color: item.active ? "var(--gold)" : "var(--text-muted)" }}
                    title={item.active ? "Ocultar" : "Exibir"}
                  >
                    {item.active ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg"
                    style={{ background: "var(--surface-2)", color: "#E53935" }}
                    title="Remover"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-in form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,.5)" }}
            onClick={() => setShowForm(false)}
          />
          <div
            className="relative w-full max-w-lg rounded-t-3xl md:rounded-2xl overflow-auto"
            style={{ background: "var(--surface)", maxHeight: "90vh", zIndex: 10 }}
          >
            {/* Form header */}
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-bold text-[var(--text)]">{editId ? "Editar destaque" : "Novo destaque"}</h2>
              <button onClick={() => setShowForm(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5 overflow-y-auto" style={{ maxHeight: "calc(90vh - 64px)" }}>
              {/* Photo upload */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Foto</label>
                <div className="flex gap-3 items-start">
                  {/* Preview */}
                  <div
                    style={{
                      width: 80, height: 80, borderRadius: 12,
                      background: "var(--surface-2)",
                      border: "1px dashed var(--border)",
                      overflow: "hidden", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {form.imageUrl ? (
                      <img src={form.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <Upload size={20} style={{ color: "var(--text-muted)" }} />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <input type="hidden" ref={fileRef as any} />
                    <input
                      type="file"
                      accept="image/*"
                      id="barber-photo"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(f);
                      }}
                    />
                    <label
                      htmlFor="barber-photo"
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
                      style={{
                        background: uploading ? "var(--surface-2)" : "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--text)",
                      }}
                    >
                      <Upload size={14} />
                      {uploading ? "Enviando…" : "Escolher foto"}
                    </label>
                    <input
                      type="text"
                      placeholder="ou cole a URL da imagem"
                      value={form.imageUrl}
                      onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                      className="w-full text-xs px-3 py-2 rounded-lg border outline-none"
                      style={{
                        background: "var(--surface-2)", borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Fields */}
              {[
                { label: "Nome *", key: "name", placeholder: "Ex: João Barbeiro" },
                { label: "Cidade *", key: "city", placeholder: "Ex: São Paulo, SP" },
                { label: "Instagram (sem @)", key: "instagramHandle", placeholder: "joaobarbeiro" },
                { label: "URL do vídeo", key: "videoUrl", placeholder: "https://www.instagram.com/reel/..." },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-[var(--text)] mb-1.5">{label}</label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={(form as any)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                    style={{
                      background: "var(--surface-2)", borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                  />
                </div>
              ))}

              {/* Order + Active */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[var(--text)] mb-1.5">Ordem</label>
                  <input
                    type="number"
                    min={0}
                    value={form.displayOrder}
                    onChange={(e) => setForm((f) => ({ ...f, displayOrder: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
                    style={{
                      background: "var(--surface-2)", borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                  />
                </div>
                <div className="flex flex-col justify-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                      style={{
                        width: 40, height: 22, borderRadius: 11,
                        background: form.active ? "var(--gold)" : "var(--border)",
                        transition: "background .2s", position: "relative", flexShrink: 0,
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute", top: 3,
                          left: form.active ? 21 : 3,
                          width: 16, height: 16, borderRadius: "50%",
                          background: "#fff",
                          transition: "left .2s",
                          boxShadow: "0 1px 3px rgba(0,0,0,.2)",
                        }}
                      />
                    </div>
                    <span className="text-sm text-[var(--text)]">Visível no site</span>
                  </label>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "#FEF2F2", color: "#991B1B" }}>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium"
                  style={{ background: "var(--surface-2)", color: "var(--text)" }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ background: "var(--gold)", color: "#fff", opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? "Salvando…" : (<><Check size={15} /> Salvar</>)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
