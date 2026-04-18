import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProducaoPage() {
  const orders = await prisma.order.findMany({
    where: { status: { in: ["ACEITO", "EM_PRODUCAO"] } },
    include: {
      items: { include: { product: { select: { name: true, images: true } } } },
      user: { select: { name: true, phone: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const now = Date.now();
  const fifteenDays = 15 * 24 * 60 * 60 * 1000;

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Fila de Produção</h1>
      <p className="text-[var(--text-secondary)] text-sm mb-6">
        {orders.length} pedido{orders.length !== 1 ? "s" : ""} na fila
      </p>

      {orders.length === 0 ? (
        <div className="text-center py-16 text-[var(--text-muted)]">
          <p className="text-5xl mb-4">✅</p>
          <p className="text-lg font-semibold">Nenhum pedido em produção</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const createdAt = new Date(order.createdAt);
            const daysElapsed = Math.floor((now - createdAt.getTime()) / (24 * 60 * 60 * 1000));
            const daysLeft = 15 - daysElapsed;
            const isLate = daysElapsed > 15;
            const progressPct = Math.min((daysElapsed / 15) * 100, 100);

            return (
              <div
                key={order.id}
                className={`bg-[var(--surface)] border rounded-2xl p-5 ${isLate ? "border-red-500/50" : "border-[var(--border)]"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-[var(--gold)] text-lg">
                        #{order.orderNumber}
                      </span>
                      {isLate && (
                        <span className="flex items-center gap-1 text-xs text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded-full">
                          <AlertTriangle size={10} /> ATRASADO
                        </span>
                      )}
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={
                          order.status === "EM_PRODUCAO"
                            ? { backgroundColor: "#F59E0B20", color: "#F59E0B" }
                            : { backgroundColor: "#3B82F620", color: "#3B82F6" }
                        }
                      >
                        {order.status === "EM_PRODUCAO" ? "Em Produção" : "Aceito"}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)]">{order.user.name}</p>
                    {order.user.phone && (
                      <p className="text-xs text-[var(--text-muted)]">📱 {order.user.phone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--gold)]">{formatCurrency(order.total)}</p>
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] justify-end mt-1">
                      <Clock size={10} />
                      {isLate
                        ? `${daysElapsed - 15} dias de atraso`
                        : daysLeft === 0
                        ? "Prazo hoje!"
                        : `${daysLeft} dias restantes`}
                    </div>
                  </div>
                </div>

                {/* Barra de progresso */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mb-1">
                    <span>Dia {daysElapsed}</span>
                    <span>Prazo: 15 dias</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progressPct}%`,
                        backgroundColor: isLate ? "#ef4444" : progressPct > 80 ? "#f59e0b" : "#c9a84c",
                      }}
                    />
                  </div>
                </div>

                {/* Itens */}
                <div className="flex flex-col gap-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-[var(--surface-2)] rounded-xl px-3 py-2">
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg)] flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                        {item.product.images[0] ? (
                          <img src={item.product.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : "🧣"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text)] truncate">{item.product.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">Quantidade: {item.quantity}</p>
                      </div>
                      {item.hasCustomization && (
                        <span className="text-xs text-[var(--gold)] flex-shrink-0">✓ Logo</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
