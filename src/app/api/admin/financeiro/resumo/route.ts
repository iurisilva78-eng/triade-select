import { NextRequest, NextResponse } from "next/server";
import { resumo } from "@/lib/financeiro/servidor";
import { erro, exigirAdmin, mesValido } from "../_auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const negado = await exigirAdmin(); if (negado) return negado;
  const mes = mesValido(req.nextUrl.searchParams.get("mes"));
  if (!mes) return erro("Mês inválido.", undefined, 400);
  try { return NextResponse.json(await resumo(mes)); } catch (e) { return erro("Erro ao montar o resumo.", e); }
}
