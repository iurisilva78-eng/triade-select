import { Header } from "@/components/layout/header";

export default function LojaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[var(--border)] py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-[var(--text-muted)] text-sm">
          <p>© {new Date().getFullYear()} Triade Select — Todos os direitos reservados</p>
          <p className="mt-1">Capas, uniformes e aventais para barbearias profissionais</p>
        </div>
      </footer>
    </div>
  );
}
