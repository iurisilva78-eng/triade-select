import { NextRequest, NextResponse } from "next/server";
import { confirmarImportacao, previa } from "@/lib/financeiro/servidor";
import { erro, exigirAdmin } from "../_auth";

export const dynamic = "force-dynamic";

/** acao "previa": { contaId, arquivoBase64 } -> o que entraria.
 *  acao "confirmar": { contaId, itens } -> grava (duplicatas são ignoradas). */
export async function POST(req: NextRequest) {
  const negado = await exigirAdmin(); if (negado) return negado;
  const body = await req.json();
  try {
    if (body.acao === "previa") {
      const bytes = Uint8Array.from(Buffer.from(body.arquivoBase64 ?? "", "base64"));
      return NextResponse.json(await previa(body.contaId, bytes));
    }
    if (body.acao === "confirmar") {
      const novas = await confirmarImportacao(body.contaId, body.itens ?? []);
      return NextResponse.json({ novas });
    }
    return erro("Ação inválida.", undefined, 400);
  } catch (e) {
    const msg = e instanceof Error && e.message.includes("OFX") ? e.message : "Não consegui ler o arquivo.";
    return erro(msg, e, 400);
  }
}
