"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle, ShoppingBag, ArrowRight, Clock, MessageCircle } from "lucide-react";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types";
import type { OrderStatus } from "@prisma/client";

interface OrderItem {
  quantity: number;
  unitPrice: number;
  hasCustomization: boolean;
  logoFileName?: string;
  selectedColor?: string;
  selectedSize?: string;
  selectedClosure?: string;
  product: { name: string };
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  freightCost: number;
  total: number;
  paidAmount: number;
  shippingService?: string;
  createdAt: string;
  items: OrderItem[];
}

const NEXT_STEPS = [
  { icon: "💳", title: "Realize o pagamento mínimo (50%)", desc: "Faça o PIX ou transferência. O comprovante pode ser enviado pelo WhatsApp." },
  { icon: "📲", title: "Confirmação pelo WhatsApp", desc: "Assim que identificarmos o pagamento, você receberá uma mensagem confirmando." },
  { icon: "⚙️", title: "Produção em ~15 dias úteis", desc: "Sua peça é produzida com cuidado após confirmação do pagamento." },
  { icon: "📦", title: "Envio com rastreamento", desc: "Você será avisado pelo WhatsApp com o código de rastreio quando o pedido sair." },
];

export default function PedidoSucessoPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data) => { if (data.error) setError(data.error); else setOrder(data); })
      .catch(() => setError("Erro ao carregar pedido."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-red-400 text-lg font-semibold mb-4">Pedido não encontrado.</p>
        <Link href="/pedidos" className="text-[var(--gold)] hover:underline">Ver meus pedidos</Link>
      </div>
    );
  }

  const minimum = order.total * 0.5;
  const remaining = Math.max(0, order.total - order.paidAmount);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Sucesso */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-500/40">
          <CheckCircle size={42} className="text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-[var(--text)] mb-1">Pedido realizado!</h1>
        <p className="text-[var(--text-secondary)]">
          Pedido <span className="font-bold text-[var(--gold)]">#{order.orderNumber}</span> recebido com sucesso.
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">{formatDate(order.createdAt)}</p>
      </div>

      {/* Itens */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
        <h2 className="font-bold text-[var(--text)] mb-4 flex items-center gap-2">
          <ShoppingBag size={16} className="text-[var(--gold)]" /> Itens do pedido
        </h2>
        <div className="flex flex-col gap-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-3 pb-3 last:pb-0 border-b border-[var(--border)] last:border-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text)] text-sm">{item.product.name} ×{item.quantity}</p>
                {item.hasCustomization && <span className="text-xs text-[var(--gold)]/80">✓ Com personalização</span>}
                {(item.selectedColor || item.selectedSize || item.selectedClosure) && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {[item.selectedColor, item.selectedSize, item.selectedClosure].filter(Boolean).join(" · ")}
                  </p>
                )}
                {item.logoFileName && <p className="text-xs text-[var(--text-muted)]">📎 {item.logoFileName}</p>}
              </div>
              <span className="font-bold text-[var(--gold)] shrink-0 text-sm">{formatCurrency(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Totais */}
        <div className="mt-4 pt-4 border-t border-[var(--border)] space-y-1.5 text-sm">
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Frete {order.shippingService ? `(${order.shippingService})` : ""}</span>
            <span>{formatCurrency(order.freightCost)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-[var(--border)]">
            <span className="text-[var(--text)]">Total</span>
            <span className="text-[var(--gold)]">{formatCurrency(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Pagamento mínimo */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 mb-4">
        <h2 className="font-bold text-amber-300 mb-1">💳 Valor mínimo para iniciar produção</h2>
        <p className="text-3xl font-bold text-amber-300">{formatCurrency(minimum)}</p>
        <p className="text-xs text-amber-400 mt-1">50% do total — necessário para darmos início</p>
        {remaining > 0 && (
          <p className="text-xs text-amber-400 mt-0.5">Saldo restante após produção: {formatCurrency(remaining)}</p>
        )}
      </div>

      {/* Próximos passos */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-4">
        <h2 className="font-bold text-[var(--text)] mb-4 flex items-center gap-2">
          <Clock size={16} className="text-[var(--gold)]" /> Próximos passos
        </h2>
        <div className="flex flex-col gap-4">
          {NEXT_STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[var(--surface-2)] border border-[var(--border)] rounded-full flex items-center justify-center shrink-0 text-base">
                {step.icon}
              </div>
              <div>
                <p className="font-semibold text-[var(--text)] text-sm">{step.title}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA - Meus Pedidos */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 text-center">
        <MessageCircle size={32} className="text-[var(--gold)] mx-auto mb-2" />
        <h2 className="font-bold text-[var(--text)] mb-1">Acompanhe seu pedido</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Veja o status, histórico de atualizações e todos os detalhes em{" "}
          <strong className="text-[var(--text)]">Meus Pedidos</strong>. Todas as atualizações também chegam pelo WhatsApp 📲
        </p>
        <Link
          href="/pedidos"
          className="inline-flex items-center gap-2 bg-[var(--gold)] text-black font-bold px-6 py-3 rounded-xl hover:bg-amber-400 transition-colors"
        >
          Ver meus pedidos <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
