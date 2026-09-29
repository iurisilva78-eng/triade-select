# Financeiro (admin)

Módulo em `/admin/financeiro` pra separar o dinheiro da empresa do pessoal. Só admin.

## Contas

Criadas sozinhas na primeira vez que a tela abre:

| Conta | Tipo | Pra quê |
|---|---|---|
| Nubank PJ, Inter PJ | BANCO | extrato importado em OFX |
| Caixa (dinheiro) | CAIXA | dinheiro vivo, lançado à mão |
| Iuri (sócio) | SOCIO | conta corrente com o sócio |

Valores em **centavos** (`Int`): positivo entrou na conta, negativo saiu.

**Conta do sócio.** Saída = gasto da empresa pago com dinheiro/cartão pessoal (a
empresa passa a dever). Entrada = dinheiro da empresa que caiu com o sócio (ex.:
venda paga na conta pessoal). Saldo negativo = "a Tríade te deve"; positivo = "você
está com dinheiro da Tríade". Reembolso é uma transferência PJ → sócio.

## Categorias

Receita, Despesa, Retirada (retirada de lucro, fora do resultado), Transferência e
Ajuste (saldo inicial) — as três últimas não entram no resultado. Lançamento sem
categoria também não entra e aparece como pendência no resumo.

Regras de palavra-chave classificam na importação ("zul" → pedágio, "melhorenvio" →
frete…). Ao escolher a categoria com "Lembrar" marcado, a descrição vira regra.

## Importar extrato (OFX)

- Duplicata: data + descrição + valor + nº de ocorrência no arquivo, por conta. O
  FITID **não** é usado: o Nubank repete o mesmo FITID em todas as parcelas de uma
  compra e às vezes em dois lançamentos do mesmo arquivo.
- Conta do sócio: importe a fatura do cartão pessoal; só vem marcado o que alguma
  regra reconhece como da empresa.
- Conta de banco: mostra saldo do banco (LEDGERBAL) × saldo no sistema.

## Pedidos do site

O extrato é a verdade do que entrou; pagamento de pedido **não** vira entrada sozinho
(contaria duas vezes). Cada `Payment` do mês é procurado nos lançamentos (mesmo valor,
de 3 dias antes a 5 depois) e ligado. O que não aparecer pode ser lançado como
"recebi em dinheiro" (Caixa) ou "caiu na minha conta pessoal" (Sócio).

## Banco de dados

Só tabelas novas (`fin_contas`, `fin_categorias`, `fin_lancamentos`, `fin_regras`) e
dois enums. Nada existente muda. O build não aplica o schema: depois do merge rode
`npx prisma db push` apontando pro banco de produção.

## Testes

`node --experimental-strip-types --test tests/financeiro.test.ts` (leitura de OFX,
regras, duplicatas, valores).
