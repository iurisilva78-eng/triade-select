import { normalizar } from "./texto.ts";

export interface Regra { padrao: string; categoriaId: string }

/** Casa por "contém", começando numa fronteira de palavra ("zul" não pega "azul").
 *  O padrão mais longo ganha ("google one" antes de "google"). */
export function classificar(descricao: string, regras: Regra[]): string | null {
  const texto = normalizar(descricao);
  const ordenadas = [...regras].sort((a, b) => b.padrao.length - a.padrao.length);
  for (const r of ordenadas) {
    const p = normalizar(r.padrao).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(?<![a-z0-9])${p}`).test(texto)) return r.categoriaId;
  }
  return null;
}

/** Chave de duplicata por conta: data|descrição|valor|nº da ocorrência no arquivo.
 *  Duas compras idênticas no mesmo dia continuam sendo duas. */
export function chavesDedup(itens: { data: string; descricao: string; valor: number }[]): string[] {
  const vistos = new Map<string, number>();
  return itens.map((t) => {
    const base = `${t.data}|${normalizar(t.descricao)}|${t.valor}`;
    const n = (vistos.get(base) ?? 0) + 1;
    vistos.set(base, n);
    return `${base}|${n}`;
  });
}
