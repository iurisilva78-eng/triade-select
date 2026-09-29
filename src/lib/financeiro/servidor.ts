// Acesso ao banco do Financeiro. Só roda no servidor (rotas /api/admin/financeiro).
import { prisma } from "@/lib/prisma";
import { lerOfx } from "./ofx.ts";
import { CATEGORIAS, CONTAS, REGRAS } from "./padroes.ts";
import { chavesDedup, classificar } from "./regras.ts";
import { normalizar, somarMeses } from "./texto.ts";

const DIA = 86_400_000;

export function intervaloMes(mes: string) {
  return { gte: new Date(`${mes}-01T00:00:00Z`), lt: new Date(`${somarMeses(mes, 1)}-01T00:00:00Z`) };
}

export const isoData = (d: Date) => d.toISOString().slice(0, 10);

/** Cria contas, categorias e regras iniciais que ainda não existem. Idempotente. */
export async function garantirPadroes() {
  if ((await prisma.finConta.count()) > 0) return;
  await prisma.$transaction(async (tx) => {
    for (const c of CONTAS) {
      await tx.finConta.upsert({ where: { nome: c.nome }, update: {}, create: { ...c } });
    }
    for (const [i, c] of CATEGORIAS.entries()) {
      await tx.finCategoria.upsert({ where: { nome: c.nome }, update: {}, create: { ...c, ordem: i } });
    }
    const cats = await tx.finCategoria.findMany();
    const id = Object.fromEntries(cats.map((c) => [c.nome, c.id]));
    for (const [cat, padroes] of Object.entries(REGRAS)) {
      for (const p of padroes) {
        await tx.finRegra.upsert({ where: { padrao: p }, update: {}, create: { padrao: p, categoriaId: id[cat] } });
      }
    }
  });
}

export async function meta() {
  await garantirPadroes();
  const [contas, categorias] = await Promise.all([
    prisma.finConta.findMany({ orderBy: { ordem: "asc" } }),
    prisma.finCategoria.findMany({ orderBy: { ordem: "asc" } }),
  ]);
  return { contas, categorias };
}

// ─── Resumo do mês ──────────────────────────────────────────────────────────

export async function resumo(mes: string) {
  await garantirPadroes();
  await conciliarPedidos(mes);
  const { contas, categorias } = await meta();
  const tipoCat = Object.fromEntries(categorias.map((c) => [c.id, c.tipo]));
  const nomeCat = Object.fromEntries(categorias.map((c) => [c.id, c.nome]));

  const doMes = await prisma.finLancamento.findMany({ where: { data: intervaloMes(mes) } });
  const ate = intervaloMes(mes).lt;
  const saldos = await prisma.finLancamento.groupBy({
    by: ["contaId"], where: { data: { lt: ate } }, _sum: { valor: true },
  });
  const saldo = Object.fromEntries(saldos.map((s) => [s.contaId, s._sum.valor ?? 0]));

  let entradas = 0, saidas = 0, retiradas = 0, semCategoria = 0;
  const porCategoria = new Map<string, number>();
  for (const l of doMes) {
    const tipo = l.categoriaId ? tipoCat[l.categoriaId] : null;
    if (!tipo) { semCategoria++; continue; }
    if (tipo === "RECEITA") entradas += l.valor;
    else if (tipo === "DESPESA") saidas += -l.valor;
    else if (tipo === "RETIRADA") retiradas += -l.valor;
    if (tipo === "RECEITA" || tipo === "DESPESA") {
      porCategoria.set(l.categoriaId!, (porCategoria.get(l.categoriaId!) ?? 0) + l.valor);
    }
  }

  const socio = contas.find((c) => c.tipo === "SOCIO");
  return {
    mes,
    entradas, saidas, resultado: entradas - saidas, retiradas, semCategoria,
    contas: contas.map((c) => ({ id: c.id, nome: c.nome, tipo: c.tipo, saldo: saldo[c.id] ?? 0 })),
    // saldo < 0: a empresa deve ao sócio; > 0: o sócio está com dinheiro da empresa
    socio: socio ? { id: socio.id, nome: socio.nome, saldo: saldo[socio.id] ?? 0 } : null,
    porCategoria: [...porCategoria.entries()]
      .map(([id, valor]) => ({ id, nome: nomeCat[id], tipo: tipoCat[id], valor }))
      .sort((a, b) => a.valor - b.valor),
    pedidos: await pedidosDoMes(mes),
  };
}

// ─── Pedidos do site x extrato ──────────────────────────────────────────────
// O extrato é a verdade do que entrou em cada conta. Pagamento de pedido não
// vira entrada sozinho (contaria duas vezes): ele é procurado nos extratos.

async function pagamentosDoMes(mes: string) {
  return prisma.payment.findMany({
    where: { confirmedAt: intervaloMes(mes), status: { not: "REEMBOLSADO" } },
    include: { order: { select: { orderNumber: true, user: { select: { name: true } } } } },
    orderBy: { confirmedAt: "asc" },
  });
}

/** Liga cada pagamento de pedido a uma entrada de mesmo valor, até 3 dias antes
 *  ou 5 depois, em qualquer conta. Entrada sem categoria vira "Vendas — site". */
