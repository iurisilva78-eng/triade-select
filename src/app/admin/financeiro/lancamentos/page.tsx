"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeftRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminErrorBox } from "@/components/admin/AdminErrorBox";
import {
  Cabecalho, Cartao, CategoriaSelect, brl, hoje, lerValor, useMes, useMeta,
} from "@/components/admin/financeiro/comum";

interface Lancamento {
  id: string; contaId: string; data: string; descricao: string; valor: number;
  categoriaId: string | null; origem: string; transferenciaId: string | null; pedidoId: string | null;
}

const campo = "bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)]";

export default function LancamentosPage() {
  const [mes, setMes] = useMes();
  const meta = useMeta();
  const [contaId, setContaId] = useState("");
  const params = useSearchParams();
  const [semCategoria, setSemCategoria] = useState(() => params.get("semCategoria") === "1");
  const [lembrar, setLembrar] = useState(true);
  const [lista, setLista] = useState<Lancamento[] | null>(null);
  const [form, setForm] = useState<"novo" | "transf" | null>(null);
  const [erro, setErro] = useState<{ msg: string; raw?: unknown } | null>(null);

  const carregar = useCallback(() => {
    const q = new URLSearchParams({ mes, ...(contaId ? { contaId } : {}), ...(semCategoria ? { semCategoria: "1" } : {}) });
    fetch(`/api/admin/financeiro/lancamentos?${q}`).then((r) => r.json()).then(setLista);
  }, [mes, contaId, semCategoria]);
  useEffect(() => { carregar(); }, [carregar]);

  const mudarCategoria = async (l: Lancamento, categoriaId: string) => {
    setErro(null);
    const res = await fetch("/api/admin/financeiro/lancamentos", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: l.id, categoriaId, lembrar: lembrar && !l.transferenciaId }),
    });
    if (!res.ok) { const d = await res.json(); setErro({ msg: d.error, raw: d._raw }); }
    carregar();
  };

  const apagar = async (l: Lancamento) => {
    if (!confirm(l.transferenciaId ? "Apagar a transferência (as duas pontas)?" : "Apagar este lançamento?")) return;
    await fetch(`/api/admin/financeiro/lancamentos?id=${l.id}`, { method: "DELETE" });
    carregar();
  };

  const nomeConta = Object.fromEntries((meta?.contas ?? []).map((c) => [c.id, c.nome]));
  const total = (lista ?? []).reduce((s, l) => s + l.valor, 0);

  return (
    <div className="max-w-6xl">
      <Cabecalho titulo="Lançamentos" subtitulo="Tudo que entrou e saiu, por conta. Classifique o que estiver sem categoria."
        mes={mes} onMes={setMes} />
      {erro && <AdminErrorBox message={erro.msg} raw={erro.raw} className="mb-4" />}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={contaId} onChange={(e) => setContaId(e.target.value)} className={campo}>
          <option value="">Todas as contas</option>
          {meta?.contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] px-2">
          <input type="checkbox" checked={semCategoria} onChange={(e) => setSemCategoria(e.target.checked)} /> Só sem categoria
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] px-2"
          title="Ao escolher a categoria, grava a regra pra classificar sozinho nas próximas importações">
          <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} /> Lembrar categoria
        </label>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={() => setForm(form === "transf" ? null : "transf")}>
          <ArrowLeftRight size={14} /> Transferência
        </Button>
        <Button size="sm" onClick={() => setForm(form === "novo" ? null : "novo")}><Plus size={14} /> Lançamento</Button>
      </div>

      {meta && form === "novo" && <NovoLancamento meta={meta} onFeito={() => { setForm(null); carregar(); }} />}
      {meta && form === "transf" && <NovaTransferencia contas={meta.contas} onFeito={() => { setForm(null); carregar(); }} />}

      <Cartao className="p-0 overflow-x-auto">
        {!lista || !meta ? <p className="p-5 text-sm text-[var(--text-muted)]">Carregando…</p> :
          lista.length === 0 ? <p className="p-5 text-sm text-[var(--text-muted)]">Nenhum lançamento.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-[var(--text-muted)] border-b border-[var(--border)]">
              <th className="p-3">Data</th><th className="p-3">Conta</th><th className="p-3">Descrição</th>
              <th className="p-3 text-right">Valor</th><th className="p-3">Categoria</th><th className="p-3" />
            </tr></thead>
            <tbody>
              {lista.map((l) => (
                <tr key={l.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="p-3 whitespace-nowrap">{l.data.slice(8, 10)}/{l.data.slice(5, 7)}</td>
                  <td className="p-3 whitespace-nowrap text-[var(--text-secondary)]">{nomeConta[l.contaId]}</td>
                  <td className="p-3">{l.descricao}{l.pedidoId && <span className="ml-2 text-xs text-green-600">pedido ✓</span>}</td>
                  <td className={`p-3 text-right font-medium whitespace-nowrap ${l.valor >= 0 ? "text-green-600" : "text-red-600"}`}>{brl(l.valor)}</td>
                  <td className="p-3"><CategoriaSelect categorias={meta.categorias} value={l.categoriaId} onChange={(id) => mudarCategoria(l, id)} /></td>
                  <td className="p-3"><button onClick={() => apagar(l)} className="text-[var(--text-muted)] hover:text-red-600" title="Apagar"><Trash2 size={15} /></button></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={3} className="p-3 text-xs text-[var(--text-muted)]">{lista.length} lançamentos</td>
              <td className="p-3 text-right font-semibold">{brl(total)}</td><td colSpan={2} /></tr></tfoot>
          </table>
        )}
      </Cartao>
    </div>
  );
}

function NovoLancamento({ meta, onFeito }: { meta: NonNullable<ReturnType<typeof useMeta>>; onFeito: () => void }) {
  const [contaId, setContaId] = useState(meta.contas[0]?.id ?? "");
  const [data, setData] = useState(hoje());
  const [descricao, setDescricao] = useState("");
  const [sentido, setSentido] = useState<"entrada" | "saida">("saida");
  const [valor, setValor] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const socio = meta.contas.find((c) => c.id === contaId)?.tipo === "SOCIO";

  const salvar = async () => {
    setMsg("");
    let v: number;
    try { v = lerValor(valor); } catch { setMsg("Valor inválido."); return; }
    const res = await fetch("/api/admin/financeiro/lancamentos", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contaId, data, descricao, valor: sentido === "entrada" ? Math.abs(v) : -Math.abs(v), categoriaId }),
    });
    if (!res.ok) { setMsg((await res.json()).error ?? "Erro."); return; }
    onFeito();
  };

  return (
    <Cartao className="mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-xs text-[var(--text-muted)]">Conta
          <select value={contaId} onChange={(e) => setContaId(e.target.value)} className={`${campo} w-full mt-1`}>
            {meta.contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select></label>
        <label className="text-xs text-[var(--text-muted)]">Data
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={`${campo} w-full mt-1`} /></label>
        <label className="text-xs text-[var(--text-muted)]">Tipo
          <select value={sentido} onChange={(e) => setSentido(e.target.value as "entrada" | "saida")} className={`${campo} w-full mt-1`}>
            <option value="saida">Saída (gasto)</option><option value="entrada">Entrada (venda, recebimento)</option>
          </select></label>
        <label className="text-xs text-[var(--text-muted)] sm:col-span-2">Descrição
          <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Venda atacado — Loja X" className={`${campo} w-full mt-1`} /></label>
        <label className="text-xs text-[var(--text-muted)]">Valor (R$)
          <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className={`${campo} w-full mt-1`} /></label>
        <label className="text-xs text-[var(--text-muted)] sm:col-span-2">Categoria
          <CategoriaSelect categorias={meta.categorias} value={categoriaId} onChange={setCategoriaId} className="w-full mt-1 py-2" /></label>
        <div className="flex items-end gap-3"><Button onClick={salvar}>Salvar</Button>{msg && <span className="text-sm text-red-600">{msg}</span>}</div>
      </div>
      {socio && (
        <p className="text-xs text-[var(--text-muted)] mt-3">
          Conta do sócio: <b>saída</b> = gasto da empresa que você pagou com dinheiro/cartão pessoal (a empresa passa a te dever).
          <b> Entrada</b> = dinheiro da empresa que caiu com você (você passa a dever à empresa).
        </p>
      )}
    </Cartao>
  );
}

