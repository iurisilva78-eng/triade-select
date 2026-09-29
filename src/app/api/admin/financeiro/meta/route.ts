import { NextResponse } from "next/server";
import { meta } from "@/lib/financeiro/servidor";
import { erro, exigirAdmin } from "../_auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const negado = await exigirAdmin(); if (negado) return negado;
  try { return NextResponse.json(await meta()); } catch (e) { return erro("Erro ao carregar o Financeiro.", e); }
}
