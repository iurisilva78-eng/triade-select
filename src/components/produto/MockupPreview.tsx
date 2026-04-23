"use client";

import { DEFAULT_MOCKUP_CONFIG, MockupTypeConfig } from "@/lib/mockup-config";

interface MockupPreviewProps {
  mockupType: string;
  logoPreview: string | null;
  logoFileName?: string;
  selectedColor?: string;
  /** Sobrescreve a config padrão (usado pelo editor admin e pela página do produto) */
  configOverride?: Record<string, MockupTypeConfig>;
  /** Imagens específicas por cor { "Preto": "url", "Azul": "url" } */
  colorImages?: Record<string, string>;
}

export function MockupPreview({
  mockupType,
  logoPreview,
  logoFileName,
  selectedColor,
  configOverride,
  colorImages,
}: MockupPreviewProps) {
  const configMap = configOverride ?? DEFAULT_MOCKUP_CONFIG;
  const config = configMap[mockupType] ?? DEFAULT_MOCKUP_CONFIG["capa"];

  // Imagem de fundo: usa a foto da cor específica se existir, senão o mockup genérico
  const colorKey = selectedColor ?? "";
  const bgImage = (colorImages && colorKey && colorImages[colorKey])
    ? colorImages[colorKey]
    : config.image;

  return (
    <div className="relative w-full h-full">
      {/* Imagem base do produto (cor específica ou mockup genérico) */}
      <img
        src={bgImage}
        alt="Mockup do produto"
        className="w-full h-full object-contain"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />

      {/* Sobreposição da logo em cada zona */}
      {(logoPreview || logoFileName?.endsWith(".pdf")) &&
        config.zones.map((zone, idx) => (
          <div
            key={idx}
            className="absolute flex items-center justify-center"
            style={{
              top: zone.top,
              left: zone.left,
              width: zone.size,
              transform: "translate(-50%, -50%)",
              aspectRatio: "1",
            }}
          >
            {logoPreview ? (
              <img
                src={logoPreview}
                alt={`Logo — ${zone.label}`}
                className="max-w-full max-h-full object-contain drop-shadow-md"
                style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.4))" }}
              />
            ) : (
              <div className="text-2xl drop-shadow">📄</div>
            )}

            {/* Indicador da zona */}
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-white/70 whitespace-nowrap bg-black/40 px-1.5 py-0.5 rounded-full">
              {zone.label}
            </div>
          </div>
        ))}

      {/* Legenda inferior */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white/50 bg-black/30 px-2 py-0.5 rounded-full whitespace-nowrap">
        Prévia aproximada
      </div>
    </div>
  );
}
