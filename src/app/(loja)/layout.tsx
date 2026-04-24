import { Header } from "@/components/layout/header";

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Announcement Bar */}
      <div
        className="flex items-center justify-center gap-4 overflow-hidden shrink-0"
        style={{ background: "var(--ink)", color: "var(--bg)", height: 36 }}
      >
        <span className="t-mono text-[10px] tracking-[0.12em] uppercase hidden sm:block">
          Frete grátis acima de R$ 500
        </span>
        <span className="opacity-30 hidden sm:block">●</span>
        <span className="t-mono text-[10px] tracking-[0.12em] uppercase">
          Personalização gratuita com seu logo
        </span>
        <span className="opacity-30 hidden sm:block">●</span>
        <span className="t-mono text-[10px] tracking-[0.12em] uppercase hidden sm:block">
          Prazo 15 dias úteis
        </span>
      </div>

      <Header />
      <main className="flex-1">{children}</main>

      <footer
        className="px-5 md:px-8 py-8"
        style={{ borderTop: "1px solid var(--line-soft)", background: "var(--bg)" }}
      >
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="t-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: "var(--muted)" }}>
            © {new Date().getFullYear()} Triade Select
          </p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Capas, uniformes e aventais para barbearias profissionais
          </p>
        </div>
      </footer>
    </div>
  );
}
