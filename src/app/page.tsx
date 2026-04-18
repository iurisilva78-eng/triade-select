import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Scissors, Clock, Truck, Shield } from "lucide-react";

const features = [
  { icon: Scissors, title: "Feito sob encomenda", desc: "Cada produto produzido com atenção e qualidade para a sua barbearia." },
  { icon: Clock, title: "Prazo de 15 dias úteis", desc: "Produção e entrega com prazo garantido após confirmação de pagamento." },
  { icon: Truck, title: "Entrega em todo o Brasil", desc: "Envio pelos Correios (PAC e SEDEX) para qualquer cidade." },
  { icon: Shield, title: "Qualidade garantida", desc: "Materiais profissionais selecionados para o dia a dia da barbearia." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 py-20 text-center">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded-full px-4 py-1.5 text-sm text-[var(--gold)] font-medium mb-6">
            ✂️ Uniformes profissionais para barbearias
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-[var(--text)] leading-tight mb-5">
            Equipamentos que refletem o{" "}
            <span className="text-[var(--gold)]">profissionalismo</span>{" "}
            da sua barbearia
          </h1>
          <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
            Capas, uniformes e aventais personalizados com o logo da sua barbearia.
            Qualidade premium, entrega em todo o Brasil.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/produtos">
              <Button size="lg" className="w-full sm:w-auto">
                Ver produtos
              </Button>
            </Link>
            <Link href="/cadastro">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Criar conta grátis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-[var(--border)] py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center mx-auto mb-3">
                <Icon size={20} className="text-[var(--gold)]" />
              </div>
              <h3 className="font-semibold text-[var(--text)] mb-1">{title}</h3>
              <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-6 px-4 text-center text-[var(--text-muted)] text-sm">
        © {new Date().getFullYear()} Triade Select — Todos os direitos reservados
      </footer>
    </div>
  );
}
