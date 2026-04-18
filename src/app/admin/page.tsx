import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, DollarSign, Clock, AlertTriangle, CheckCircle, XCircle, Factory, Truck } from "lucide-react";
import { DateFilter } from "@/components/admin/DateFilter";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  RECEBIDO: "#6B7280", ACEITO: "#3B82F6", EM_PRODUCAO: "#F59E0B",
  ENVIADO: "#8B5CF6", ENTREGUE: "#10B981", CANCELADO: "#EF4444",
};
const STATUS_LABELS: Record<string, string> = {
  RECEBIDO: "Recebido", ACEITO: "Aceito", EM_PRODUCAO: "Em Produção",
  ENVIADO: "Enviado", ENTREGUE: "Entregue", CANCELADO: "Cancelado",
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;

  const dateFilter =
    from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to + "T23:59:59") } : {}),
          },
        }
      : {};

  const [
    totalOrders, pendingOrders, inProductionOrders, shippedOrders,
    deliveredOrders, cancelledOrders, lateOrders, revenueResult, recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: dateFilter }),
    prisma.order.count({ where: { ...dateFilter, status: "RECEBIDO" } }),
    prisma.order.count({ where: { ...dateFilter, status: "EM_PRODUCAO" } }),
    prisma.order.count({ where: { ...dateFilter, status: "ENVIADO" } }),
    prisma.order.count({ where: { ...dateFilter, status: "ENTREGUE" } }),
    prisma.order.count({ where: { ...dateFilter, status: "CANCELADO" } }),
    prisma.order.count({
      where: {
        status: { in: ["ACEITO", "EM_PRODUCAO"] },
        createdAt: { lte: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { ...dateFilter, status: { notIn: ["CANCELADO"] } },
    }),
    prisma.order.findMany({
      take: 10, orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
      where: dateFilter,
    }),
  ]);

  const totalRevenue = revenueResult._sum.total ?? 0;

  const mainStats = [
    { label: "Receita confirmada", value: formatCurrency(totalRevenue), icon: DollarSign, color: "#22c55e" },
    { label: "Total de pedidos", value: totalOrders, icon: ShoppingBag, color: "#c9a84c" },
    { label: "Aguardando confirmação", value: pendingOrders, icon: Clock, color: "#3b82f6" },
    { label: "Pedidos atrasados", value: lateOrders, icon: AlertTriangle, color: lateOrders > 0 ? "#ef4444" : "#22c55e" },
  ];

  const secondaryStats = [
    { label: "Em produção", value: inProductionOrders, icon: Factory, color: "#f59e0b" },
    { label: "Enviados", value: shippedOrders, icon: Truck, color: "#8b5cf6" },
    { label: "Entregues", value: deliveredOrders, icon: CheckCircle, color: "#10b981" },
    { label: "Cancelados", value: cancelledOrders, icon: XCircle, color: "#ef4444" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Dashboard</h1>
        {(from || to) && (
          <span className="text-xs text-[var(--gold)] bg-[var(--gold)]/10 border border-[var(--gold)]/30 px-3 py-1 rounded-full">
            Período filtrado
          </span>
        )}
      </div>

      {/* Filtro de data */}
      <Suspense>
        <DateFilter />
      </Suspense>

      {/* Stats principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {mainStats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[var(--text-muted)] font-medium">{label}</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Stats secundárias */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {secondaryStats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} style={{ color }} />
              <p className="text-xs text-[var(--text-muted)] font-medium">{label}</p>
            </div>
            <p className="text-xl font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Alerta de atrasos */}
      {lateOrders > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
          <p className="font-semibold text-red-400">
            {lateOrders} pedido{lateOrders > 1 ? "s" : ""} atrasado{lateOrders > 1 ? "s" : ""} — em produção há mais de 15 dias.
          </p>
        </div>
      )}

      {/* Pedidos recentes */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-bold text-[var(--text)]">Pedidos Recentes</h2>
          <a href="/admin/pedidos" className="text-xs text-[var(--gold)] hover:underline">Ver todos →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Pedido", "Cliente", "Total", "Status", "Data"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const color = STATUS_COLORS[order.status];
                return (
                  <tr key={order.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-5 py-3 font-mono font-semibold text-[var(--gold)]">#{order.orderNumber}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{order.user.name}</td>
                    <td className="px-5 py-3 font-bold text-[var(--text)]">{formatCurrency(order.total)}</td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--text-muted)]">
                      {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {recentOrders.length === 0 && (
            <div className="text-center py-12 text-[var(--text-muted)]">Nenhum pedido no período.</div>
          )}
        </div>
      </div>
    </div>
  );
}
