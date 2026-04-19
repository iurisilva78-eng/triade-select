"use client";

import { useEffect, useState, useRef } from "react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, X, Check, Upload, RefreshCw, ImageIcon } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  priceBase: number;
  priceWithCustom: number;
  productionDays: number;
  weightGrams: number;
  active: boolean;
  images: string[];
  availableColors: string[];
  availableSizes: string[];
  availableClosures: string[];
  category: { name: string };
}

interface Category {
  id: string;
  name: string;
}

const MOCKUP_OPTIONS = [
  { value: "capa",           label: "🧣 Capa de barbearia" },
  { value: "camiseta",       label: "👕 Camiseta — logo no peito" },
  { value: "camiseta-dupla", label: "👕 Camiseta — logo no peito + costas" },
];

const emptyForm = {
  name: "",
  description: "",
  categoryId: "",
  priceBase: "",
  priceWithCustom: "",
  productionDays: "15",
  weightGrams: "",
  heightCm: "5",
  widthCm: "20",
  lengthCm: "30",
  allowsCustomization: true,
  mockupType: "capa",
  images: [] as string[],
  availableColors: "",
  availableSizes: "",
  availableClosures: "",
};

export default function AdminProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const load = () => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts);
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const f = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      priceBase: String(product.priceBase),
      priceWithCustom: String(product.priceWithCustom),
      productionDays: String(product.productionDays),
      weightGrams: String(product.weightGrams),
      heightCm: "5",
      widthCm: "20",
      lengthCm: "30",
      allowsCustomization: true,
      mockupType: (product as any).mockupType ?? "capa",
      images: product.images ?? [],
      availableColors: (product.availableColors ?? []).join(", "),
      availableSizes: (product.availableSizes ?? []).join(", "),
      availableClosures: (product.availableClosures ?? []).join(", "),
    });
    setError("");
    setShowForm(true);
  };

  // Upload de imagem para a lista do produto
  const handleImageUpload = async (file: File) => {
    setUploadingIdx(-1); // -1 = novo upload em andamento
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setForm((prev) => ({ ...prev, images: [...prev.images, data.url] }));
      } else {
        alert(data.error ?? "Erro ao enviar imagem.");
      }
    } catch {
      alert("Erro ao enviar imagem.");
    }
    setUploadingIdx(null);
  };

  const removeImage = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const toArray = (str: string) =>
    str.split(",").map((s) => s.trim()).filter(Boolean);

  const handleSave = async () => {
    setError("");

    // Validação local antes de enviar
    if (!form.name.trim()) { setError("Informe o nome do produto."); return; }
    if (!form.description.trim()) { setError("Informe a descrição."); return; }
    if (!form.categoryId) { setError("Selecione uma categoria."); return; }
    if (!form.priceBase || isNaN(parseFloat(form.priceBase))) { setError("Informe o preço base."); return; }
    if (!form.priceWithCustom || isNaN(parseFloat(form.priceWithCustom))) { setError("Informe o preço com logo."); return; }
    if (!form.weightGrams || isNaN(parseInt(form.weightGrams))) { setError("Informe o peso."); return; }

    setSaving(true);

    const body = {
      name: form.name,
      description: form.description,
      categoryId: form.categoryId,
      priceBase: parseFloat(form.priceBase),
      priceWithCustom: parseFloat(form.priceWithCustom),
      productionDays: parseInt(form.productionDays),
      weightGrams: parseInt(form.weightGrams),
      heightCm: parseFloat(form.heightCm),
      widthCm: parseFloat(form.widthCm),
      lengthCm: parseFloat(form.lengthCm),
      allowsCustomization: form.allowsCustomization,
      mockupType: form.mockupType,
      images: form.images,
      availableColors: toArray(form.availableColors),
      availableSizes: toArray(form.availableSizes),
      availableClosures: toArray(form.availableClosures),
    };

    const res = await fetch(editing ? `/api/products/${editing.id}` : "/api/products", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao salvar.");
      return;
    }

    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Desativar este produto?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Produtos</h1>
        <Button onClick={openCreate}>
          <Plus size={16} /> Novo produto
        </Button>
      </div>

      {/* Lista */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Produto", "Categoria", "Preço base", "Com logo", "Produção", "Ação"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[var(--surface-2)] flex items-center justify-center flex-shrink-0">
                          <ImageIcon size={16} className="text-[var(--text-muted)]" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[var(--text)]">{p.name}</p>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-1">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{p.category.name}</td>
                  <td className="px-5 py-3 font-bold text-[var(--gold)]">{formatCurrency(p.priceBase)}</td>
                  <td className="px-5 py-3 font-bold text-[var(--text)]">{formatCurrency(p.priceWithCustom)}</td>
                  <td className="px-5 py-3 text-[var(--text-secondary)]">{p.productionDays}d</td>
                  <td className="px-5 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--gold)] transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--text-muted)]">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[var(--text)] text-lg">
                {editing ? "Editar produto" : "Novo produto"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-5">

              {/* ── Fotos do produto ── */}
              <div>
                <label className="text-sm font-semibold text-[var(--text)] block mb-2">
                  Fotos do produto
                </label>
                <div className="flex flex-wrap gap-2">
                  {form.images.map((url, idx) => (
                    <div key={idx} className="relative w-24 h-24 group">
                      <img
                        src={url}
                        alt=""
                        className="w-24 h-24 object-cover rounded-xl border border-[var(--border)]"
                        onError={(e) => { (e.target as HTMLImageElement).src = ""; }}
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}

                  {/* Botão de upload */}
                  <label className={`w-24 h-24 rounded-xl border-2 border-dashed border-[var(--border)] flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[var(--gold)] transition-colors ${uploadingIdx === -1 ? "opacity-50" : ""}`}>
                    {uploadingIdx === -1 ? (
                      <RefreshCw size={18} className="animate-spin text-[var(--text-muted)]" />
                    ) : (
                      <>
                        <Upload size={18} className="text-[var(--text-muted)]" />
                        <span className="text-[10px] text-[var(--text-muted)] text-center leading-tight">
                          Adicionar<br />foto
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingIdx === -1}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1.5">
                  A primeira foto será usada como capa. Em produção configure IMGBB_API_KEY no Netlify.
                </p>
              </div>

              {/* ── Tipo de mockup ── */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--text)]">Tipo de mockup (prévia personalizada)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {MOCKUP_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, mockupType: opt.value }))}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-colors ${
                        form.mockupType === opt.value
                          ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold)]/50"
                      }`}
                    >
                      <img
                        src={`/mockups/${opt.value}.jpg`}
                        alt={opt.label}
                        className="w-16 h-16 object-contain rounded-lg bg-[var(--surface-2)]"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
                      />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Informações básicas ── */}
              <Input label="Nome" value={form.name} onChange={f("name")} required />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">Descrição</label>
                <textarea
                  value={form.description}
                  onChange={f("description")}
                  rows={2}
                  className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)] resize-none"
                />
              </div>

              {categories.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Categoria</label>
                  <select value={form.categoryId} onChange={f("categoryId")} className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)]">
                    <option value="">Selecione...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input label="Preço sem logo (R$)" type="number" step="0.01" value={form.priceBase} onChange={f("priceBase")} required />
                <Input label="Preço com logo (R$)" type="number" step="0.01" value={form.priceWithCustom} onChange={f("priceWithCustom")} required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Peso (gramas)" type="number" value={form.weightGrams} onChange={f("weightGrams")} required />
                <Input label="Prazo (dias úteis)" type="number" value={form.productionDays} onChange={f("productionDays")} required />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Input label="Altura (cm)" type="number" value={form.heightCm} onChange={f("heightCm")} required />
                <Input label="Largura (cm)" type="number" value={form.widthCm} onChange={f("widthCm")} required />
                <Input label="Comprimento (cm)" type="number" value={form.lengthCm} onChange={f("lengthCm")} required />
              </div>

              {/* ── Variações ── */}
              <div className="border-t border-[var(--border)] pt-4">
                <p className="text-sm font-semibold text-[var(--text)] mb-3">Variações disponíveis</p>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Cores</label>
                    <input
                      type="text"
                      placeholder="ex: Preto, Branco, Azul marinho"
                      value={form.availableColors}
                      onChange={f("availableColors")}
                      className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Tamanhos</label>
                    <input
                      type="text"
                      placeholder="ex: P, M, G, GG"
                      value={form.availableSizes}
                      onChange={f("availableSizes")}
                      className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-[var(--text-secondary)]">Fechamentos</label>
                    <input
                      type="text"
                      placeholder="ex: Botão de pressão, Velcro, Botão comum"
                      value={form.availableClosures}
                      onChange={f("availableClosures")}
                      className="bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--gold)]"
                    />
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">Separe os valores com vírgula. Deixe em branco se não aplicável.</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSave} loading={saving}>
                  <Check size={16} /> Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
