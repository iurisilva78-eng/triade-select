// Contas, categorias e regras iniciais. Criadas na primeira vez que o Financeiro abre.

export const CONTAS = [
  { nome: "Nubank PJ", tipo: "BANCO", ordem: 1 },
  { nome: "Inter PJ", tipo: "BANCO", ordem: 2 },
  { nome: "Caixa (dinheiro)", tipo: "CAIXA", ordem: 3 },
  { nome: "Iuri (sócio)", tipo: "SOCIO", ordem: 4 },
] as const;

export const CATEGORIAS = [
  // receitas
  { nome: "Vendas — site", tipo: "RECEITA" },
  { nome: "Vendas — WhatsApp/direto", tipo: "RECEITA" },
  { nome: "Vendas — atacado", tipo: "RECEITA" },
  { nome: "Outras receitas", tipo: "RECEITA" },
  // despesas de confecção
  { nome: "Tecido", tipo: "DESPESA" },
  { nome: "Aviamentos", tipo: "DESPESA" },
  { nome: "Facção / costura", tipo: "DESPESA" },
  { nome: "Estamparia / bordado", tipo: "DESPESA" },
  { nome: "Embalagem", tipo: "DESPESA" },
  { nome: "Frete / envios", tipo: "DESPESA" },
  { nome: "Marketing / anúncios", tipo: "DESPESA" },
  { nome: "Software / assinaturas", tipo: "DESPESA" },
  { nome: "Pedágio / combustível", tipo: "DESPESA" },
  { nome: "Taxas bancárias / maquininha", tipo: "DESPESA" },
  { nome: "Impostos (DAS)", tipo: "DESPESA" },
  { nome: "Pró-labore", tipo: "DESPESA" },
  { nome: "Outras despesas", tipo: "DESPESA" },
  // neutras
  { nome: "Retirada de lucro", tipo: "RETIRADA" },
  { nome: "Transferência entre contas", tipo: "TRANSFERENCIA" },
  { nome: "Saldo inicial / ajuste", tipo: "AJUSTE" },
] as const;

export const REGRAS: Record<string, string[]> = {
  "Frete / envios": ["melhorenvio", "melhor envio", "correios", "jadlog", "loggi"],
  "Software / assinaturas": ["adobe", "anthropic", "claude.ai", "google one", "googleone", "canva", "uploadthing", "netlify", "vercel"],
  "Pedágio / combustível": ["zul", "sem parar", "conectcar", "veloe", "posto", "auto posto", "autoposto", "ipiranga", "shell", "petrobras", "petrolandia"],
  "Marketing / anúncios": ["facebk", "facebook", "meta ads", "google ads", "instagram"],
  "Impostos (DAS)": ["simples nacional", "das ", "receita federal", "pgmei"],
  "Taxas bancárias / maquininha": ["tarifa", "iof", "juros"],
  "Embalagem": ["embalage"],
  "Tecido": ["tecido", "malha"],
  "Aviamentos": ["aviamento", "armarinho"],
};
