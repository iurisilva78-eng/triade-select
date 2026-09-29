import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { erro, exigirAdmin } from "../_auth";

export const dynamic = "force-dynamic";

/** Dinheiro que muda de conta sem ser receita nem despesa: entre as PJ, depósito
 *  do caixa, reembolso ao sócio (PJ -> Iuri) ou sócio devolvendo (Iuri -> PJ). */
export async function POST(req: NextRequest) {
  const negado = await exigirAdmin(); if (negado) return negado;
  const { deId, paraId, data, valor, descricao } = await req.json();
  if (!deId || !paraId || deId === paraId || !data || !Number.isInteger(valor) || valor <= 0) {
    return erro("Escolha duas contas diferentes, a data e um valor positivo.", undefined, 400);
  }
  const cat = await prisma.finCategoria.findUnique({ where: { nome: "Transferência entre contas" } });
  const [de, para] = await Promise.all([
    prisma.finConta.findUniqueOrThrow({ where: { id: deId } }),
    prisma.finConta.findUniqueOrThrow({ where: { id: paraId } }),
  ]);
  const transferenciaId = randomUUID();
  const dia = new Date(`${data}T00:00:00Z`);
  const texto = descricao?.trim() || `Transferência ${de.nome} → ${para.nome}`;
  try {
    await prisma.finLancamento.createMany({
      data: [
        { contaId: deId, data: dia, descricao: texto, valor: -valor, categoriaId: cat?.id, transferenciaId },
        { contaId: paraId, data: dia, descricao: texto, valor, categoriaId: cat?.id, transferenciaId },
      ],
    });
    return NextResponse.json({ ok: true });
  } catch (e) { return erro("Erro ao salvar a transferência.", e); }
}
