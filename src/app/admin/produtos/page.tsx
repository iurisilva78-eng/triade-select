"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, X, Check } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  priceBase: number;
  priceWithCustom: number;
  productionDays: number;
  weightGrams: number;
  active: boolean;
  category: { name: string };
}

interface Category {
  id: string;
  name: string;
}

const emptyForm = {
  name: "",
  description: "",
  categoryId: "",
  priceBase: "",
  priceWithCustom: "",
  productionDays: "15",
  weightGrams: "",
  heightCm: "",
  widthCm: "",
  lengthCm: "",
  allowsCustomization: true,
};

export default function AdminProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    });
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    setError("");
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
                    <p className="font-medium text-[var(--text)]">{p.name}</p>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-1">{p.description}</p>
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
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-[var(--text)] text-lg">
                {editing ? "Editar produto" : "Novo produto"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
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
