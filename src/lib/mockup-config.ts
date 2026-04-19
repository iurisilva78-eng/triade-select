export interface LogoZone {
  top: string;
  left: string;
  size: string;
  label?: string;
}

export interface MockupTypeConfig {
  image: string;
  zones: LogoZone[];
}

export const DEFAULT_MOCKUP_CONFIG: Record<string, MockupTypeConfig> = {
  capa: {
    image: "/mockups/capa.png",
    zones: [{ top: "23%", left: "50%", size: "25%", label: "Peito" }],
  },
  camiseta: {
    image: "/mockups/camiseta.png",
    zones: [{ top: "30%", left: "60%", size: "13%", label: "Peito" }],
  },
  "camiseta-dupla": {
    image: "/mockups/camiseta-dupla.png",
    zones: [
      { top: "30%", left: "24%", size: "9%", label: "Peito" },
      { top: "28%", left: "74%", size: "14%", label: "Costas" },
    ],
  },
};
