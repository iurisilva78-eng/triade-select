"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import { Upload, X, CheckCircle, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { MockupPreview } from "@/components/produto/MockupPreview";
import { MockupTypeConfig } from "@/lib/mockup-config";
import { SizeGuide } from "@/components/produto/SizeGuide";

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceBase: number;
  priceWithCustom: number;
  productionDays: number;
  allowsCustomization: boolean;
  mockupType: string;
  images: string[];
  weightGrams: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
  availableColors: string[];
  availableSizes: string[];
  availableClosures: string[];
  colorImages: Record<string, string>;
  category: { name: string; slug: string };
}

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

/* ─── Chip selector ────────────────────────────────── */
function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 20px",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        letterSpacing: "0.1em",
        border: `1px solid ${active ? "var(--ink)" : "var(--line-soft)"}`,
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--bg)" : "var(--ink)",
        cursor: "pointer",
        borderRadius: "var(--r-sm)",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      {label}
    </button>
  );
}

export default function ProdutoPage() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();
  const addItem  = useCartStore((s) => s.addItem);

  const [product, setProduct]               = useState<Product | null>(null);
  const [loading, setLoading]               = useState(true);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [quantity, setQuantity]             = useState(1);
  const [hasCustomization, setHasCustomization] = useState(false);
  const [logoFile, setLogoFile]             = useState<File | null>(null);
  const [logoPreview, setLogoPreview]       = useState<string | null>(null);
  const [notes, setNotes]                   = useState("");
  const [adding, setAdding]                 = useState(false);
  const [selectedColor, setSelectedColor]   = useState("");
  const [selectedSize, setSelectedSize]     = useState("");
  const [selectedClosure, setSelectedClosure] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [mockupConfig, setMockupConfig]     = useState<Record<string, MockupTypeConfig> | undefined>(undefined);

  useEffect(() => {
    fetch("/api/admin/mockup-config")
      .then((r) => r.json())
      .then((data) => { if (data) setMockupConfig(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/products?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setProduct(data);
          if (data.availableColors?.length) setSelectedColor(data.availableColors[0]);
          if (data.availableSizes?.length)  setSelectedSize(data.availableSizes[0]);
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
    if (!allowed.includes(file.type)) { alert("Formato inválido. Use PNG, JPG ou PDF."); return; }
    if (file.size > 10 * 1024 * 1024) { alert("Arquivo muito grande. Máximo 10 MB."); return; }
    setLogoFile(file);
    if (file.type !== "application/pdf") {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const handleAddToCartClick = () => {
    if (!product) return;
    if (hasCustomization && !logoFile) { alert("Por favor, envie o logotipo para continuar."); return; }
    if (hasCustomization && logoFile)  { setShowConfirmModal(true); return; }
    confirmAddToCart();
  };

  const confirmAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    let logoUrl = "";
    if (logoFile) {
      const formData = new FormData();
      formData.append("file", logoFile);
      try {
        const res  = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        logoUrl = data.url ?? "";
      } catch {
        alert("Erro ao enviar logotipo. Tente novamente.");
        setAdding(false);
        return;
      }
    }
    const colorKey  = selectedColor?.toLowerCase();
    const cartImage = (colorKey && product.colorImages?.[colorKey])
      ? product.colorImages[colorKey]
      : (colorKey && product.colorImages?.[selectedColor])
      ? product.colorImages[selectedColor]
      : product.images[currentImageIdx] ?? product.images[0] ?? "";

    addItem({
      productId: product.id, name: product.name, image: cartImage, quantity,
      unitPrice: hasCustomization ? product.priceWithCustom : product.priceBase,
      hasCustomization, logoUrl: logoUrl || undefined,
      logoFileName: logoFile?.name, notes: notes || undefined,
      selectedColor: selectedColor || undefined,
      selectedSize: selectedSize || undefined,
      selectedClosure: selectedClosure || undefined,
    });
    setAdding(false);
    setShowConfirmModal(false);
    router.push("/carrinho");
  };

  /* ── Loading / not found ── */
  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, background: "var(--bg)" }}>
        <div style={{ width: 32, height: 32, border: "2px solid var(--line-soft)", borderTop: "2px solid var(--gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ textAlign: "center", padding: "80px 32px", background: "var(--bg)", color: "var(--ink)" }}>
        <p className="t-eyebrow mb-4">— Produto não encontrado</p>
        <p style={{ fontSize: 14, color: "var(--muted)" }}>Verifique o endereço ou volte para a loja.</p>
      </div>
    );
  }

  const price = hasCustomization ? product.priceWithCustom : product.priceBase;

  return (
    <div style={{ background: "var(--bg)", color: "var(--ink)" }}>
      {/* Breadcrumb */}
      <div style={{ padding: "20px 32px 0" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", gap: 8 }} className="t-mono" >
          {["Loja", product.category.name, product.name].map((c, i, arr) => (
            <span key={i} style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" }}>
              {i > 0 && <span style={{ margin: "0 8px", color: "var(--muted)" }}>/</span>}
              <span style={{ color: i === arr.length - 1 ? "var(--ink)" : "var(--muted)" }}>{c}</span>
            </span>
          ))}
        </div>
      </div>

      <section style={{ padding: "24px 32px 80px" }}>
        <div
          style={{ maxWidth: 1440, margin: "0 auto", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 80 }}
          className="max-md:grid-cols-1 max-md:gap-10"
        >
          {/* ── Gallery ── */}
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 16 }} className="max-sm:grid-cols-1">
            {/* Thumbnails column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }} className="max-sm:hidden">
              {product.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImageIdx(i)}
                  className="mockup-bg"
                  style={{
                    aspectRatio: "1",
                    overflow: "hidden",
                    border: i === currentImageIdx ? "1px solid var(--ink)" : "1px solid var(--line-soft)",
                    padding: 0,
                    cursor: "pointer",
                    background: "var(--bg-2)",
                  }}
                >
                  <img
                    src={src}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "multiply" }}
                  />
                </button>
              ))}
            </div>

            {/* Main image */}
            <div
              className="mockup-bg"
              style={{ aspectRatio: "4/5", overflow: "hidden", position: "relative" }}
            >
              {hasCustomization && (logoPreview || logoFile) ? (
                <MockupPreview
                  mockupType={product.mockupType ?? "capa"}
                  logoPreview={logoPreview}
                  logoFileName={logoFile?.name}
                  selectedColor={selectedColor}
                  configOverride={mockupConfig}
                  colorImages={product.colorImages}
                />
              ) : product.images.length > 0 ? (
                <>
                  <img
                    src={product.images[currentImageIdx] ?? product.images[0]}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "multiply" }}
                  />
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIdx((i) => (i - 1 + product.images.length) % product.images.length)}
                        style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, background: "rgba(0,0,0,0.45)", border: 0, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => setCurrentImageIdx((i) => (i + 1) % product.images.length)}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, background: "rgba(0,0,0,0.45)", border: 0, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ opacity: 0.15, fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>sem imagem</div>
                </div>
              )}

              {/* Category overlay */}
              <div className="t-mono" style={{ position: "absolute", top: 20, left: 20, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)" }}>
                {product.category.name}
              </div>

              {/* Live preview badge */}
              {hasCustomization && logoFile && (
                <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 6, background: "var(--gold)", color: "#000", fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 12px", borderRadius: 2 }}>
                  <Eye size={10} /> Prévia ao vivo
                </div>
              )}
            </div>

            {/* Mobile dots */}
            {product.images.length > 1 && (
              <div className="flex gap-1.5 justify-center sm:hidden" style={{ marginTop: 8 }}>
                {product.images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIdx(idx)}
                    style={{
                      width: idx === currentImageIdx ? 16 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: idx === currentImageIdx ? "var(--gold)" : "var(--line-soft)",
                      border: 0,
                      cursor: "pointer",
                      padding: 0,
                      transition: "width 0.2s, background 0.2s",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Product info ── */}
          <div>
            <p className="t-eyebrow mb-4">— {product.category.name}</p>
            <h1
              className="t-display"
              style={{ fontSize: "clamp(40px,5vw,64px)", margin: 0, lineHeight: 0.95 }}
            >
              {product.name.includes(" ") ? (
                <>
                  {product.name.split(" ").slice(0, -1).join(" ")}{" "}
                  <span className="t-display-italic" style={{ color: "var(--gold)" }}>
                    {product.name.split(" ").slice(-1)}
                  </span>
                </>
              ) : (
                <span className="t-display-italic" style={{ color: "var(--gold)" }}>
                  {product.name}
                </span>
              )}
            </h1>

            <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ink-soft)", marginTop: 20, maxWidth: 520 }}>
              {product.description}
            </p>

            <div className="t-display" style={{ fontSize: 36, marginTop: 28 }}>
              {formatCurrency(price)}
              {hasCustomization && (
                <span className="t-mono" style={{ fontSize: 11, color: "var(--gold)", marginLeft: 14, letterSpacing: "0.14em" }}>
                  (personalização incluída)
                </span>
              )}
            </div>
            <p className="t-eyebrow mt-1.5">
              Ou 3× {formatCurrency(price / 3)} sem juros
            </p>

            <hr style={{ border: 0, borderTop: "1px solid var(--line-hair)", margin: "32px 0" }} />

            {/* Colors */}
            {product.availableColors?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p className="t-eyebrow mb-3">
                  Cor ·{" "}
                  <span style={{ color: "var(--ink)" }}>{selectedColor}</span>
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {product.availableColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      title={color}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: getColorCss(color),
                        cursor: "pointer",
                        border: selectedColor === color ? "2px solid var(--ink)" : "1px solid var(--line-soft)",
                        outline: selectedColor === color ? "2px solid var(--bg)" : "none",
                        outlineOffset: -4,
                        transition: "border 0.15s",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.availableSizes?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <p className="t-eyebrow">
                    Tamanho ·{" "}
                    <span style={{ color: "var(--ink)" }}>{selectedSize}</span>
                  </p>
                  <SizeGuide />
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {product.availableSizes.map((size) => (
                    <Chip
                      key={size}
                      label={size}
                      active={selectedSize === size}
                      onClick={() => setSelectedSize(size)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Closures */}
            {product.availableClosures?.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <p className="t-eyebrow mb-3">
                  Fechamento ·{" "}
                  <span style={{ color: "var(--ink)" }}>{selectedClosure}</span>
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {product.availableClosures.map((c) => (
                    <Chip
                      key={c}
                      label={c}
                      active={selectedClosure === c}
                      onClick={() => setSelectedClosure(c)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Customization toggle */}
            {product.allowsCustomization && (
              <label
                style={{
                  display: "flex",
                  gap: 14,
                  padding: 20,
                  border: `1px solid ${hasCustomization ? "var(--ink)" : "var(--line-soft)"}`,
                  cursor: "pointer",
                  marginBottom: 24,
                  alignItems: "flex-start",
                }}
              >
                {/* Custom checkbox */}
                <div
                  onClick={() => { setHasCustomization(!hasCustomization); if (hasCustomization) { setLogoFile(null); setLogoPreview(null); } }}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 2,
                    border: "1px solid var(--ink)",
                    background: hasCustomization ? "var(--ink)" : "transparent",
                    flexShrink: 0,
                    marginTop: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {hasCustomization && (
                    <div style={{ width: 8, height: 8, background: "var(--bg)" }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="t-display" style={{ fontSize: 17, marginBottom: 4 }}>
                    Personalizar com minha logo{" "}
                    <span className="t-mono" style={{ fontSize: 10, color: "var(--gold)", marginLeft: 8, letterSpacing: "0.14em" }}>
                      +{formatCurrency(product.priceWithCustom - product.priceBase)}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: 0, lineHeight: 1.5 }}>
                    Bordado ou serigrafia, posição no peito. Enviaremos um mockup para aprovação antes da produção.
                  </p>
                </div>
              </label>
            )}

            {/* Logo upload */}
            {hasCustomization && (
              <div style={{ marginBottom: 24 }}>
                <p className="t-eyebrow mb-3">
                  Seu logotipo <span style={{ color: "#c0392b" }}>*</span>
                </p>
                {logoPreview ? (
                  <div style={{ position: "relative" }}>
                    <img
                      src={logoPreview}
                      alt="Preview"
                      style={{ width: "100%", maxHeight: 160, objectFit: "contain", border: "1px solid var(--line-soft)", background: "var(--bg-2)" }}
                    />
                    <button
                      onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                      style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, background: "#c0392b", border: 0, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <X size={14} />
                    </button>
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#27ae60" }}>
                      <CheckCircle size={12} /> Logo carregada — veja a prévia na imagem
                    </div>
                  </div>
                ) : logoFile?.name?.endsWith(".pdf") ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, border: "1px solid var(--line-soft)", background: "var(--bg-2)" }}>
                    <span style={{ fontSize: 22 }}>📄</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{logoFile.name}</p>
                      <p className="t-eyebrow mt-0.5">PDF enviado</p>
                    </div>
                    <button onClick={() => setLogoFile(null)} style={{ background: "none", border: 0, cursor: "pointer", color: "#c0392b" }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px dashed var(--line-soft)",
                      padding: 32,
                      cursor: "pointer",
                      gap: 8,
                    }}
                  >
                    <Upload size={24} style={{ color: "var(--gold)" }} />
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, textAlign: "center" }}>
                      Clique para enviar seu logo
                    </p>
                    <p className="t-eyebrow" style={{ margin: 0 }}>PNG, JPG, PDF — máx. 10 MB</p>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={handleLogoChange}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
              </div>
            )}

            {/* Observações */}
            <div style={{ marginBottom: 28 }}>
              <p className="t-eyebrow mb-2">Observações (opcional)</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: cor preferida, posição da logo…"
                rows={2}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  border: "1px solid var(--line-soft)",
                  background: "transparent",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  outline: "none",
                  color: "var(--ink)",
                  resize: "none",
                  borderRadius: "var(--r-sm)",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Qty + CTA */}
            <div style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
              <div style={{ display: "flex", border: "1px solid var(--ink)", alignItems: "center" }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ width: 44, height: "100%", background: "transparent", border: 0, cursor: "pointer", fontSize: 18, color: "var(--ink)" }}
                >
                  −
                </button>
                <div className="t-mono" style={{ width: 44, textAlign: "center", fontSize: 15 }}>
                  {quantity.toString().padStart(2, "0")}
                </div>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{ width: 44, height: "100%", background: "transparent", border: 0, cursor: "pointer", fontSize: 18, color: "var(--ink)" }}
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCartClick}
                style={{
                  flex: 1,
                  padding: "16px 24px",
                  background: "var(--ink)",
                  color: "var(--bg)",
                  border: "1px solid var(--ink)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  borderRadius: "var(--r-sm)",
                  transition: "background 0.2s",
                }}
              >
                {hasCustomization && logoFile
                  ? `Ver prévia · ${formatCurrency(price * quantity)}`
                  : `Adicionar à sacola · ${formatCurrency(price * quantity)}`}
              </button>
            </div>

            {/* Info grid */}
            <div
              style={{
                marginTop: 28,
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 16,
                paddingTop: 24,
                borderTop: "1px solid var(--line-soft)",
              }}
            >
              {[
                { t: "Prazo", v: `${product.productionDays} dias úteis` },
                { t: "Entrega", v: "Brasil inteiro" },
                { t: "Pagamento", v: "50% + 50%" },
              ].map(({ t, v }) => (
                <div key={t}>
                  <p className="t-eyebrow mb-1">{t}</p>
                  <p style={{ fontSize: 13, margin: 0 }}>{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Confirm mockup modal ── */}
      {showConfirmModal && product && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--line-soft)",
              width: "100%",
              maxWidth: 640,
              maxHeight: "95vh",
              overflowY: "auto",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid var(--line-soft)",
              }}
            >
              <div>
                <h2 className="t-display" style={{ fontSize: 22, margin: 0 }}>Prévia do produto personalizado</h2>
                <p className="t-eyebrow mt-1">Confira antes de adicionar à sacola</p>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{ background: "none", border: 0, cursor: "pointer", color: "var(--muted)", padding: 8 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Mockup */}
            <div style={{ padding: 20 }}>
              <div
                style={{ width: "100%", aspectRatio: "1", maxWidth: 320, margin: "0 auto", background: "var(--bg-2)", overflow: "hidden", position: "relative" }}
              >
                <MockupPreview
                  mockupType={product.mockupType ?? "capa"}
                  logoPreview={logoPreview}
                  logoFileName={logoFile?.name}
                  selectedColor={selectedColor}
                  configOverride={mockupConfig}
                  colorImages={product.colorImages}
                />
              </div>
            </div>

            {/* Summary */}
            <div style={{ padding: "0 24px 12px" }}>
              <div style={{ border: "1px solid var(--line-soft)", padding: 20 }}>
                <p className="t-eyebrow mb-3">Resumo do pedido</p>
                {[
                  ["Produto", product.name],
                  selectedColor  && ["Cor",          selectedColor],
                  selectedSize   && ["Tamanho",       selectedSize],
                  selectedClosure && ["Fechamento",   selectedClosure],
                  ["Logo",       logoFile?.name ?? "—"],
                  ["Quantidade", `${quantity}×`],
                ].filter(Boolean).map(([k, v]) => (
                  <div
                    key={k as string}
                    style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", color: "var(--muted)" }}
                  >
                    <span>{k as string}</span>
                    <span style={{ color: "var(--ink)", fontWeight: 500 }}>{v as string}</span>
                  </div>
                ))}
                <hr style={{ border: 0, borderTop: "1px solid var(--line-hair)", margin: "10px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p className="t-eyebrow">Total</p>
                  <div className="t-display" style={{ fontSize: 24 }}>{formatCurrency(price * quantity)}</div>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 10, lineHeight: 1.5, textAlign: "center" }}>
                A prévia é aproximada. O posicionamento final pode ter pequenas variações na produção.
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, padding: 24, paddingTop: 12 }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  flex: 1, padding: "14px 20px",
                  background: "transparent", color: "var(--muted)",
                  border: "1px solid var(--line-soft)",
                  fontFamily: "var(--font-mono)", fontSize: 10,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  cursor: "pointer", borderRadius: "var(--r-sm)",
                }}
              >
                ← Voltar e ajustar
              </button>
              <button
                onClick={confirmAddToCart}
                disabled={adding}
                style={{
                  flex: 1, padding: "14px 20px",
                  background: adding ? "var(--muted)" : "var(--ink)",
                  color: "var(--bg)",
                  border: "1px solid var(--ink)",
                  fontFamily: "var(--font-mono)", fontSize: 10,
                  letterSpacing: "0.12em", textTransform: "uppercase",
                  cursor: adding ? "not-allowed" : "pointer",
                  borderRadius: "var(--r-sm)",
                }}
              >
                {adding ? "Adicionando…" : "Confirmar e adicionar →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
