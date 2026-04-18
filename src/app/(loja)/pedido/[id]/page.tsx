"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_STATUS_FLOW } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Package, Truck, MapPin } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  freightCost: number;
  paidAmount: number;
  trackingCode?: string;
  shippingService?: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    unitPrice: number;
    hasCustomization: boolean;
    logoFileName?: string;
    product: { name: string; images: string[] };
  }[];
  statusHistory: { status: string; note?: string; createdAt: string }[];
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  RECEBIDO: <Package size={16} />,
  ACEITO: <Check size={16} />,
  EM_PRODUCAO: <Clock size={16} />,
  ENVIADO: <Truck size={16} />,
  ENTREGUE: <Check size={16} />,
};

export default function PedidoPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetch(`/api/orders/${id}`)
        .then((r) => r.json())
        .then((data) => { setOrder(data); setLoading(false); });
    }
  }, [id, session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-20 text-[var(--text-muted)]">Pedido não encontrado.</div>;
  }

  const statusColor = ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS];
  const statusLabel = ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS];
  const currentStep = ORDER_STATUS_FLOW.indexOf(order.status as any);
  const minimumPayment = order.total * 0.5;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Pedido #{order.orderNumber}</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <Badge color={statusColor}>{statusLabel}</Badge>
      </div>

      {/* Barra de progresso */}
      {order.status !== "CANCELADO" && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-4">Acompanhamento</h2>
          <div className="flex items-center justify-between relative">
            {/* Linha de progresso */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-[var(--border)]" />
            <div
              className="absolute top-4 left-4 h-0.5 bg-[var(--gold)] transition-all duration-500"
              style={{ width: currentStep > 0 ? `${(currentStep / (ORDER_STATUS_FLOW.length - 1)) * 100}%` : "0%" }}
            />

            {ORDER_STATUS_FLOW.map((step, idx) => {
              const done = idx <= currentStep;
              const active = idx === currentStep;
              const color = ORDER_STATUS_COLORS[step];
              return (
                <div key={step} className="flex flex-col items-center gap-1 z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      done
                        ? "bg-[var(--gold)] border-[var(--gold)] text-black"
                        : "bg-[var(--bg)] border-[var(--border)] text-[var(--text-muted)]"
                    }`}
                  >
                    {STATUS_ICONS[step]}
                  </div>
                  <p
                    className={`text-xs font-medium text-center max-w-[60px] leading-tight ${
                      active ? "text-[var(--gold)]" : done ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
                    }`}
                  >
                    {ORDER_STATUS_LABELS[step]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rastreio */}
      {order.trackingCode && (
        <div className="bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded-2xl p-4 mb-6">
          <p className="text-sm font-semibold text-[var(--gold)] mb-1">
            <Truck size={14} className="inline mr-1" /> Código de rastreio
          </p>
          <p className="text-lg font-mono font-bold text-[var(--text)]">{order.trackingCode}</p>
          <a
            href={`https://rastreamento.correios.com.br/app/index.php`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--gold)] hover:underline mt-1 block"
          >
            Rastrear nos Correios →
          </a>
        </div>
      )}

      {/* Pagamento */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
        <h2 className="font-bold text-[var(--text)] mb-3">Pagamento</h2>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Frete ({order.shippingService})</span>
            <span>{formatCurrency(order.freightCost)}</span>
          </div>
          <div className="flex justify-between font-bold text-[var(--text)] text-base pt-2 border-t border-[var(--border)]">
            <span>Total</span>
            <span className="text-[var(--gold)]">{formatCurrency(order.total)}</span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Pago</span>
            <span className="text-green-400">{formatCurrency(order.paidAmount)}</span>
          </div>
          <div className="flex justify-between text-amber-300 font-medium">
            <span>Mínimo para produção (50%)</span>
            <span>{formatCurrency(minimumPayment)}</span>
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
        <h2 className="font-bold text-[var(--text)] mb-3">Itens do pedido</h2>
        <div className="flex flex-col gap-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[var(--surface-2)] rounded-xl flex items-center justify-center text-xl overflow-hidden flex-shrink-0">
                {item.product.images[0] ? (
                  <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                ) : "🧣"}
              </div>
              <div className="flex-1">
                <p className="font-medium text-[var(--text)] text-sm">{item.product.name}</p>
                {item.hasCustomization && (
                  <p className="text-xs text-[var(--gold)]">✓ Com personalização</p>
                )}
                {item.logoFileName && (
                  <p className="text-xs text-[var(--text-muted)]">📎 {item.logoFileName}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--text-muted)]">×{item.quantity}</p>
                <p className="font-bold text-[var(--gold)] text-sm">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Endereço */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
        <h2 className="font-bold text-[var(--text)] mb-2 flex items-center gap-2">
          <MapPin size={16} className="text-[var(--gold)]" /> Endereço de entrega
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          {order.street}, {order.number}
          {order.complement ? `, ${order.complement}` : ""} — {order.neighborhood}
          <br />
          {order.city}/{order.state} — CEP {order.cep}
        </p>
      </div>
    </div>
  );
}
