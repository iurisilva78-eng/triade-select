"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, Upload, X, Clock, Package } from "lucide-react";

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceBase: number;
  priceWithCustom: number;
  productionDays: number;
  allowsCustomization: boolean;
  images: string[];
  weightGrams: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  availableColors: string[];
  availableSizes: string[];
  availableClosures: string[];
  category: { name: string; slug: string };
}

export default function ProdutoPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [hasCustomization, setHasCustomization] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedClosure, setSelectedClosure] = useState<string>("");

  // Mapeamento de nomes de cores em português → CSS
  const COLOR_MAP: Record<string, string> = {
    "preto": "#1a1a1a", "branco": "#f5f5f0", "branco off-white": "#f0ebe0",
    "cinza": "#8a8a8a", "cinza claro": "#c8c8c8", "cinza escuro": "#3d3d3d",
    "azul": "#1e40af", "azul marinho": "#0d1b3e", "azul royal": "#2563eb",
    "azul claro": "#60a5fa", "azul petróleo": "#164e63",
    "verde": "#15803d", "verde militar": "#4a5c2e", "verde escuro": "#14532d",
    "vermelho": "#dc2626", "bordo": "#7f1d1d", "vinho": "#881337",
    "rosa": "#ec4899", "rosa claro": "#fbcfe8", "roxo": "#7c3aed",
    "laranja": "#ea580c", "amarelo": "#eab308",
    "bege": "#d4b896", "marrom": "#92400e", "caqui": "#c3a882",
    "dourado": "#b8860b", "prata": "#b0b0b0",
  };
  const getColorCss = (name: string) => COLOR_MAP[name.toLowerCase()] ?? name;

  useEffect(() => {
    fetch(`/api/products?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setProduct(data);
          if (data.availableColors?.length) setSelectedColor(data.availableColors[0]);
          if (data.availableSizes?.length) setSelectedSize(data.availableSizes[0]);
          if (data.availableClosures?.length) setSelectedClosure(data.availableClosures[0]);
        } else {
          setProduct(null);
        }
        setLoading(false);
      })
      .catch(() => { setProduct(null); setLoading(false); });
  }, [slug]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (!allowed.includes(file.type)) {
      alert("Formato inválido. Use PNG, JPG ou PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Arquivo muito grande. Máximo 10 MB.");
      return;
    }

    setLogoFile(file);
    if (file.type !== "application/pdf") {
      const reader = new FileReader();
      reader.onload = (e) => setLogoPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    if (hasCustomization && !logoFile) {
      alert("Por favor, envie o logotipo para continuar.");
      return;
    }

    setAdding(true);
    let logoUrl = "";

    if (logoFile) {
      const formData = new FormData();
      formData.append("file", logoFile);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        logoUrl = data.url ?? "";
      } catch {
        alert("Erro ao enviar logotipo. Tente novamente.");
        setAdding(false);
        return;
      }
    }

    addItem({
      productId: product.id,
      name: product.name,
      image: product.images[0] ?? "",
      quantity,
      unitPrice: hasCustomization ? product.priceWithCustom : product.priceBase,
      hasCustomization,
      logoUrl: logoUrl || undefined,
      logoFileName: logoFile?.name,
      notes: notes || undefined,
      selectedColor: selectedColor || undefined,
      selectedSize: selectedSize || undefined,
      selectedClosure: selectedClosure || undefined,
    });

    setAdding(false);
    router.push("/carrinho");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-[var(--text-muted)]">
        <p className="text-5xl mb-4">🔍</p>
        <p>Produto não encontrado.</p>
      </div>
    );
  }

  const price = hasCustomization ? product.priceWithCustom : product.priceBase;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-10">
        {/* Imagem / Mockup */}
        <div className="aspect-square bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden relative">
          {product.images[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : hasCustomization && (logoPreview || logoFile) ? (
            /* Mockup visual da capa com logo */
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#141414] p-6 gap-2">
              <p className="text-xs text-[var(--text-muted)] mb-2">Prévia aproximada</p>
              <div className="relative w-48 h-56">
                {/* Corpo da capa */}
                <div className="absolute inset-x-0 bottom-0 top-10 rounded-b-3xl border border-[var(--border)]"
                  style={{
                    backgroundColor: selectedColor ? getColorCss(selectedColor) : "#2a2a2a",
                    opacity: 0.9,
                  }} />
                {/* Gola */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-12 bg-[#111] rounded-b-2xl border-x border-b border-[var(--border)]" />
                {/* Logo na área do peito */}
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-20 h-20 flex items-center justify-center">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain drop-shadow-lg" />
                  ) : logoFile?.name?.endsWith(".pdf") ? (
                    <div className="text-3xl">📄</div>
                  ) : null}
                </div>
              </div>
              {selectedColor && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: getColorCss(selectedColor) }} />
                  <span className="text-xs text-[var(--text-muted)]">{selectedColor}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl bg-[#141414]">🧣</div>
          )}
        </div>

        {/* Detalhes */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs text-[var(--gold)] font-medium uppercase tracking-wider mb-1">
              {product.category.name}
            </p>
            <h1 className="text-2xl font-bold text-[var(--text)]">{product.name}</h1>
            <p className="text-[var(--text-secondary)] mt-2">{product.description}</p>
          </div>

          {/* Infos */}
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Clock size={14} className="text-[var(--gold)]" />
              {product.productionDays} dias úteis
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Package size={14} className="text-[var(--gold)]" />
              {(product.weightGrams / 1000).toFixed(2)} kg
            </div>
          </div>

          {/* Seletores de variantes */}
          {product.availableColors?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[var(--text)] mb-2">Cor do tecido</p>
              <div className="flex flex-wrap gap-2.5">
                {product.availableColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                    className={`w-9 h-9 rounded-full border-2 transition-all hover:scale-110 ${
                      selectedColor === color
                        ? "border-[var(--gold)] scale-110 ring-2 ring-[var(--gold)]/30"
                        : "border-white/20 hover:border-white/50"
                    }`}
                    style={{ backgroundColor: getColorCss(color) }}
                  />
                ))}
              </div>
              {selectedColor && (
                <p className="text-xs text-[var(--text-muted)] mt-1.5">
                  Selecionado: <span className="text-[var(--text-secondary)] font-medium">{selectedColor}</span>
                </p>
              )}
            </div>
          )}

          {product.availableSizes?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[var(--text)] mb-2">Tamanho</p>
              <div className="flex flex-wrap gap-2">
                {product.availableSizes.map((size) => (
                  <button key={size} onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      selectedSize === size
                        ? "bg-[var(--gold)] text-black border-[var(--gold)]"
                        : "bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--gold)]/50"
                    }`}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.availableClosures?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[var(--text)] mb-2">Fechamento</p>
              <div className="flex flex-wrap gap-2">
                {product.availableClosures.map((closure) => (
                  <button key={closure} onClick={() => setSelectedClosure(closure)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                      selectedClosure === closure
                        ? "bg-[var(--gold)] text-black border-[var(--gold)]"
                        : "bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--gold)]/50"
                    }`}>
                    {closure}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Personalização */}
          {product.allowsCustomization && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
              <p className="text-sm font-semibold text-[var(--text)] mb-3">Personalização</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setHasCustomization(false); setLogoFile(null); setLogoPreview(null); }}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors ${
                    !hasCustomization
                      ? "bg-[var(--gold)] text-black border-[var(--gold)]"
                      : "bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--gold)]/50"
                  }`}
                >
                  Sem logo
                  <br />
                  <span className="font-bold">{formatCurrency(product.priceBase)}</span>
                </button>
                <button
                  onClick={() => setHasCustomization(true)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-colors ${
                    hasCustomization
                      ? "bg-[var(--gold)] text-black border-[var(--gold)]"
                      : "bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--gold)]/50"
                  }`}
                >
                  Com logo
                  <br />
                  <span className="font-bold">{formatCurrency(product.priceWithCustom)}</span>
                </button>
              </div>
            </div>
          )}

          {/* Upload de logo */}
          {hasCustomization && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
              <p className="text-sm font-semibold text-[var(--text)] mb-3">
                Envie seu logotipo <span className="text-red-400">*</span>
              </p>

              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Preview do logo"
                    className="w-full max-h-40 object-contain rounded-xl border border-[var(--border)] bg-[var(--surface-2)]"
                  />
                  <button
                    onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : logoFile?.name?.endsWith(".pdf") ? (
                <div className="flex items-center gap-3 p-3 bg-[var(--surface-2)] rounded-xl border border-[var(--border)]">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text)] truncate">{logoFile.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">PDF enviado</p>
                  </div>
                  <button onClick={() => { setLogoFile(null); }} className="text-red-400 hover:text-red-300">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--border)] rounded-xl p-6 cursor-pointer hover:border-[var(--gold)]/50 transition-colors">
                  <Upload size={24} className="text-[var(--gold)] mb-2" />
                  <p className="text-sm text-[var(--text-secondary)] text-center">
                    Clique para enviar seu logo
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">PNG, JPG, PDF — máx. 10 MB</p>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1.5">
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: cor preferida, tamanho específico..."
              rows={2}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)] resize-none placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Quantidade + Preço */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-lg font-bold hover:border-[var(--gold)] transition-colors flex items-center justify-center"
              >
                −
              </button>
              <span className="w-10 text-center font-semibold text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-lg font-bold hover:border-[var(--gold)] transition-colors flex items-center justify-center"
              >
                +
              </button>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--text-muted)]">Total</p>
              <p className="text-2xl font-bold text-[var(--gold)]">
                {formatCurrency(price * quantity)}
              </p>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleAddToCart}
            loading={adding}
          >
            <ShoppingCart size={18} />
            Adicionar ao carrinho
          </Button>
        </div>
      </div>
    </div>
  );
}
