import type { Metadata } from "next";
import { Fraunces, Inter_Tight, JetBrains_Mono, Playfair_Display, DM_Serif_Display, Oswald } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { prisma } from "@/lib/prisma";

/* ─── Fonts ──────────────────────────────────────────────── */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});
const interTight = Inter_Tight({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500"],
});
const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
});
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

/* ─── Design tokens from DB ───────────────────────────────── */
const DESIGN_KEYS = [
  "design_accent_color",
  "design_display_font",
  "design_border_radius",
  "design_theme",
  "meta_title",
  "meta_description",
];

async function getDesignTokens(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.siteConfig.findMany({
      where: { key: { in: DESIGN_KEYS } },
    });
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

function fontVarForName(name: string): string {
  switch (name) {
    case "Fraunces":        return "var(--font-fraunces)";
    case "Playfair Display": return "var(--font-playfair)";
    case "DM Serif Display": return "var(--font-dm-serif)";
    case "Oswald":           return "var(--font-oswald)";
    default:                 return "var(--font-dm-serif)";
  }
}

/* ─── Metadata (static default; can be overridden per page) ── */
export const metadata: Metadata = {
  title: "Triade Select — Uniformes para Barbearias",
  description:
    "Capas, uniformes e aventais personalizados para barbearias profissionais. Qualidade premium, entrega em todo o Brasil.",
  keywords: "capa barbearia, uniforme barbearia, avental barbearia, personalizado",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tokens = await getDesignTokens();

  const accentColor  = tokens["design_accent_color"]  || "#A8823A";
  const displayFont  = tokens["design_display_font"]  || "DM Serif Display";
  const borderRadius = tokens["design_border_radius"] || "4";
  const theme        = tokens["design_theme"]         || "light";

  const radius     = Math.max(0, Math.min(20, parseInt(borderRadius) || 4));
  const fontVar    = fontVarForName(displayFont);

  // Build CSS override string
  const cssOverride = `
    :root {
      --gold: ${accentColor};
      --font-display: ${fontVar}, serif;
      --r-xs: ${Math.max(0, radius - 2)}px;
      --r-sm: ${radius}px;
      --r-md: ${radius * 2}px;
      --r-lg: ${radius * 3}px;
    }
  `;

  const fontClasses = [
    fraunces.variable,
    interTight.variable,
    jetbrainsMono.variable,
    playfair.variable,
    dmSerif.variable,
    oswald.variable,
  ].join(" ");

  return (
    <html lang="pt-BR" className={fontClasses} data-theme={theme}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: cssOverride }} />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--ink)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
