"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { formatCurrency } from "@/lib/utils";
import { Upload, X, CheckCircle, Eye, ChevronLeft, ChevronRight, Maximize2, ChevronDown } from "lucide-react";
import { MockupPreview } from "@/components/produto/MockupPreview";
import { MockupTypeConfig } from "@/lib/mockup-config";
import { removeImageBackground } from "@/lib/remove-bg";
import { SizeGuide } from "@/components/produto/SizeGuide";

interface Product {
  id: string; slug: string; name: string; description: string;
  priceBase: number; priceWithCustom: number; productionDays: number;
  allowsCustomization: boolean; mockupType: string; images: string[];
  weightGrams: number; heightCm: number; widthCm: number; lengthCm: number;
  availableColors: string[]; availableSizes: string[]; availableClosures: string[];
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

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 18px", fontFamily: "var(--font-mono)", fontSize: 11,
      letterSpacing: "0.1em", border: `1px solid ${active ? "var(--ink)" : "var(--line-soft)"}`,
      background: active ? "var(--ink)" : "transparent", color: active ? "var(--bg)" : "var(--ink)",
      cursor: "pointer", borderRadius: "var(--r-sm)", whiteSpace: "nowrap",
    }}>
      {label}
    </button>
  );
}

export function ProductClient({
  product,
  mockupConfig: initialMockupConfig,
}: {
  product: Product;
  mockupConfig: Record<string, MockupTypeConfig> | null;
}) {
  const router  = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [currentImageIdx, setCurrentImageIdx]   = useState(0);
  const [quantity, setQuantity]                 = useState(1);
  const [hasCustomization, setHasCustomization] = useState(false);
  const [logoFile, setLogoFile]                 = useState<File | null>(null);
  const [logoPreview, setLogoPreview]           = useState<string | null>(null);
  const [removingBg, setRemovingBg]             = useState(false);
  const [notes, setNotes]                       = useState("");
  const [adding, setAdding]                     = useState(false);
  const [selectedColor, setSelectedColor]       = useState(product.availableColors[0] ?? "");
  const [selectedSize, setSelectedSize]         = useState(product.availableSizes[0] ?? "");
  const [selectedClosure, setSelectedClosure]   = useState(product.availableClosures[0] ?? "");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showLightbox, setShowLightbox]         = useState(false);
  const [mockupConfig, setMockupConfig]         = useState<Record<string, MockupTypeConfig> | undefined>(initialMockupConfig ?? undefined);
  const [openAccordion, setOpenAccordion]       = useState<string | null>(null);

  const resolveColorImage = (ci: Record<string, string> | undefined, color: string) => {
    if (!ci || !color) return undefined;
    return ci[color] ?? ci[color.toLowerCase()]
      ?? ci[color.charAt(0).toUpperCase() + color.slice(1).toLowerCase()]
      ?? Object.entries(ci).find(([k]) => k.toLowerCase() === color.toLowerCase())?.[1];
  };

  // Refresh mockup config client-side in case it changed
  useEffect(() => {
    fetch("/api/admin/mockup-config").then(r => r.json())
      .then(d => { if (d) setMockupConfig(d); }).catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setShowLightbox(false); setShowConfirmModal(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png","image/jpeg","image/jpg","application/pdf"].includes(file.type)) {
      alert("Formato inválido. Use PNG, JPG ou PDF."); return;
    }
    if (file.size > 10 * 1024 * 1024) { alert("Arquivo muito grande. Máximo 10 MB."); return; }
    setLogoFile(file);
    if (file.type === "application/pdf") { setLogoPreview(null); return; }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      if (file.type === "image/jpeg" || file.type === "image/jpg") {
        setRemovingBg(true);
        try { setLogoPreview(await removeImageBackground(dataUrl)); }
        catch { setLogoPreview(dataUrl); }
        finally { setRemovingBg(false); }
      } else setLogoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleAddToCartClick = () => {
    if (hasCustomization && !logoFile) { alert("Por favor, envie o logotipo para continuar."); return; }
    if (hasCustomization && logoFile) { setShowConfirmModal(true); return; }
    confirmAddToCart();
  };

  const confirmAddToCart = async () => {
    setAdding(true);
    let logoUrl = "";
    if (logoFile) {
      const fd = new FormData(); fd.append("file", logoFile);
      try { const r = await fetch("/api/upload", { method: "POST", body: fd }); logoUrl = (await r.json()).url ?? ""; }
      catch { alert("Erro ao enviar logotipo. Tente novamente."); setAdding(false); return; }
    }
    const colorKey  = selectedColor?.toLowerCase();
    const cartImage = (colorKey && product.colorImages?.[colorKey]) ? product.colorImages[colorKey]
      : (colorKey && product.colorImages?.[selectedColor]) ? product.colorImages[selectedColor]
      : product.images[currentImageIdx] ?? product.images[0] ?? "";
    addItem({
      productId: product.id, name: product.name, image: cartImage, quantity,
      unitPrice: hasCustomization ? product.priceWithCustom : product.priceBase,
      hasCustomization, logoUrl: logoUrl || undefined, logoFileName: logoFile?.name,
      notes: notes || undefined,
      selectedColor: selectedColor || undefined, selectedSize: selectedSize || undefined,
      selectedClosure: selectedClosure || undefined,
    });
    setAdding(false); setShowConfirmModal(false);
    router.push("/carrinho");
  };

  const price    = hasCustomization ? product.priceWithCustom : product.priceBase;
  const colorImg = resolveColorImage(product.colorImages, selectedColor);
  const mainSrc  = colorImg ?? (product.images[currentImageIdx] ?? product.images[0] ?? null);
  const ctaLabel = hasCustomization && logoFile
    ? `Ver prévia · ${formatCurrency(price * quantity)}`
    : `Adicionar · ${formatCurrency(price * quantity)}`;

  /* ── Bloco de imagem principal (reutilizado em mobile e desktop) ── */
  const MainImage = (
    <div className="mockup-bg" style={{ position: "relative", overflow: "hidden", aspectRatio: "1 / 1", isolation: "isolate" }}>
      {hasCustomization && (logoPreview || logoFile) ? (
        <MockupPreview
          mockupType={product.mockupType ?? "capa"}
          logoPreview={logoPreview} logoFileName={logoFile?.name}
          selectedColor={selectedColor} configOverride={mockupConfig}
          colorImages={product.colorImages}
        />
      ) : mainSrc ? (
        <>
          <img src={mainSrc} alt={product.name} onClick={() => setShowLightbox(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "multiply", cursor: "zoom-in" }}
            onError={e => { (e.target as HTMLImageElement).style.mixBlendMode = "normal"; }} />
          {!colorImg && product.images.length > 1 && (
            <>
              <button onClick={() => setCurrentImageIdx(i => (i - 1 + product.images.length) % product.images.length)}
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, background: "rgba(0,0,0,0.4)", border: 0, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setCurrentImageIdx(i => (i + 1) % product.images.length)}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, background: "rgba(0,0,0,0.4)", border: 0, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={16} />
              </button>
            </>
          )}
        </>
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ opacity: 0.15, fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase" }}>sem imagem</div>
        </div>
      )}
      <div className="t-mono" style={{ position: "absolute", top: 10, left: 10, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(4px)", padding: "3px 7px", borderRadius: 2 }}>
        {product.category.name}
      </div>
      {hasCustomization && logoFile && (
        <div style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 5, background: "var(--gold)", color: "#000", fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "5px 10px", borderRadius: 2 }}>
          <Eye size={9} /> Prévia
        </div>
      )}
    </div>
  );

  /* ── Bloco de upload logo (reutilizado) ── */
  const LogoUpload = (
    <div style={{ marginBottom: 16 }}>
      <p className="t-eyebrow mb-2" style={{ fontSize: 9 }}>Seu logotipo <span style={{ color: "#c0392b" }}>*</span></p>
      {removingBg ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 14px", border: "1px solid var(--line-soft)", fontSize: 13, color: "var(--muted)" }}>
          <span>✂️</span> Removendo fundo…
        </div>
      ) : logoPreview ? (
        <div style={{ position: "relative" }}>
          <img src={logoPreview} alt="Preview" style={{ width: "100%", maxHeight: 150, objectFit: "contain", border: "1px solid var(--line-soft)", background: "repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 0 0 / 12px 12px" }} />
          <button onClick={() => { setLogoFile(null); setLogoPreview(null); }} style={{ position: "absolute", top: 6, right: 6, width: 26, height: 26, background: "#c0392b", border: 0, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={12} />
          </button>
          <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#27ae60" }}>
            <CheckCircle size={12} /> Logo carregada
          </div>
        </div>
      ) : logoFile?.name?.endsWith(".pdf") ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, border: "1px solid var(--line-soft)" }}>
          <span style={{ fontSize: 20 }}>📄</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{logoFile.name}</p>
            <p className="t-eyebrow mt-0.5">PDF enviado</p>
          </div>
          <button onClick={() => setLogoFile(null)} style={{ background: "none", border: 0, cursor: "pointer", color: "#c0392b" }}><X size={16} /></button>
        </div>
      ) : (
        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px dashed var(--line-soft)", padding: "20px 16px", cursor: "pointer", gap: 6, borderRadius: "var(--r-sm)" }}>
          <Upload size={22} style={{ color: "var(--gold)" }} />
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0, textAlign: "center" }}>Clique para enviar seu logo</p>
          <p className="t-eyebrow" style={{ margin: 0 }}>PNG · JPG · PDF — máx. 10 MB</p>
          <input type="file" accept=".png,.jpg,.jpeg,.pdf" onChange={handleLogoChange} style={{ display: "none" }} />
        </label>
      )}
    </div>
  );

  return (
    <div style={{ background: "var(--bg)", color: "var(--ink)" }}>

      {/* ════════════════════════════════════════════
          MOBILE  (escondido no md+)
          Layout: miniaturas de cor → imagem grande → info
      ════════════════════════════════════════════ */}
      <div className="md:hidden">

        {/* Breadcrumb */}
        <div className="px-4 pt-4 pb-1 t-mono flex items-center overflow-hidden">
          {["Loja", product.category.name].map((c, i) => (
            <span key={i} style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", flexShrink: 0 }}>
              {i > 0 && <span style={{ margin: "0 6px" }}>/</span>}
              {c}
            </span>
          ))}
        </div>

        {/* ── 1. Faixa de miniaturas por cor (topo) ── */}
        {product.availableColors.length > 0 && (
          <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "8px 16px", scrollbarWidth: "none" }}>
            {product.availableColors.map((color) => {
              const img = resolveColorImage(product.colorImages, color);
              const isActive = selectedColor === color;
              return img ? (
                <button key={color} onClick={() => setSelectedColor(color)} style={{
                  width: 64, height: 64, flexShrink: 0, padding: 0, cursor: "pointer",
                  border: isActive ? "2px solid var(--ink)" : "1px solid var(--line-soft)",
                  borderRadius: "var(--r-xs)", overflow: "hidden",
                  boxShadow: isActive ? "0 0 0 2px var(--bg), 0 0 0 4px var(--ink)" : "none",
                  transition: "box-shadow 0.15s",
                }}>
                  <img src={img} alt={color} style={{ width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "multiply", display: "block" }}
                    onError={e => { (e.target as HTMLImageElement).style.mixBlendMode = "normal"; }} />
                </button>
              ) : (
                <button key={color} onClick={() => setSelectedColor(color)} title={color} style={{
                  width: 44, height: 44, flexShrink: 0, borderRadius: "50%",
                  background: getColorCss(color), cursor: "pointer",
                  border: isActive ? "2px solid var(--ink)" : "1px solid var(--line-soft)",
                  outline: isActive ? "2px solid var(--bg)" : "none", outlineOffset: -3,
                }} />
              );
            })}
          </div>
        )}

        {/* Nome da cor selecionada */}
        {selectedColor && (
          <p className="t-eyebrow px-4 mb-1" style={{ fontSize: 9, color: "var(--gold)" }}>
            — {selectedColor}
          </p>
        )}

        {/* ── 2. Imagem principal grande ── */}
        <div className="px-4">{MainImage}</div>

        {/* ── 3. Info do produto ── */}
        <div style={{ padding: "14px 16px 0" }}>

          {/* Nome + preço */}
          <h1 className="t-display" style={{ fontSize: "clamp(22px,6vw,34px)", margin: "0 0 6px", lineHeight: 1.0 }}>
            {product.name}
          </h1>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
            <div className="t-display" style={{ fontSize: 26 }}>{formatCurrency(price)}</div>
            {hasCustomization && (
              <span className="t-mono" style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.12em" }}>+ personalização</span>
            )}
          </div>
          <p className="t-eyebrow" style={{ fontSize: 9, marginBottom: 16 }}>
            Parcelamos em até 3× via <span style={{ color: "var(--gold)" }}>WhatsApp</span>
          </p>

          {/* Tamanho */}
          {product.availableSizes.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <p className="t-eyebrow" style={{ fontSize: 9 }}>Tamanho · <span style={{ color: "var(--ink)" }}>{selectedSize}</span></p>
                <SizeGuide />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {product.availableSizes.map(s => <Chip key={s} label={s} active={selectedSize === s} onClick={() => setSelectedSize(s)} />)}
              </div>
            </div>
          )}

          {/* Fechamento */}
          {product.availableClosures.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p className="t-eyebrow mb-2" style={{ fontSize: 9 }}>Fechamento · <span style={{ color: "var(--ink)" }}>{selectedClosure}</span></p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {product.availableClosures.map(c => <Chip key={c} label={c} active={selectedClosure === c} onClick={() => setSelectedClosure(c)} />)}
              </div>
            </div>
          )}

          {/* Personalização toggle */}
          {product.allowsCustomization && (
            <label style={{ display: "flex", gap: 12, padding: 14, border: `1px solid ${hasCustomization ? "var(--ink)" : "var(--line-soft)"}`, cursor: "pointer", marginBottom: 14, alignItems: "flex-start", borderRadius: "var(--r-sm)" }}>
              <div onClick={() => { setHasCustomization(!hasCustomization); if (hasCustomization) { setLogoFile(null); setLogoPreview(null); } }}
                style={{ width: 18, height: 18, borderRadius: 2, border: "1px solid var(--ink)", background: hasCustomization ? "var(--ink)" : "transparent", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {hasCustomization && <div style={{ width: 8, height: 8, background: "var(--bg)" }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div className="t-display" style={{ fontSize: 14, marginBottom: 2 }}>
                  Personalizar com minha logo
                  <span className="t-mono" style={{ display: "inline-block", fontSize: 9, color: "var(--gold)", marginLeft: 8, letterSpacing: "0.12em", verticalAlign: "middle" }}>
                    +{formatCurrency(product.priceWithCustom - product.priceBase)}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>Bordado ou serigrafia, posição no peito.</p>
              </div>
            </label>
          )}

          {hasCustomization && LogoUpload}

          {/* Notas */}
          <div style={{ marginBottom: 12 }}>
            <p className="t-eyebrow mb-1" style={{ fontSize: 9 }}>Observações (opcional)</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ex: cor preferida, posição da logo…" rows={2}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line-soft)", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 13, outline: "none", color: "var(--ink)", resize: "none", borderRadius: "var(--r-sm)", boxSizing: "border-box" }} />
          </div>

          {/* Benefits strip */}
          <div style={{ display: "flex", gap: 14, overflowX: "auto", padding: "12px 0", borderTop: "1px solid var(--line-hair)", scrollbarWidth: "none" }}>
            {[["✦","Impressão DTF"],["◈","Logo Incluído"],["⟳","Lavável"],["→","Entrega Nacional"]].map(([icon,label]) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, width: 70, textAlign: "center" }}>
                <span style={{ fontSize: 14, color: "var(--gold)" }}>{icon}</span>
                <span className="t-eyebrow" style={{ fontSize: 8, color: "var(--muted)", lineHeight: 1.3 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Prazo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: "1px solid var(--line-hair)", borderLeft: "3px solid var(--gold)", background: "rgba(168,130,58,0.05)", marginTop: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 15, color: "var(--gold)" }}>◷</span>
            <p style={{ fontSize: 12, margin: 0 }}><strong>{product.productionDays} dias úteis</strong> de produção · entrega rastreada</p>
          </div>

          {/* Accordions */}
          <div style={{ borderTop: "1px solid var(--line-soft)", marginBottom: 4 }}>
            {[
              { id: "descricao", label: "Descrição", content: product.description },
              { id: "especificacoes", label: "Especificações", content: [
                  product.weightGrams ? `Peso: ${product.weightGrams}g` : null,
                  product.heightCm    ? `Altura: ${product.heightCm}cm` : null,
                  product.widthCm     ? `Largura: ${product.widthCm}cm` : null,
                  product.lengthCm    ? `Comprimento: ${product.lengthCm}cm` : null,
                  product.availableColors.length   ? `Cores: ${product.availableColors.join(", ")}` : null,
                  product.availableSizes.length    ? `Tamanhos: ${product.availableSizes.join(", ")}` : null,
                  product.availableClosures.length ? `Fechamentos: ${product.availableClosures.join(", ")}` : null,
                ].filter(Boolean).join(" · ") },
              { id: "como", label: "Como Personalizar", content: product.allowsCustomization
                  ? "Envie seu logotipo em PNG, JPG ou PDF. Nossa equipe produzirá um mockup para aprovação antes da produção."
                  : "Este produto não aceita personalização com logotipo." },
            ].map(({ id, label, content }) => (
              <div key={id} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                <button onClick={() => setOpenAccordion(openAccordion === id ? null : id)}
                  style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", background: "transparent", border: 0, cursor: "pointer", color: "var(--ink)" }}>
                  <span className="t-eyebrow" style={{ fontSize: 10 }}>{label}</span>
                  <ChevronDown size={13} style={{ color: "var(--muted)", transition: "transform 0.2s", transform: openAccordion === id ? "rotate(180deg)" : "none" }} />
                </button>
                <div style={{ maxHeight: openAccordion === id ? 300 : 0, overflow: "hidden", transition: "max-height 0.3s ease" }}>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--ink-soft)", paddingBottom: 12, margin: 0 }}>{content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Espaço para a barra fixada */}
        <div style={{ height: 72 }} />
      </div>

      {/* ════════════════════════════════════════════
          DESKTOP  (escondido abaixo do md)
          Layout: galeria esquerda · info direita
      ════════════════════════════════════════════ */}
      <div className="hidden md:block">
        <div className="px-8 pt-5 pb-2">
          <div style={{ maxWidth: 1440, margin: "0 auto" }} className="t-mono flex items-center">
            {["Loja", product.category.name, product.name].map((c, i, arr) => (
              <span key={i} className={i === arr.length - 1 ? "truncate" : "shrink-0"}
                style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                {i > 0 && <span style={{ margin: "0 8px", color: "var(--muted)" }}>/</span>}
                <span style={{ color: i === arr.length - 1 ? "var(--ink)" : "var(--muted)" }}>{c}</span>
              </span>
            ))}
          </div>
        </div>

        <section className="px-8 pt-4 pb-20">
          <div style={{ maxWidth: 1440, margin: "0 auto", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "80px" }}>

            {/* Galeria desktop */}
            <div style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: 12 }}>
              {/* Thumbnails verticais */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {product.images.map((src, i) => (
                  <button key={i} onClick={() => setCurrentImageIdx(i)} className="mockup-bg"
                    style={{ aspectRatio: "1", overflow: "hidden", border: i === currentImageIdx ? "1px solid var(--ink)" : "1px solid var(--line-soft)", padding: 0, cursor: "pointer", isolation: "isolate" }}>
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "multiply" }}
                      onError={e => { (e.target as HTMLImageElement).style.mixBlendMode = "normal"; }} />
                  </button>
                ))}
              </div>

              {/* Imagem principal */}
              <div className="mockup-bg" style={{ position: "relative", overflow: "hidden", aspectRatio: "4 / 5", isolation: "isolate" }}>
                {hasCustomization && (logoPreview || logoFile) ? (
                  <MockupPreview mockupType={product.mockupType ?? "capa"} logoPreview={logoPreview} logoFileName={logoFile?.name}
                    selectedColor={selectedColor} configOverride={mockupConfig} colorImages={product.colorImages} />
                ) : mainSrc ? (
                  <>
                    <img src={mainSrc} alt={product.name} onClick={() => setShowLightbox(true)}
                      style={{ width: "100%", height: "100%", objectFit: "cover", mixBlendMode: "multiply", cursor: "zoom-in" }}
                      onError={e => { (e.target as HTMLImageElement).style.mixBlendMode = "normal"; }} />
                    <button onClick={() => setShowLightbox(true)} style={{ position: "absolute", bottom: 12, right: 12, width: 34, height: 34, background: "rgba(0,0,0,0.45)", border: 0, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Maximize2 size={14} />
                    </button>
                    {!colorImg && product.images.length > 1 && (
                      <>
                        <button onClick={() => setCurrentImageIdx(i => (i - 1 + product.images.length) % product.images.length)}
                          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, background: "rgba(0,0,0,0.45)", border: 0, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ChevronLeft size={16} />
                        </button>
                        <button onClick={() => setCurrentImageIdx(i => (i + 1) % product.images.length)}
                          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 36, height: 36, background: "rgba(0,0,0,0.45)", border: 0, borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ChevronRight size={16} />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ opacity: 0.15, fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase" }}>sem imagem</div>
                  </div>
                )}
                <div className="t-mono" style={{ position: "absolute", top: 20, left: 20, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted)" }}>
                  {product.category.name}
                </div>
                {hasCustomization && logoFile && (
                  <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 6, background: "var(--gold)", color: "#000", fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.12em", textTransform: "uppercase", padding: "6px 12px", borderRadius: 2 }}>
                    <Eye size={10} /> Prévia ao vivo
                  </div>
                )}
              </div>
            </div>

            {/* Info desktop */}
            <div>
              <p className="t-eyebrow mb-4">— {product.category.name}</p>
              <h1 className="t-display" style={{ fontSize: "clamp(30px,5vw,64px)", margin: 0, lineHeight: 0.95 }}>
                {product.name.includes(" ") ? (
                  <>{product.name.split(" ").slice(0,-1).join(" ")}{" "}
                    <span className="t-display-italic" style={{ color: "var(--gold)" }}>{product.name.split(" ").slice(-1)}</span>
                  </>
                ) : <span className="t-display-italic" style={{ color: "var(--gold)" }}>{product.name}</span>}
              </h1>
              <p style={{ fontSize: 15, lineHeight: 1.65, color: "var(--ink-soft)", marginTop: 20, maxWidth: 520 }}>{product.description}</p>
              <div className="t-display" style={{ fontSize: 36, marginTop: 28 }}>
                {formatCurrency(price)}
                {hasCustomization && <span className="t-mono" style={{ fontSize: 9, color: "var(--gold)", marginLeft: 16, letterSpacing: "0.14em", opacity: 0.72, verticalAlign: "middle" }}>personalização incluída</span>}
              </div>
              <p className="t-eyebrow mt-1.5">Parcelamos em até 3× sem juros <span style={{ color: "var(--gold)" }}>via WhatsApp</span></p>

              <div className="grid grid-cols-4 gap-3" style={{ marginTop: 24, padding: "16px 0", borderTop: "1px solid var(--line-hair)", borderBottom: "1px solid var(--line-hair)" }}>
                {[["✦","Impressão DTF"],["◈","Logo Incluído"],["⟳","Lavável"],["→","Entrega Nacional"]].map(([icon,label]) => (
                  <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, textAlign: "center" }}>
                    <span style={{ fontSize: 16, color: "var(--gold)" }}>{icon}</span>
                    <span className="t-eyebrow" style={{ fontSize: 8, color: "var(--muted)" }}>{label}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, padding: "14px 18px", border: "1px solid var(--gold)", borderLeft: "3px solid var(--gold)", background: "rgba(168,130,58,0.05)", display: "flex", gap: 12 }}>
                <span style={{ fontSize: 18, color: "var(--gold)", flexShrink: 0 }}>◷</span>
                <div>
                  <p className="t-eyebrow" style={{ fontSize: 9, color: "var(--gold)", marginBottom: 4 }}>Prazo de produção</p>
                  <p style={{ fontSize: 13, margin: 0 }}><strong>{product.productionDays} dias úteis</strong> após confirmação. Enviamos para todo o Brasil com rastreamento.</p>
                </div>
              </div>

              <hr style={{ border: 0, borderTop: "1px solid var(--line-hair)", margin: "28px 0" }} />

              {/* Cor */}
              {product.availableColors.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p className="t-eyebrow mb-3">Cor · <span style={{ color: "var(--ink)" }}>{selectedColor}</span></p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {product.availableColors.map(color => (
                      <button key={color} onClick={() => setSelectedColor(color)} title={color} style={{ width: 36, height: 36, borderRadius: "50%", background: getColorCss(color), cursor: "pointer", border: selectedColor === color ? "2px solid var(--ink)" : "1px solid var(--line-soft)", outline: selectedColor === color ? "2px solid var(--bg)" : "none", outlineOffset: -4 }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Tamanho */}
              {product.availableSizes.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <p className="t-eyebrow">Tamanho · <span style={{ color: "var(--ink)" }}>{selectedSize}</span></p>
                    <SizeGuide />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {product.availableSizes.map(s => <Chip key={s} label={s} active={selectedSize === s} onClick={() => setSelectedSize(s)} />)}
                  </div>
                </div>
              )}

              {/* Fechamento */}
              {product.availableClosures.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <p className="t-eyebrow mb-3">Fechamento · <span style={{ color: "var(--ink)" }}>{selectedClosure}</span></p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {product.availableClosures.map(c => <Chip key={c} label={c} active={selectedClosure === c} onClick={() => setSelectedClosure(c)} />)}
                  </div>
                </div>
              )}

              {/* Personalização */}
              {product.allowsCustomization && (
                <label style={{ display: "flex", gap: 14, padding: 20, border: `1px solid ${hasCustomization ? "var(--ink)" : "var(--line-soft)"}`, cursor: "pointer", marginBottom: 24, alignItems: "flex-start" }}>
                  <div onClick={() => { setHasCustomization(!hasCustomization); if (hasCustomization) { setLogoFile(null); setLogoPreview(null); } }}
                    style={{ width: 18, height: 18, borderRadius: 2, border: "1px solid var(--ink)", background: hasCustomization ? "var(--ink)" : "transparent", flexShrink: 0, marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {hasCustomization && <div style={{ width: 8, height: 8, background: "var(--bg)" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="t-display" style={{ fontSize: 17, marginBottom: 4 }}>
                      Personalizar com minha logo
                      <span className="t-mono" style={{ display: "inline-block", fontSize: 9, color: "var(--gold)", marginLeft: 10, letterSpacing: "0.12em", verticalAlign: "middle" }}>
                        +{formatCurrency(product.priceWithCustom - product.priceBase)}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Bordado ou serigrafia, posição no peito. Enviaremos um mockup para aprovação antes da produção.</p>
                  </div>
                </label>
              )}

              {hasCustomization && (
                <div style={{ marginBottom: 24 }}>
                  <p className="t-eyebrow mb-3">Seu logotipo <span style={{ color: "#c0392b" }}>*</span></p>
                  {LogoUpload}
                  <div style={{ marginTop: 10, display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ width: 2, alignSelf: "stretch", background: "var(--gold)", flexShrink: 0, borderRadius: 1, opacity: 0.7 }} />
                    <p className="t-mono" style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>
                      {product.mockupType?.includes("camiseta") ? <>Frente: logo até <strong style={{ color: "var(--ink)" }}>10 cm</strong> · Costas: logo até <strong style={{ color: "var(--ink)" }}>26 cm</strong></>
                        : <>Logo: medida maior até <strong style={{ color: "var(--ink)" }}>30 cm</strong></>}
                      <span style={{ display: "block", marginTop: 2, opacity: 0.7 }}>Medidas de impressão na peça — não resolução do arquivo</span>
                    </p>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 28 }}>
                <p className="t-eyebrow mb-2">Observações (opcional)</p>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Ex: cor preferida, posição da logo…" rows={2}
                  style={{ width: "100%", padding: "14px 16px", border: "1px solid var(--line-soft)", background: "transparent", fontFamily: "var(--font-sans)", fontSize: 14, outline: "none", color: "var(--ink)", resize: "none", borderRadius: "var(--r-sm)", boxSizing: "border-box" }} />
              </div>

              {/* Qty + CTA desktop */}
              <div style={{ display: "flex", gap: 14, alignItems: "stretch" }}>
                <div style={{ display: "flex", border: "1px solid var(--ink)", alignItems: "center" }}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 44, height: "100%", background: "transparent", border: 0, cursor: "pointer", fontSize: 18, color: "var(--ink)" }}>−</button>
                  <div className="t-mono" style={{ width: 44, textAlign: "center", fontSize: 15 }}>{quantity.toString().padStart(2, "0")}</div>
                  <button onClick={() => setQuantity(quantity + 1)} style={{ width: 44, height: "100%", background: "transparent", border: 0, cursor: "pointer", fontSize: 18, color: "var(--ink)" }}>+</button>
                </div>
                <button onClick={handleAddToCartClick} style={{ flex: 1, padding: "16px 24px", background: "var(--ink)", color: "var(--bg)", border: "1px solid var(--ink)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", borderRadius: "var(--r-sm)" }}>
                  {ctaLabel}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4" style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid var(--line-soft)" }}>
                {[["Prazo",`${product.productionDays} dias úteis`],["Entrega","Brasil inteiro"],["Pagamento","50% + 50%"]].map(([t,v]) => (
                  <div key={t}><p className="t-eyebrow mb-1">{t}</p><p style={{ fontSize: 13, margin: 0 }}>{v}</p></div>
                ))}
              </div>

              <div style={{ marginTop: 32, borderTop: "1px solid var(--line-soft)" }}>
                {[
                  { id: "descricao", label: "Descrição", content: product.description },
                  { id: "especificacoes", label: "Especificações Técnicas", content: [
                      product.weightGrams ? `Peso: ${product.weightGrams}g` : null,
                      product.heightCm    ? `Altura: ${product.heightCm}cm` : null,
                      product.widthCm     ? `Largura: ${product.widthCm}cm` : null,
                      product.lengthCm    ? `Comprimento: ${product.lengthCm}cm` : null,
                      product.availableColors.length   ? `Cores: ${product.availableColors.join(", ")}` : null,
                      product.availableSizes.length    ? `Tamanhos: ${product.availableSizes.join(", ")}` : null,
                      product.availableClosures.length ? `Fechamentos: ${product.availableClosures.join(", ")}` : null,
                    ].filter(Boolean).join(" · ") },
                  { id: "personalizacao", label: "Como Personalizar", content: product.allowsCustomization
                      ? "Selecione a opção acima e envie seu logotipo. Nossa equipe produzirá um mockup para aprovação antes da produção."
                      : "Este produto não aceita personalização com logotipo." },
                ].map(({ id, label, content }) => (
                  <div key={id} style={{ borderBottom: "1px solid var(--line-soft)" }}>
                    <button onClick={() => setOpenAccordion(openAccordion === id ? null : id)}
                      style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", background: "transparent", border: 0, cursor: "pointer", color: "var(--ink)", textAlign: "left" }}>
                      <span className="t-eyebrow" style={{ fontSize: 10, letterSpacing: "0.14em" }}>{label}</span>
                      <ChevronDown size={14} style={{ color: "var(--muted)", flexShrink: 0, transition: "transform 0.2s", transform: openAccordion === id ? "rotate(180deg)" : "none" }} />
                    </button>
                    <div style={{ maxHeight: openAccordion === id ? 400 : 0, overflow: "hidden", transition: "max-height 0.3s ease" }}>
                      <p style={{ fontSize: 13, lineHeight: 1.7, color: "var(--ink-soft)", paddingBottom: 16, margin: 0 }}>{content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Barra CTA fixada — mobile only ── */}
      <div className="md:hidden" style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
        background: "var(--bg)", borderTop: "1px solid var(--line-soft)",
        padding: "10px 16px", display: "flex", gap: 10, alignItems: "center",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
      }}>
        <div style={{ display: "flex", border: "1px solid var(--ink)", alignItems: "center", flexShrink: 0 }}>
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={{ width: 38, height: 44, background: "transparent", border: 0, cursor: "pointer", fontSize: 18, color: "var(--ink)" }}>−</button>
          <div className="t-mono" style={{ width: 30, textAlign: "center", fontSize: 14 }}>{quantity.toString().padStart(2, "0")}</div>
          <button onClick={() => setQuantity(quantity + 1)} style={{ width: 38, height: 44, background: "transparent", border: 0, cursor: "pointer", fontSize: 18, color: "var(--ink)" }}>+</button>
        </div>
        <button onClick={handleAddToCartClick} style={{
          flex: 1, padding: "13px 14px", background: "var(--ink)", color: "var(--bg)",
          border: "1px solid var(--ink)", fontFamily: "var(--font-mono)", fontSize: 11,
          letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", borderRadius: "var(--r-sm)",
        }}>
          {ctaLabel}
        </button>
      </div>

      {/* Lightbox */}
      {showLightbox && mainSrc && (
        <div onClick={() => setShowLightbox(false)} style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, cursor: "zoom-out" }}>
          {!colorImg && product.images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); setCurrentImageIdx(i => (i - 1 + product.images.length) % product.images.length); }} style={{ position: "fixed", left: 16, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 61 }}>
                <ChevronLeft size={20} />
              </button>
              <button onClick={e => { e.stopPropagation(); setCurrentImageIdx(i => (i + 1) % product.images.length); }} style={{ position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 61 }}>
                <ChevronRight size={20} />
              </button>
            </>
          )}
          <button onClick={() => setShowLightbox(false)} style={{ position: "fixed", top: 16, right: 16, width: 40, height: 40, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "50%", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 61 }}>
            <X size={18} />
          </button>
          <img src={mainSrc} alt={product.name} onClick={e => e.stopPropagation()} style={{ maxWidth: "min(90vw,1200px)", maxHeight: "90vh", objectFit: "contain" }} />
          {!colorImg && product.images.length > 1 && (
            <div className="t-mono" style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
              {currentImageIdx + 1} / {product.images.length}
            </div>
          )}
        </div>
      )}

      {/* Modal prévia mockup */}
      {showConfirmModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "var(--bg)", border: "1px solid var(--line-soft)", width: "100%", maxWidth: 640, maxHeight: "95vh", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid var(--line-soft)" }}>
              <div>
                <h2 className="t-display" style={{ fontSize: 22, margin: 0 }}>Prévia do produto personalizado</h2>
                <p className="t-eyebrow mt-1">Confira antes de adicionar à sacola</p>
              </div>
              <button onClick={() => setShowConfirmModal(false)} style={{ background: "none", border: 0, cursor: "pointer", color: "var(--muted)", padding: 8 }}><X size={20} /></button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ width: "100%", aspectRatio: "1", maxWidth: 320, margin: "0 auto", background: "var(--bg-2)", overflow: "hidden", position: "relative" }}>
                <MockupPreview mockupType={product.mockupType ?? "capa"} logoPreview={logoPreview} logoFileName={logoFile?.name}
                  selectedColor={selectedColor} configOverride={mockupConfig} colorImages={product.colorImages} />
              </div>
            </div>
            <div style={{ padding: "0 24px 12px" }}>
              <div style={{ border: "1px solid var(--line-soft)", padding: 20 }}>
                <p className="t-eyebrow mb-3">Resumo do pedido</p>
                {[["Produto", product.name], selectedColor && ["Cor", selectedColor], selectedSize && ["Tamanho", selectedSize], selectedClosure && ["Fechamento", selectedClosure], ["Logo", logoFile?.name ?? "—"], ["Quantidade", `${quantity}×`]]
                  .filter(Boolean).map(([k, v]) => (
                    <div key={k as string} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", color: "var(--muted)" }}>
                      <span>{k as string}</span><span style={{ color: "var(--ink)", fontWeight: 500 }}>{v as string}</span>
                    </div>
                  ))}
                <hr style={{ border: 0, borderTop: "1px solid var(--line-hair)", margin: "10px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <p className="t-eyebrow">Total</p>
                  <div className="t-display" style={{ fontSize: 24 }}>{formatCurrency(price * quantity)}</div>
                </div>
              </div>
              <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 10, lineHeight: 1.5, textAlign: "center" }}>
                A prévia é aproximada. O posicionamento final pode ter pequenas variações.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, padding: 24, paddingTop: 12 }}>
              <button onClick={() => setShowConfirmModal(false)} style={{ flex: 1, padding: "14px 20px", background: "transparent", color: "var(--muted)", border: "1px solid var(--line-soft)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer", borderRadius: "var(--r-sm)" }}>
                ← Voltar e ajustar
              </button>
              <button onClick={confirmAddToCart} disabled={adding} style={{ flex: 1, padding: "14px 20px", background: adding ? "var(--muted)" : "var(--ink)", color: "var(--bg)", border: "1px solid var(--ink)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", cursor: adding ? "not-allowed" : "pointer", borderRadius: "var(--r-sm)" }}>
                {adding ? "Adicionando…" : "Confirmar e adicionar →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