function NovaTransferencia({ contas, onFeito }: { contas: { id: string; nome: string }[]; onFeito: () => void }) {
  const [deId, setDeId] = useState(contas[0]?.id ?? "");
  const [paraId, setParaId] = useState(contas[1]?.id ?? "");
  const [data, setData] = useState(hoje());
  const [valor, setValor] = useState("");
  const [msg, setMsg] = useState("");

  const salvar = async () => {
    setMsg("");
    let v: number;
    try { v = Math.abs(lerValor(valor)); } catch { setMsg("Valor inválido."); return; }
    const res = await fetch("/api/admin/financeiro/transferencia", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deId, paraId, data, valor: v }),
    });
    if (!res.ok) { setMsg((await res.json()).error ?? "Erro."); return; }
    onFeito();
  };

  return (
    <Cartao className="mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
        <label className="text-xs text-[var(--text-muted)]">De
          <select value={deId} onChange={(e) => setDeId(e.target.value)} className={`${campo} w-full mt-1`}>
            {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
        <label className="text-xs text-[var(--text-muted)]">Para
          <select value={paraId} onChange={(e) => setParaId(e.target.value)} className={`${campo} w-full mt-1`}>
            {contas.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></label>
        <label className="text-xs text-[var(--text-muted)]">Data
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={`${campo} w-full mt-1`} /></label>
        <label className="text-xs text-[var(--text-muted)]">Valor (R$)
          <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" className={`${campo} w-full mt-1`} /></label>
        <div className="flex items-center gap-3"><Button onClick={salvar}>Transferir</Button>{msg && <span className="text-sm text-red-600">{msg}</span>}</div>
      </div>
      <p className="text-xs text-[var(--text-muted)] mt-3">Não conta como receita nem despesa: entre as contas PJ, depósito do caixa, reembolso ao sócio.</p>
    </Cartao>
  );
}
