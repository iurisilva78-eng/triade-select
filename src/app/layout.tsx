import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Triade Select — Uniformes para Barbearias",
  description:
    "Capas, uniformes e aventais personalizados para barbearias profissionais. Qualidade, elegância e entrega em todo o Brasil.",
  keywords: "capa barbearia, uniforme barbearia, avental barbearia, personalizado",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={geist.variable}>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
