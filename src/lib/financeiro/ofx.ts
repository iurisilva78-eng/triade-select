import { decodificarArquivo, parseValor } from "./texto.ts";

export interface TransacaoOfx {
  data: string;      // ISO AAAA-MM-DD
  descricao: string;
  valor: number;     // centavos: + entrou, - saiu (convenção do OFX)
  fitid?: string;    // só informativo: o Nubank repete entre parcelas e às vezes no mesmo arquivo
}

export interface ExtratoOfx {
  transacoes: TransacaoOfx[];
  saldo?: number;       // LEDGERBAL (centavos), quando vier
  cartao: boolean;      // fatura de cartão (CREDITCARDMSGSRSV1) em vez de conta
}

function tag(bloco: string, nome: string): string | undefined {
  // SGML (sem fechamento) ou XML (<TAG>valor</TAG>)
  const m = bloco.match(new RegExp(`<${nome}>([^<\\r\\n]*)`, "i"));
  return m ? m[1].trim() : undefined;
}

export function lerOfx(conteudo: Uint8Array | string): ExtratoOfx {
  const texto = typeof conteudo === "string" ? conteudo : decodificarArquivo(conteudo);
  if (!/<OFX>/i.test(texto)) throw new Error("Não parece um arquivo OFX.");
  const transacoes: TransacaoOfx[] = [];
  for (const m of texto.matchAll(/<STMTTRN>([\s\S]*?)(?=<\/STMTTRN>|<STMTTRN>|<\/BANKTRANLIST>)/gi)) {
    const b = m[1];
    const dt = tag(b, "DTPOSTED");
    const amt = tag(b, "TRNAMT");
    if (!dt || !amt) continue;
    const descricao = [tag(b, "MEMO"), tag(b, "NAME")]
      .filter(Boolean)
      .sort((a, c) => (c!.length - a!.length))[0] ?? "";
    transacoes.push({
      data: `${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}`,
      descricao,
      valor: parseValor(amt),
      fitid: tag(b, "FITID"),
    });
  }
  const bal = texto.match(/<LEDGERBAL>[\s\S]*?<BALAMT>([^<\r\n]+)/i);
  return {
    transacoes,
    saldo: bal ? parseValor(bal[1].trim()) : undefined,
    cartao: /<CREDITCARDMSGSRSV1>/i.test(texto),
  };
}
