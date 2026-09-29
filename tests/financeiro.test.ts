// node --experimental-strip-types --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { lerOfx } from "../src/lib/financeiro/ofx.ts";
import { chavesDedup, classificar } from "../src/lib/financeiro/regras.ts";
import { consertarTexto, normalizar, parseValor, somarMeses, fmtBRL, decodificarArquivo } from "../src/lib/financeiro/texto.ts";

const OFX_CARTAO = `OFXHEADER:100
DATA:OFXSGML
<OFX><CREDITCARDMSGSRSV1><CCSTMTTRNRS><CCSTMTRS><BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20260916000000[-3:BRT]</DTPOSTED><TRNAMT>-4.00</TRNAMT><FITID>mesmo</FITID><MEMO>IOF de compra internacional</MEMO></STMTTRN>
<STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20260916000000[-3:BRT]</DTPOSTED><TRNAMT>-114.49</TRNAMT><FITID>mesmo</FITID><MEMO>Anthropic* Claude Sub</MEMO></STMTTRN>
<STMTTRN><TRNTYPE>CREDIT</TRNTYPE><DTPOSTED>20260914000000[-3:BRT]</DTPOSTED><TRNAMT>1419.17</TRNAMT><FITID>x</FITID><MEMO>Pagamento recebido</MEMO></STMTTRN>
</BANKTRANLIST><LEDGERBAL><BALAMT>-3878.12</BALAMT></LEDGERBAL></CCSTMTRS></CCSTMTTRNRS></CREDITCARDMSGSRSV1></OFX>`;

test("lê OFX do Nubank com FITID repetido e saldo", () => {
  const e = lerOfx(OFX_CARTAO);
  assert.equal(e.cartao, true);
  assert.equal(e.saldo, -387812);
  assert.deepEqual(e.transacoes.map((t) => [t.data, t.descricao, t.valor]), [
    ["2026-09-16", "IOF de compra internacional", -400],
    ["2026-09-16", "Anthropic* Claude Sub", -11449],
    ["2026-09-14", "Pagamento recebido", 141917],
  ]);
  // FITID igual não derruba lançamento: a chave de duplicata é outra
  const chaves = chavesDedup(e.transacoes);
  assert.equal(new Set(chaves).size, 3);
});

test("OFX em XML (Inter) com fechamento de tag", () => {
  const xml = `<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN><TRNTYPE>CREDIT</TRNTYPE><DTPOSTED>20261001</DTPOSTED><TRNAMT>250.00</TRNAMT><FITID>1</FITID><NAME>PIX RECEBIDO</NAME><MEMO>PIX RECEBIDO - FULANO</MEMO></STMTTRN>
</BANKTRANLIST><LEDGERBAL><BALAMT>1000.50</BALAMT></LEDGERBAL></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;
  const e = lerOfx(xml);
  assert.equal(e.cartao, false);
  assert.deepEqual(e.transacoes[0], { data: "2026-10-01", descricao: "PIX RECEBIDO - FULANO", valor: 25000, fitid: "1" });
  assert.equal(e.saldo, 100050);
});

test("duas compras idênticas no mesmo dia continuam duas", () => {
  const t = { data: "2026-09-14", descricao: "Lavanderia", valor: -2000 };
  const c = chavesDedup([t, t, t]);
  assert.deepEqual(c.map((x) => x.slice(-2)), ["|1", "|2", "|3"]);
});

test("classificar: fronteira de palavra e padrão mais longo", () => {
  const regras = [
    { padrao: "zul", categoriaId: "pedagio" },
    { padrao: "google", categoriaId: "outros" },
    { padrao: "google one", categoriaId: "software" },
  ];
  assert.equal(classificar("Zul Tag 2dho69", regras), "pedagio");
  assert.equal(classificar("Azul Linhas Aereas", regras), null);
  assert.equal(classificar("Google One", regras), "software");
});

test("texto e valores", () => {
  assert.equal(consertarTexto("Pix no CrÃ©dito"), "Pix no Crédito");
  assert.equal(normalizar("  Pix no  Crédito "), "pix no credito");
  assert.equal(parseValor("1.234,56"), 123456);
  assert.equal(parseValor("-3878.12"), -387812);
  assert.equal(parseValor("R$ 12,3"), 1230);
  assert.equal(somarMeses("2026-01", -2), "2025-11");
  assert.equal(fmtBRL(123456).replace(/\s/g, " "), "R$ 1.234,56");
  const latin1 = new Uint8Array([0x43, 0x72, 0xe9, 0x64]); // "Créd" em Windows-1252
  assert.equal(decodificarArquivo(latin1), "Créd");
});
