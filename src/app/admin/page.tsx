import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, DollarSign, Clock, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    totalOrders,
    pendingOrders,
    inProductionOrders,
    totalRevenue,
    lateOrders,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "RECEBIDO" } }),
    prisma.order.count({ where: { status: "EM_PRODUCAO" } }),
    prisma.order.aggregate({ _sum: { total: true } }),
    // Pedidos atrasados: em produção há mais de 15 dias
    prisma.order.count({
      where: {
        status: { in: ["ACEITO", "EM_PRODUCAO"] },
        createdAt: {
          lte: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } } },
    }),
  ]);

  const stats = [
    {
      label: "Total de pedidos",
      value: totalOrders,
      icon: ShoppingBag,
      color: "#c9a84c",
    },
    {
      label: "Receita total",
      value: formatCurrency(totalRevenue._sum.total ?? 0),
      icon: DollarSign,
      color: "#22c55e",
    },
    {
      label: "Aguardando confirmação",
      value: pendingOrders,
      icon: Clock,
      color: "#3b82f6",
    },
    {
      label: "Pedidos atrasados",
      value: lateOrders,
      icon: AlertTriangle,
      color: lateOrders > 0 ? "#ef4444" : "#22c55e",
    },
  ];

  const STATUS_COLORS: Record<string, string> = {
    RECEBIDO: "#6B7280",
    ACEITO: "#3B82F6",
    EM_PRODUCAO: "#F59E0B",
    ENVIADO: "#8B5CF6",
    ENTREGUE: "#10B981",
    CANCELADO: "#EF4444",
  };
  const STATUS_LABELS: Record<string, string> = {
    RECEBIDO: "Recebido",
    ACEITO: "Aceito",
    EM_PRODUCAO: "Em Produção",
    ENVIADO: "Enviado",
    ENTREGUE: "Entregue",
    CANCELADO: "Cancelado",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text)] mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[var(--text-muted)] font-medium">{label}</p>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Alerta de atrasos */}
      {lateOrders > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-400">
              {lateOrders} pedido{lateOrders > 1 ? "s" : ""} atrasado{lateOrders > 1 ? "s" : ""}!
            </p>
            <p className="text-sm text-red-400/70">
              Pedidos em produção há mais de 15 dias.
            </p>
          </div>
        </div>
      )}

      {/* Pedidos recentes */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="font-bold text-[var(--text)]">Pedidos Recentes</h2>
          <a href="/admin/pedidos" className="text-xs text-[var(--gold)] hover:underline">
            Ver todos →
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Pedido", "Cliente", "Total", "Status", "Data"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const color = STATUS_COLORS[order.status];
                return (
                  <tr key={order.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-5 py-3 font-mono font-semibold text-[var(--gold)]">
                      #{order.orderNumber}
                    </td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{order.user.name}</td>
                    <td className="px-5 py-3 font-bold text-[var(--text)]">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
                      >
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
        </div>
      </div>
    </div>
  );
}
