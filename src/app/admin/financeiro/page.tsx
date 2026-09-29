"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminErrorBox } from "@/components/admin/AdminErrorBox";
import { Cabecalho, Cartao, brl, hoje, lerValor, useMes } from "@/components/admin/financeiro/comum";

interface Resumo {
  entradas: number; saidas: number; resultado: number; retiradas: number; semCategoria: number;
  contas: { id: string; nome: string; tipo: string; saldo: number }[];
  socio: { id: string; nome: string; saldo: number } | null;
  porCategoria: { id: string; nome: string; tipo: string; valor: number }[];
  pedidos: {
    pagamentoId: string; pedido: string; cliente: string; valor: number; metodo: string; data: string;
    encontradoEm: { conta: string; data: string } | null;
  }[];
}

const dm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

export default function FinanceiroPage() {
  const [mes, setMes] = useMes();
  const [r, setR] = useState<Resumo | null>(null);
  const [erro, setErro] = useState<{ msg: string; raw?: unknown } | null>(null);

  const carregar = useCallback(() => {
    fetch(`/api/admin/financeiro/resumo?mes=${mes}`).then(async (res) => {
      const d = await res.json();
      if (!res.ok) setErro({ msg: d.error ?? "Erro.", raw: d._raw }); else { setErro(null); setR(d); }
    });
  }, [mes]);
  useEffect(() => { carregar(); }, [carregar]);

  return (
    <div className="max-w-5xl">
      <Cabecalho titulo="Financeiro" subtitulo="Empresa separada do pessoal: quanto entrou, quanto saiu e o acerto com o sócio."
        mes={mes} onMes={setMes} />
      {erro && <AdminErrorBox message={erro.msg} raw={erro.raw} className="mb-4" />}
      {!r ? <p className="text-[var(--text-muted)] text-sm">Carregando…</p> : (
        <div className="space-y-5">
          {r.socio && <Socio socio={r.socio} contas={r.contas} onFeito={carregar} />}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Cartao><p className="text-xs text-[var(--text-muted)]">Entrou no mês</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{brl(r.entradas)}</p></Cartao>
            <Cartao><p className="text-xs text-[var(--text-muted)]">Saiu no mês</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{brl(r.saidas)}</p></Cartao>
            <Cartao><p className="text-xs text-[var(--text-muted)]">Resultado</p>
              <p className={`text-2xl font-bold mt-1 ${r.resultado >= 0 ? "text-green-600" : "text-red-600"}`}>{brl(r.resultado)}</p>
              {r.retiradas > 0 && <p className="text-xs text-[var(--text-muted)] mt-1">Retiradas de lucro: {brl(r.retiradas)}</p>}
            </Cartao>
          </div>

          {r.semCategoria > 0 && (
            <Link href={`/admin/financeiro/lancamentos?mes=${mes}&semCategoria=1`}
              className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-700 rounded-xl p-3 text-sm">
              <AlertTriangle size={16} /> {r.semCategoria} lançamento(s) sem categoria não entram no resultado. Clique pra classificar.
            </Link>
          )}

          <Cartao>
            <h2 className="font-semibold text-[var(--text)] mb-3">Saldo das contas <span className="text-xs font-normal text-[var(--text-muted)]">(fim do mês)</span></h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {r.contas.filter((c) => c.tipo !== "SOCIO").map((c) => (
                <div key={c.id}>
                  <p className="text-xs text-[var(--text-muted)]">{c.nome}</p>
                  <p className={`font-semibold ${c.saldo < 0 ? "text-red-600" : "text-[var(--text)]"}`}>{brl(c.saldo)}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-3">
              Pra bater com o banco, lance o saldo de partida de cada conta em Lançamentos, categoria “Saldo inicial / ajuste”.
            </p>
          </Cartao>

          <Cartao>
            <h2 className="font-semibold text-[var(--text)] mb-3">Por categoria</h2>
            {r.porCategoria.length === 0 ? <p className="text-sm text-[var(--text-muted)]">Nada classificado neste mês.</p> : (
              <table className="w-full text-sm">
                <tbody>
                  {r.porCategoria.map((c) => (
                    <tr key={c.id} className="border-t border-[var(--border)]">
                      <td className="py-2 text-[var(--text-secondary)]">{c.nome}</td>
                      <td className={`py-2 text-right font-medium ${c.valor >= 0 ? "text-green-600" : "text-red-600"}`}>{brl(c.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Cartao>

          <Pedidos pedidos={r.pedidos} onFeito={carregar} />
        </div>
      )}
    </div>
  );
}

function Socio({ socio, contas, onFeito }: { socio: NonNullable<Resumo["socio"]>; contas: Resumo["contas"]; onFeito: () => void }) {
  const deve = -socio.saldo; // > 0: a empresa deve ao sócio
  const bancos = contas.filter((c) => c.tipo !== "SOCIO");
  const [de, setDe] = useState(bancos[0]?.id ?? "");
  const [valor, setValor] = useState("");
  const [msg, setMsg] = useState("");

  const acertar = async () => {
    setMsg("");
    let centavos: number;
    try { centavos = lerValor(valor || String(Math.abs(socio.saldo) / 100).replace(".", ",")); } catch { setMsg("Valor inválido."); return; }
    const [origem, destino] = deve > 0 ? [de, socio.id] : [socio.id, de];
    const res = await fetch("/api/admin/financeiro/transferencia", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deId: origem, paraId: destino, data: hoje(), valor: centavos,
        descricao: deve > 0 ? "Reembolso ao sócio" : "Sócio devolveu à empresa" }),
    });
    if (!res.ok) { setMsg((await res.json()).error ?? "Erro."); return; }
    setValor(""); onFeito();
  };

  return (
    <Cartao className={deve > 0 ? "border-amber-500/40" : deve < 0 ? "border-blue-500/40" : ""}>
      <p className="text-xs text-[var(--text-muted)]">Acerto com o sócio (saldo até o fim do mês)</p>
      {socio.saldo === 0 ? (
        <p className="text-xl font-bold text-[var(--text)] mt-1 flex items-center gap-2"><CheckCircle2 className="text-green-600" size={20} /> Tudo acertado</p>
      ) : (
        <p className="text-3xl font-bold mt-1 text-[var(--text)]">
          {deve > 0 ? "A Tríade te deve " : "Você está com "}
          <span className={deve > 0 ? "text-amber-600" : "text-blue-600"}>{brl(Math.abs(socio.saldo))}</span>
          {deve < 0 && " da Tríade"}
        </p>
      )}
      <p className="text-xs text-[var(--text-muted)] mt-1">
        Sobe quando a empresa usa o seu cartão/conta pessoal; desce quando ela te reembolsa. Venda que cai na sua conta pessoal faz o contrário.
      </p>
      {socio.saldo !== 0 && bancos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-sm text-[var(--text-secondary)]">{deve > 0 ? "Reembolsar de" : "Devolver para"}</span>
          <select value={de} onChange={(e) => setDe(e.target.value)}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm">
            {bancos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
          </select>
          <input value={valor} onChange={(e) => setValor(e.target.value)} placeholder={brl(Math.abs(socio.saldo)).replace("R$", "").trim()}
            className="w-32 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm" />
          <Button size="sm" onClick={acertar}>Registrar</Button>
          {msg && <span className="text-sm text-red-600">{msg}</span>}
        </div>
      )}
    </Cartao>
  );
}

function Pedidos({ pedidos, onFeito }: { pedidos: Resumo["pedidos"]; onFeito: () => void }) {
  const faltando = pedidos.filter((p) => !p.encontradoEm);
  const lancar = async (pagamentoId: string, destino: "caixa" | "socio") => {
    await fetch("/api/admin/financeiro/pedidos", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pagamentoId, destino }),
    });
    onFeito();
  };
  return (
    <Cartao>
      <h2 className="font-semibold text-[var(--text)]">Pedidos do site × extratos</h2>
      <p className="text-xs text-[var(--text-muted)] mt-1 mb-3">
        Cada pagamento registrado em Pedidos é procurado nos extratos (mesmo valor, até 5 dias depois).
        {pedidos.length > 0 && ` ${pedidos.length - faltando.length} de ${pedidos.length} encontrados.`}
      </p>
      {pedidos.length === 0 ? <p className="text-sm text-[var(--text-muted)]">Nenhum pagamento de pedido neste mês.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-[var(--text-muted)]">
              <th className="py-1">Data</th><th>Pedido</th><th>Cliente</th><th className="text-right">Valor</th><th className="pl-4">Onde entrou</th>
            </tr></thead>
            <tbody>
              {pedidos.map((p) => (
                <tr key={p.pagamentoId} className="border-t border-[var(--border)] align-top">
                  <td className="py-2">{dm(p.data)}</td>
                  <td className="py-2">#{p.pedido}</td>
                  <td className="py-2 text-[var(--text-secondary)]">{p.cliente}</td>
                  <td className="py-2 text-right font-medium">{brl(p.valor)}</td>
                  <td className="py-2 pl-4">
                    {p.encontradoEm ? (
                      <span className="text-green-600">{p.encontradoEm.conta} · {dm(p.encontradoEm.data)}</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-amber-600">Não achei ({p.metodo})</span>
                        <Button size="sm" variant="outline" onClick={() => lancar(p.pagamentoId, "caixa")}>Recebi em dinheiro</Button>
                        <Button size="sm" variant="outline" onClick={() => lancar(p.pagamentoId, "socio")}>Caiu na minha conta pessoal</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {faltando.length > 0 && (
        <p className="text-xs text-[var(--text-muted)] mt-3">
          Se o dinheiro caiu numa conta PJ, importe o extrato dela: a conferência é refeita sozinha.
        </p>
      )}
    </Cartao>
  );
}