export async function conciliarPedidos(mes: string) {
  const pagamentos = await pagamentosDoMes(mes);
  if (!pagamentos.length) return;
  const vendasSite = await prisma.finCategoria.findUnique({ where: { nome: "Vendas — site" } });
  for (const p of pagamentos) {
    const ja = await prisma.finLancamento.findFirst({ where: { obs: `pagamento:${p.id}` } });
    if (ja) continue;
    const quando = p.confirmedAt ?? p.createdAt;
    const alvo = await prisma.finLancamento.findFirst({
      where: {
        valor: Math.round(p.amount * 100),
        pedidoId: null,
        data: { gte: new Date(quando.getTime() - 3 * DIA), lte: new Date(quando.getTime() + 5 * DIA) },
      },
      orderBy: { data: "asc" },
    });
    if (!alvo) continue;
    await prisma.finLancamento.update({
      where: { id: alvo.id },
      data: {
        pedidoId: p.orderId,
        obs: `pagamento:${p.id}`,
        categoriaId: alvo.categoriaId ?? vendasSite?.id,
      },
    });
  }
}

async function pedidosDoMes(mes: string) {
  const pagamentos = await pagamentosDoMes(mes);
  const ligados = await prisma.finLancamento.findMany({
    where: { obs: { in: pagamentos.map((p) => `pagamento:${p.id}`) } },
    include: { conta: { select: { nome: true } } },
  });
  const porPag = Object.fromEntries(ligados.map((l) => [l.obs!.slice(10), l]));
  return pagamentos.map((p) => ({
    pagamentoId: p.id,
    pedido: p.order.orderNumber,
    cliente: p.order.user?.name ?? "",
    valor: Math.round(p.amount * 100),
    metodo: p.method,
    data: isoData(p.confirmedAt ?? p.createdAt),
    encontradoEm: porPag[p.id] ? { conta: porPag[p.id].conta.nome, data: isoData(porPag[p.id].data) } : null,
  }));
}

/** Pagamento de pedido que não apareceu em extrato: dinheiro vivo ou caiu na
 *  conta pessoal do sócio (aí o sócio fica com dinheiro da empresa). */
export async function lancarPagamento(pagamentoId: string, destino: "caixa" | "socio") {
  const p = await prisma.payment.findUniqueOrThrow({
    where: { id: pagamentoId }, include: { order: { select: { orderNumber: true } } },
  });
  const conta = await prisma.finConta.findFirstOrThrow({ where: { tipo: destino === "caixa" ? "CAIXA" : "SOCIO" } });
  const cat = await prisma.finCategoria.findUnique({ where: { nome: "Vendas — site" } });
  return prisma.finLancamento.create({
    data: {
      contaId: conta.id,
      data: p.confirmedAt ?? p.createdAt,
      descricao: `Pedido ${p.order.orderNumber}${destino === "socio" ? " (caiu na conta pessoal)" : " (dinheiro)"}`,
      valor: Math.round(p.amount * 100),
      categoriaId: cat?.id,
      origem: "pedido",
      pedidoId: p.orderId,
      obs: `pagamento:${p.id}`,
    },
  });
}

// ─── Importação de OFX ──────────────────────────────────────────────────────

export interface ItemPrevia {
  data: string; descricao: string; valor: number; chave: string;
  categoriaId: string | null; jaExiste: boolean; incluir: boolean;
}

/** Lê o OFX e mostra o que entraria. Na conta do sócio (cartão pessoal), só vem
 *  marcado o que alguma regra reconhece como da empresa. */
export async function previa(contaId: string, bytes: Uint8Array) {
  await garantirPadroes();
  const conta = await prisma.finConta.findUniqueOrThrow({ where: { id: contaId } });
  const extrato = lerOfx(bytes);
  const regras = await prisma.finRegra.findMany();
  const chaves = chavesDedup(extrato.transacoes);
  const existentes = new Set(
    (await prisma.finLancamento.findMany({ where: { contaId, chave: { in: chaves } }, select: { chave: true } }))
      .map((l) => l.chave),
  );
  const itens: ItemPrevia[] = extrato.transacoes.map((t, i) => {
    const categoriaId = classificar(t.descricao, regras);
    const jaExiste = existentes.has(chaves[i]);
    const incluir = !jaExiste && (conta.tipo !== "SOCIO" || categoriaId !== null);
    return { data: t.data, descricao: t.descricao, valor: t.valor, chave: chaves[i], categoriaId, jaExiste, incluir };
  });
  const saldoSistema = (await prisma.finLancamento.aggregate({ where: { contaId }, _sum: { valor: true } }))._sum.valor ?? 0;
  return { conta: { id: conta.id, nome: conta.nome, tipo: conta.tipo }, cartao: extrato.cartao, saldoOfx: extrato.saldo ?? null, saldoSistema, itens };
}

export async function confirmarImportacao(contaId: string, itens: Omit<ItemPrevia, "jaExiste" | "incluir">[]) {
  const r = await prisma.finLancamento.createMany({
    data: itens.map((t) => ({
      contaId, data: new Date(`${t.data}T00:00:00Z`), descricao: t.descricao, valor: t.valor,
      categoriaId: t.categoriaId, origem: "ofx", chave: t.chave,
    })),
    skipDuplicates: true,
  });
  return r.count;
}

// ─── Regras aprendidas ──────────────────────────────────────────────────────

/** Grava "esta descrição é desta categoria" e aplica nos lançamentos sem categoria. */
export async function lembrarRegra(descricao: string, categoriaId: string) {
  const padrao = normalizar(descricao);
  await prisma.finRegra.upsert({ where: { padrao }, update: { categoriaId }, create: { padrao, categoriaId } });
  const regras = await prisma.finRegra.findMany();
  const semCat = await prisma.finLancamento.findMany({ where: { categoriaId: null } });
  for (const l of semCat) {
    const cat = classificar(l.descricao, regras);
    if (cat) await prisma.finLancamento.update({ where: { id: l.id }, data: { categoriaId: cat } });
  }
}
