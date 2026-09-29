import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { intervaloMes, lembrarRegra } from "@/lib/financeiro/servidor";
import { erro, exigirAdmin, mesValido } from "../_auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const negado = await exigirAdmin(); if (negado) return negado;
  const p = req.nextUrl.searchParams;
  const mes = mesValido(p.get("mes"));
  if (!mes) return erro("Mês inválido.", undefined, 400);
  const lancamentos = await prisma.finLancamento.findMany({
    where: {
      data: intervaloMes(mes),
      ...(p.get("contaId") ? { contaId: p.get("contaId")! } : {}),
      ...(p.get("semCategoria") === "1" ? { categoriaId: null } : {}),
    },
    orderBy: [{ data: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(lancamentos);
}

/** Lançamento manual: venda no WhatsApp, compra em dinheiro, gasto no cartão pessoal... */
export async function POST(req: NextRequest) {
  const negado = await exigirAdmin(); if (negado) return negado;
  const { contaId, data, descricao, valor, categoriaId, obs } = await req.json();
  if (!contaId || !data || !descricao?.trim() || !Number.isInteger(valor) || valor === 0) {
    return erro("Conta, data, descrição e valor são obrigatórios.", undefined, 400);
  }
  try {
    const l = await prisma.finLancamento.create({
      data: { contaId, data: new Date(`${data}T00:00:00Z`), descricao: descricao.trim(), valor, categoriaId: categoriaId || null, obs: obs || null },
    });
    return NextResponse.json(l);
  } catch (e) { return erro("Erro ao salvar.", e); }
}

/** Muda a categoria (e, com lembrar, grava a regra pra próxima importação). */
export async function PATCH(req: NextRequest) {
  const negado = await exigirAdmin(); if (negado) return negado;
  const { id, categoriaId, lembrar } = await req.json();
  try {
    const l = await prisma.finLancamento.update({ where: { id }, data: { categoriaId: categoriaId || null } });
    if (lembrar && categoriaId) await lembrarRegra(l.descricao, categoriaId);
    return NextResponse.json(l);
  } catch (e) { return erro("Erro ao salvar.", e); }
}

/** Apaga; numa transferência, apaga as duas pontas. */
export async function DELETE(req: NextRequest) {
  const negado = await exigirAdmin(); if (negado) return negado;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return erro("ID obrigatório.", undefined, 400);
  const l = await prisma.finLancamento.findUnique({ where: { id } });
  if (!l) return NextResponse.json({ ok: true });
  await prisma.finLancamento.deleteMany({ where: l.transferenciaId ? { transferenciaId: l.transferenciaId } : { id } });
  return NextResponse.json({ ok: true });
}
