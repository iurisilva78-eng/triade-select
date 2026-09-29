import { NextRequest, NextResponse } from "next/server";
import { lancarPagamento } from "@/lib/financeiro/servidor";
import { erro, exigirAdmin } from "../_auth";

export const dynamic = "force-dynamic";

/** Pagamento de pedido que não apareceu em nenhum extrato. */
export async function POST(req: NextRequest) {
  const negado = await exigirAdmin(); if (negado) return negado;
  const { pagamentoId, destino } = await req.json();
  if (!pagamentoId || !["caixa", "socio"].includes(destino)) return erro("Dados inválidos.", undefined, 400);
  try { return NextResponse.json(await lancarPagamento(pagamentoId, destino)); } catch (e) { return erro("Erro ao lançar.", e); }
}
