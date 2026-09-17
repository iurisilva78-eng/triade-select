import { Header } from "@/components/layout/header";

const WA_NUMBER = "5543988656471";
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent("Olá! Vim pelo site da Triade Select e gostaria de mais informações.")}`;

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

      {/* Botão flutuante WhatsApp */}
      <a
        href={WA_LINK}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        style={{
          position: "fixed",
          bottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
          right: 24,
          zIndex: 999,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#25D366",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(37,211,102,.45), 0 2px 6px rgba(0,0,0,.18)",
          transition: "transform .2s, box-shadow .2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.08)";
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 24px rgba(37,211,102,.55), 0 2px 8px rgba(0,0,0,.22)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 16px rgba(37,211,102,.45), 0 2px 6px rgba(0,0,0,.18)";
        }}
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden>
          <path
            d="M16 3C8.82 3 3 8.82 3 16c0 2.3.62 4.56 1.8 6.52L3 29l6.68-1.75A13 13 0 0016 29c7.18 0 13-5.82 13-13S23.18 3 16 3z"
            fill="#fff"
          />
          <path
            d="M22.5 19.4c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.2-.24-.57-.49-.49-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"
            fill="#25D366"
          />
        </svg>
      </a>

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
