// Utilitários sem dependência de banco (testáveis com node --test).

/** Minúsculo, sem acento, espaços colapsados. Usado pra casar regras e deduplicar. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\x00-\x7f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Desfaz acento embaralhado ("CrÃ©dito" -> "Crédito"), comum quando o arquivo
 *  passa pelo Excel: UTF-8 lido como Windows-1252 e gravado de novo. */
export function consertarTexto(texto: string): string {
  if (!/[ÃÂ]/.test(texto)) return texto;
  try {
    const bytes = Uint8Array.from([...texto].map((c) => {
      const code = c.charCodeAt(0);
      if (code > 0xff) throw new Error("fora do latin-1");
      return code;
    }));
    const saida = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return saida;
  } catch {
    return texto;
  }
}

/** Texto do arquivo: UTF-8 se válido, senão Windows-1252. */
export function decodificarArquivo(bytes: Uint8Array): string {
  try {
    return consertarTexto(new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^﻿/, ""));
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

/** "1.234,56" | "1234.56" | "R$ -12,00" -> centavos. */
export function parseValor(texto: string | number): number {
  if (typeof texto === "number") return Math.round(texto * 100);
  let s = texto.replace(/R\$|\s| /g, "");
  if (!s) throw new Error("valor vazio");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  if (!Number.isFinite(n)) throw new Error(`valor inválido: ${texto}`);
  return Math.round(n * 100);
}

export function fmtBRL(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(centavos / 100);
}

/** "2026-10" do mês de uma data ISO "2026-10-05". */
export function mesDe(dataIso: string): string {
  return dataIso.slice(0, 7);
}

export function somarMeses(mes: string, n: number): string {
  const [a, m] = mes.split("-").map(Number);
  const total = a * 12 + (m - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

export function nomeMes(mes: string): string {
  const nomes = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const [a, m] = mes.split("-");
  return `${nomes[Number(m) - 1]}/${a}`;
}
