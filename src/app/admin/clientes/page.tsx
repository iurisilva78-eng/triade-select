import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      orders: {
        select: { total: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text)] mb-6">Clientes</h1>

      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {["Nome", "E-mail", "WhatsApp", "Pedidos", "Total gasto", "Cadastro"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const totalSpent = c.orders.reduce((acc, o) => acc + o.total, 0);
                return (
                  <tr key={c.id} className="border-b border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-5 py-3 font-medium text-[var(--text)]">{c.name}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{c.email}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{c.phone ?? "—"}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{c.orders.length}</td>
                    <td className="px-5 py-3 font-bold text-[var(--gold)]">{formatCurrency(totalSpent)}</td>
                    <td className="px-5 py-3 text-[var(--text-muted)]">{formatDate(c.createdAt)}</td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[var(--text-muted)]">
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
