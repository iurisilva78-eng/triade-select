"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminErrorBox } from "@/components/admin/AdminErrorBox";
import { Cabecalho, Cartao, CategoriaSelect, brl, useMes, useMeta } from "@/components/admin/financeiro/comum";

interface Item {
  data: string; descricao: string; valor: number; chave: string;
  categoriaId: string | null; jaExiste: boolean; incluir: boolean;
}
interface Previa {
  conta: { id: string; nome: string; tipo: string }; cartao: boolean;
  saldoOfx: number | null; saldoSistema: number; itens: Item[];
}

function base64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export default function ImportarPage() {
  const [mes, setMes] = useMes();
  const meta = useMeta();
  const [contaId, setContaId] = useState("");
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState("");
  const [erro, setErro] = useState<{ msg: string; raw?: unknown } | null>(null);

  const conta = meta?.contas.find((c) => c.id === (contaId || meta?.contas[0]?.id));

  const ler = async (arquivo: File) => {
    if (!conta) return;
    setErro(null); setResultado(""); setPrevia(null); setCarregando(true);
    const res = await fetch("/api/admin/financeiro/importar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "previa", contaId: conta.id, arquivoBase64: base64(await arquivo.arrayBuffer()) }),
    });
    const d = await res.json();
    setCarregando(false);
    if (!res.ok) { setErro({ msg: d.error, raw: d._raw }); return; }
    setPrevia(d);
  };

  const atualizar = (i: number, mudanca: Partial<Item>) =>
    setPrevia((p) => p && { ...p, itens: p.itens.map((it, j) => (j === i ? { ...it, ...mudanca } : it)) });

  const confirmar = async () => {
    if (!previa) return;
    const itens = previa.itens.filter((i) => i.incluir && !i.jaExiste)
      .map(({ data, descricao, valor, chave, categoriaId }) => ({ data, descricao, valor, chave, categoriaId }));
    const res = await fetch("/api/admin/financeiro/importar", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ acao: "confirmar", contaId: previa.conta.id, itens }),
    });
    const d = await res.json();
    if (!res.ok) { setErro({ msg: d.error, raw: d._raw }); return; }
    setResultado(`${d.novas} lançamentos importados em ${previa.conta.nome}.`);
    setPrevia(null);
  };

  const marcados = previa?.itens.filter((i) => i.incluir && !i.jaExiste) ?? [];
  const soma = marcados.reduce((s, i) => s + i.valor, 0);
  const jaTem = previa?.itens.filter((i) => i.jaExiste).length ?? 0;

  return (
    <div className="max-w-6xl">
      <Cabecalho titulo="Importar extrato" subtitulo="Arquivo OFX do Nubank PJ, Inter PJ ou da fatura do seu cartão pessoal."
        mes={mes} onMes={setMes} />
      {erro && <AdminErrorBox message={erro.msg} raw={erro.raw} className="mb-4" />}
      {resultado && <div className="bg-green-500/10 border border-green-500/30 text-green-700 rounded-xl p-3 text-sm mb-4">{resultado}</div>}

      <Cartao className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-[var(--text-muted)]">Conta
            <select value={conta?.id ?? ""} onChange={(e) => { setContaId(e.target.value); setPrevia(null); }}
              className="block mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm">
              {meta?.contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select></label>
          <label className="inline-flex items-center gap-2 cursor-pointer bg-[var(--gold)] text-white rounded-xl px-4 py-2 text-sm font-medium">
            <Upload size={15} /> {carregando ? "Lendo…" : "Escolher arquivo OFX"}
            <input type="file" accept=".ofx,.OFX" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) ler(f); e.target.value = ""; }} />
          </label>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-3">
          {conta?.tipo === "SOCIO"
            ? "Conta do sócio: importe a fatura do seu cartão pessoal. Só vem marcado o que alguma regra reconhece como da empresa (Zul, Adobe, Melhor Envio…). Marque o que mais for da Tríade."
            : "Pode importar o mesmo extrato quantas vezes quiser: o que já existe é ignorado."}
        </p>
      </Cartao>

      {previa && meta && (
        <>
          <Cartao className="mb-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div><p className="text-xs text-[var(--text-muted)]">No arquivo</p><p className="font-semibold">{previa.itens.length} lançamentos</p></div>
              <div><p className="text-xs text-[var(--text-muted)]">Já importados antes</p><p className="font-semibold">{jaTem}</p></div>
              <div><p className="text-xs text-[var(--text-muted)]">Vão entrar</p><p className="font-semibold">{marcados.length} · {brl(soma)}</p></div>
              {previa.saldoOfx !== null && !previa.cartao && (
                <div><p className="text-xs text-[var(--text-muted)]">Saldo: banco × sistema depois de importar</p>
                  <p className={`font-semibold ${previa.saldoOfx === previa.saldoSistema + soma ? "text-green-600" : "text-amber-600"}`}>
                    {brl(previa.saldoOfx)} × {brl(previa.saldoSistema + soma)}</p></div>
              )}
            </div>
            {previa.saldoOfx !== null && !previa.cartao && previa.saldoOfx !== previa.saldoSistema + soma && (
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Diferença normal na primeira importação: lance o saldo de partida da conta em Lançamentos (categoria “Saldo inicial / ajuste”).
              </p>
            )}
          </Cartao>

          <Cartao className="p-0 overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="p-3">Importar</th><th className="p-3">Data</th><th className="p-3">Descrição</th>
                <th className="p-3 text-right">Valor</th><th className="p-3">Categoria</th>
              </tr></thead>
              <tbody>
                {previa.itens.map((it, i) => (
                  <tr key={it.chave} className={`border-b border-[var(--border)] last:border-0 ${it.jaExiste ? "opacity-40" : ""}`}>
                    <td className="p-3">{it.jaExiste ? <span className="text-xs">já existe</span> :
                      <input type="checkbox" checked={it.incluir} onChange={(e) => atualizar(i, { incluir: e.target.checked })} />}</td>
                    <td className="p-3 whitespace-nowrap">{it.data.slice(8, 10)}/{it.data.slice(5, 7)}</td>
                    <td className="p-3">{it.descricao}</td>
                    <td className={`p-3 text-right font-medium whitespace-nowrap ${it.valor >= 0 ? "text-green-600" : "text-red-600"}`}>{brl(it.valor)}</td>
                    <td className="p-3">{!it.jaExiste && <CategoriaSelect categorias={meta.categorias} value={it.categoriaId}
                      onChange={(id) => atualizar(i, { categoriaId: id || null, incluir: true })} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Cartao>
          <Button onClick={confirmar} disabled={marcados.length === 0}>Importar {marcados.length} lançamentos</Button>
        </>
      )}
    </div>
  );
}
