"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: { product: { name: string } }[];
}

export default function PedidosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/orders")
        .then((r) => r.json())
        .then((data) => { setOrders(data); setLoading(false); });
    }
  }, [session]);

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-6">Meus Pedidos</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={64} className="mx-auto text-[var(--text-muted)] mb-4" />
          <p className="text-xl font-bold text-[var(--text)] mb-2">Nenhum pedido ainda</p>
          <p className="text-[var(--text-secondary)] mb-6">Faça seu primeiro pedido!</p>
          <Link href="/produtos">
            <button className="px-6 py-3 bg-[var(--gold)] text-black font-bold rounded-xl hover:bg-[var(--gold-light)] transition-colors">
              Ver produtos
            </button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const color = ORDER_STATUS_COLORS[order.status as keyof typeof ORDER_STATUS_COLORS];
            const label = ORDER_STATUS_LABELS[order.status as keyof typeof ORDER_STATUS_LABELS];
            return (
              <Link key={order.id} href={`/pedido/${order.id}`}>
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--gold)]/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-[var(--text)]">#{order.orderNumber}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatDate(order.createdAt)}</p>
                    </div>
                    <Badge color={color}>{label}</Badge>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] mb-3">
                    {order.items.map((i) => i.product.name).join(", ")}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-[var(--gold)]">
                      {formatCurrency(order.total)}
                    </span>
                    <span className="text-xs text-[var(--gold)]">Ver detalhes →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
