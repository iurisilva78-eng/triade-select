"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus, Trash2, Bell, BellOff, Save, Check,
  Users, RefreshCw, ChevronDown, Wifi, WifiOff, Send, Eye, EyeOff, Smartphone, QrCode,
} from "lucide-react";

interface NotifPhone { id: string; name: string; phone: string; active: boolean; }

type Provider = "zapi" | "evolution" | "meta";

export default function ConfiguracoesPage() {
  const [phones, setPhones] = useState<NotifPhone[]>([]);
  const [loadingPhones, setLoadingPhones] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  /* ── Provider ── */
  const [provider, setProvider] = useState<Provider>("zapi");

  /* ── Z-API ── */
  const [zapiUrl, setZapiUrl] = useState("");
  const [zapiToken, setZapiToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  /* ── Evolution API ── */
  const [evoBaseUrl, setEvoBaseUrl] = useState("");
  const [evoInstance, setEvoInstance] = useState("triade-select");
  const [evoApiKey, setEvoApiKey] = useState("");
  const [showEvoKey, setShowEvoKey] = useState(false);

  /* ── Meta WhatsApp Cloud API ── */
  const [metaPhoneId, setMetaPhoneId] = useState("");
  const [metaToken, setMetaToken] = useState("");
  const [showMetaToken, setShowMetaToken] = useState(false);

  /* ── QR / Status ── */
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connStatus, setConnStatus] = useState<"unknown" | "connected" | "disconnected">("unknown");
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const qrInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Pairing Code ── */
  const [pairingPhone, setPairingPhone] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [loadingPairing, setLoadingPairing] = useState(false);
  const [pairingError, setPairingError] = useState<string | null>(null);

  /* ── Diagnóstico Meta ── */
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagResult, setDiagResult] = useState<{ ok: boolean; data?: any; error?: string; hint?: string } | null>(null);

  /* ── Save / Test ── */
  const [savingApi, setSavingApi] = useState(false);
  const [savedApi, setSavedApi] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  /* ── Grupo ── */
  const [groupId, setGroupId] = useState("");
  const [savingGroup, setSavingGroup] = useState(false);
  const [savedGroup, setSavedGroup] = useState(false);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState("");
  const [showGroupList, setShowGroupList] = useState(false);

  /* ── PIN do vendedor ── */
  const [vendorPin, setVendorPin] = useState("");
  const [savingPin, setSavingPin] = useState(false);
  const [savedPin, setSavedPin] = useState(false);

  /* ── Load ── */
  const loadPhones = () => {
    fetch("/api/admin/notification-phones").then(r => r.json()).then(d => { setPhones(d); setLoadingPhones(false); });
  };

  const loadConfig = async () => {
    const r = await fetch("/api/admin/site-config");
    const data: any[] = await r.json();
    const g = (k: string) => data.find((d: any) => d.key === k)?.value ?? "";
    const savedProvider = g("whatsapp_provider") as Provider;
    if (savedProvider) setProvider(savedProvider);
    setZapiUrl(g("whatsapp_api_url"));
    setZapiToken(g("whatsapp_client_token"));
    setEvoBaseUrl(g("whatsapp_evo_base_url"));
    setEvoInstance(g("whatsapp_evo_instance") || "triade-select");
    setEvoApiKey(g("whatsapp_evo_api_key"));
    setMetaPhoneId(g("whatsapp_meta_phone_id"));
    setMetaToken(g("whatsapp_meta_token"));
    if (g("whatsapp_group_id")) setGroupId(g("whatsapp_group_id"));
    if (g("vendor_pin")) setVendorPin(g("vendor_pin"));
    return { provider: savedProvider, evoBaseUrl: g("whatsapp_evo_base_url"), evoApiKey: g("whatsapp_evo_api_key") };
  };

  useEffect(() => {
    loadPhones();
    loadConfig().then(async ({ provider: p, evoBaseUrl: url, evoApiKey: key }) => {
      // Se as credenciais não estão no banco, tenta importar das env vars automaticamente
      if (!url || !key) {
        await fetch("/api/admin/init-whatsapp", { method: "POST" });
        const cfg = await loadConfig();
        // Auto-verifica status se Evolution estiver configurada após seed
        if ((cfg.provider || "evolution") === "evolution" && cfg.evoBaseUrl && cfg.evoApiKey) {
          setTimeout(() => checkStatus(), 400);
        }
      } else if ((p || "evolution") === "evolution" && url && key) {
        setTimeout(() => checkStatus(), 800);
      }
    }).catch(() => {});
  }, []);

  /* ── Salvar credenciais ── */
  const handleSaveApi = async () => {
    setSavingApi(true); setSavedApi(false);
    const pairs =
      provider === "meta"
        ? [
            { key: "whatsapp_provider",      value: "meta" },
            { key: "whatsapp_meta_phone_id", value: metaPhoneId.trim() },
            { key: "whatsapp_meta_token",    value: metaToken.trim() },
          ]
        : provider === "evolution"
        ? [
            { key: "whatsapp_provider",    value: "evolution" },
            { key: "whatsapp_evo_base_url", value: evoBaseUrl.trim().replace(/\/$/, "") },
            { key: "whatsapp_evo_instance", value: evoInstance.trim() },
            { key: "whatsapp_evo_api_key",  value: evoApiKey.trim() },
          ]
        : [
            { key: "whatsapp_provider",     value: "zapi" },
            { key: "whatsapp_api_url",      value: zapiUrl.trim() },
            { key: "whatsapp_client_token", value: zapiToken.trim() },
          ];
    await fetch("/api/admin/site-config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(pairs) });
    setSavingApi(false); setSavedApi(true);
    setTimeout(() => setSavedApi(false), 3000);
  };

  /* ── QR Code / Status (Evolution) ── */
  const checkStatus = async () => {
    setLoadingQr(true);
    setQrError(null);
    try {
      const res = await fetch("/api/admin/whatsapp-qr");
      const data = await res.json();
      if (!res.ok) {
        setQrError(data.error ?? `Erro ${res.status} ao verificar status.`);
        setConnStatus("disconnected");
        return;
      }
      if (data.status === "connected") {
        setConnStatus("connected"); setQrCode(null);
        if (qrInterval.current) { clearInterval(qrInterval.current); qrInterval.current = null; }
      } else {
        setConnStatus("disconnected");
        setQrCode(data.qrCode ?? null);
        if (!data.qrCode) setQrError("QR Code não retornado pela Evolution API. Verifique se a instância existe.");
      }
    } catch (err: any) {
      setQrError("Falha de rede ao contatar a API. Verifique a URL da Evolution API.");
      setConnStatus("disconnected");
    } finally { setLoadingQr(false); }
  };

  const handleConnectEvolution = async () => {
    setLoadingQr(true);
    setQrError(null);
    // Cria instância (ou confirma que já existe)
    const postRes = await fetch("/api/admin/whatsapp-qr", { method: "POST" });
    if (!postRes.ok) {
      const postData = await postRes.json();
      setQrError(postData.error ?? `Erro ${postRes.status} ao criar instância.`);
      setLoadingQr(false);
      return;
    }
    await checkStatus();
    // Poll a cada 5s para detectar quando o QR foi escaneado
    if (qrInterval.current) clearInterval(qrInterval.current);
    qrInterval.current = setInterval(async () => {
      const res = await fetch("/api/admin/whatsapp-qr");
      const data = await res.json();
      if (data.status === "connected") {
        setConnStatus("connected"); setQrCode(null);
        clearInterval(qrInterval.current!); qrInterval.current = null;
      } else { setQrCode(data.qrCode ?? null); }
    }, 5000);
  };

  const handleGetPairingCode = async () => {
    if (!pairingPhone.trim()) return;
    setLoadingPairing(true);
    setPairingError(null);
    setPairingCode(null);
    try {
      const phone = pairingPhone.replace(/\D/g, "");
      const fullPhone = phone.startsWith("55") ? phone : `55${phone}`;
      const res = await fetch("/api/admin/whatsapp-qr", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullPhone }),
      });
      const data = await res.json();
      if (!res.ok || !data.pairingCode) {
        setPairingError(data.error ?? "Código não retornado pela API.");
      } else {
        setPairingCode(data.pairingCode);
        // Poll para detectar quando conectar
        if (qrInterval.current) clearInterval(qrInterval.current);
        qrInterval.current = setInterval(async () => {
          const r = await fetch("/api/admin/whatsapp-qr");
          const d = await r.json();
          if (d.status === "connected") {
            setConnStatus("connected");
            setPairingCode(null);
            clearInterval(qrInterval.current!);
            qrInterval.current = null;
          }
        }, 5000);
      }
    } catch {
      setPairingError("Falha de rede ao contatar a API.");
    } finally {
      setLoadingPairing(false);
    }
  };

  /* ── Diagnóstico Meta ── */
  const handleMetaDiag = async () => {
    setDiagLoading(true); setDiagResult(null);
    const res = await fetch("/api/admin/whatsapp-test");
    const data = await res.json();
    setDiagLoading(false);
    if (res.ok) {
      setDiagResult({ ok: true, data });
    } else {
      setDiagResult({ ok: false, error: data.error, hint: data.hint });
    }
  };

  /* ── Verificar credenciais ── */
  const handleVerifyCredentials = async () => {
    setVerifying(true);
    setVerifyResult(null);
    try {
      if (provider === "meta") {
        // Verifica credenciais Meta diretamente
        if (!metaPhoneId || !metaToken) {
          setVerifyResult({ ok: false, msg: "Preencha o Phone Number ID e o Access Token." });
          setVerifying(false);
          return;
        }
        const res = await fetch(
          `https://graph.facebook.com/v20.0/${metaPhoneId}`,
          { headers: { Authorization: `Bearer ${metaToken}` } }
        );
        const data = await res.json();
        if (res.ok && data?.id) {
          setVerifyResult({ ok: true, msg: `✓ Credenciais válidas! Número: ${data?.display_phone_number ?? data.id}` });
        } else {
          setVerifyResult({ ok: false, msg: `Token inválido ou Phone ID incorreto. Resposta: ${data?.error?.message ?? JSON.stringify(data).slice(0, 100)}` });
        }
      } else {
        const res = await fetch("/api/admin/whatsapp-qr");
        const data = await res.json();
        if (res.ok) {
          setVerifyResult({ ok: true, msg: data.status === "connected" ? "✓ Conectado e funcionando!" : "✓ Credenciais válidas — WhatsApp não conectado ainda." });
        } else {
          setVerifyResult({ ok: false, msg: data.error ?? `Erro ${res.status}` });
        }
      }
    } catch {
      setVerifyResult({ ok: false, msg: "Falha de rede ao verificar credenciais." });
    } finally { setVerifying(false); }
  };

  useEffect(() => () => { if (qrInterval.current) clearInterval(qrInterval.current); }, []);

  /* ── Teste ── */
  const handleTest = async () => {
    if (!testPhone.trim()) return;
    setTesting(true); setTestResult(null);
    const res = await fetch("/api/admin/whatsapp-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: testPhone.trim() }) });
    const data = await res.json();
    setTesting(false);
    setTestResult(res.ok ? { ok: true, msg: "Mensagem enviada! Verifique o WhatsApp." } : { ok: false, msg: data.error ?? "Falha." });
  };

  /* ── Grupos ── */
  const handleFetchGroups = async () => {
    setLoadingGroups(true); setGroupsError(""); setShowGroupList(false);
    const res = await fetch("/api/admin/whatsapp-groups");
    const data = await res.json();
    setLoadingGroups(false);
    if (!res.ok) setGroupsError(data.error ?? "Erro."); else { setGroups(data); setShowGroupList(true); }
  };

  const handleSaveGroup = async () => {
    setSavingGroup(true);
    await fetch("/api/admin/site-config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify([{ key: "whatsapp_group_id", value: groupId.trim() }]) });
    setSavingGroup(false); setSavedGroup(true); setTimeout(() => setSavedGroup(false), 3000);
  };

  const handleSavePin = async () => {
    if (!vendorPin.trim()) return;
    setSavingPin(true);
    await fetch("/api/admin/site-config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify([{ key: "vendor_pin", value: vendorPin.trim(), label: "PIN do Vendedor", type: "text", section: "vendedor" }]) });
    setSavingPin(false); setSavedPin(true); setTimeout(() => setSavedPin(false), 3000);
  };

  const handleAdd = async () => {
    if (!name.trim() || !phone.trim()) { setPhoneError("Preencha nome e telefone."); return; }
    setAdding(true); setPhoneError("");
    const res = await fetch("/api/admin/notification-phones", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone }) });
    const data = await res.json();
    setAdding(false);
    if (!res.ok) { setPhoneError(data.error ?? "Erro."); return; }
    setName(""); setPhone(""); loadPhones();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover?")) return;
    await fetch(`/api/admin/notification-phones?id=${id}`, { method: "DELETE" });
    loadPhones();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await fetch("/api/admin/notification-phones", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, active: !active }) });
    loadPhones();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Configurações</h1>
      <p className="text-[var(--text-muted)] text-sm mb-8">Notificações e integrações de WhatsApp.</p>

      {/* ── Provedor de WhatsApp ── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Smartphone size={16} className="text-[var(--gold)]" />
          <h2 className="font-bold text-[var(--text)]">Provedor de WhatsApp</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-5">Escolha como as notificações serão enviadas.</p>

        {/* Tabs provider */}
        <div className="flex flex-wrap gap-2 mb-5">
          {([
            ["meta",      "Meta (gratuito ✨)"],
            ["evolution", "Evolution API"],
            ["zapi",      "Z-API (pago)"],
          ] as const).map(([val, label]) => (
            <button key={val} onClick={() => setProvider(val)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${provider === val ? "bg-[var(--gold)] text-black border-[var(--gold)]" : "bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--gold)]/50"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Meta WhatsApp Cloud API fields */}
        {provider === "meta" && (
          <div className="space-y-4">

            {/* Guia: número de teste vs número real */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-xs text-green-300 space-y-3">
              <p className="font-bold text-green-200 text-sm">✅ Meta WhatsApp Cloud API — 100% gratuita</p>

              <div>
                <p className="font-semibold text-green-200 mb-1">📋 Configuração inicial (número de teste):</p>
                <ol className="list-decimal list-inside space-y-1 text-green-400">
                  <li>Acesse <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="underline">developers.facebook.com</a> → crie app tipo "Business"</li>
                  <li>Adicione o produto <strong>WhatsApp</strong> → <strong>Configuração da API</strong></li>
                  <li>Copie o <strong>Phone Number ID</strong> e o <strong>Token de acesso temporário</strong></li>
                  <li>Cole abaixo e salve — funciona imediatamente com o número de teste</li>
                </ol>
              </div>

              <div className="border-t border-green-500/20 pt-3">
                <p className="font-semibold text-amber-300 mb-1">📱 Para usar seu número real (chip próprio):</p>
                <ol className="list-decimal list-inside space-y-1 text-amber-400/80">
                  <li><strong className="text-amber-300">O número NÃO pode estar ativo no WhatsApp pessoal.</strong><br />
                    Se estiver, você deve excluir a conta WhatsApp nesse chip ou usar um chip dedicado.</li>
                  <li>Em <a href="https://business.facebook.com" target="_blank" rel="noreferrer" className="underline text-amber-300">business.facebook.com</a> → crie ou selecione uma <strong>Conta WhatsApp Business</strong></li>
                  <li>No app Meta for Developers → WhatsApp → <strong>Gerenciar números</strong> → "Adicionar número de telefone"</li>
                  <li>Informe o nome da empresa e o número, depois <strong>verifique via SMS ou ligação</strong></li>
                  <li>Após verificação, o novo <strong>Phone Number ID</strong> aparece na lista — copie e salve abaixo</li>
                  <li>Para token permanente: <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noreferrer" className="underline text-amber-300">Meta Business Suite → System Users</a> → crie usuário com permissão <code>whatsapp_business_messaging</code> → gere token</li>
                </ol>
              </div>

              <div className="border-t border-green-500/20 pt-3">
                <p className="font-semibold text-red-300 mb-1">⚠️ O token temporário expira em 24h</p>
                <p className="text-red-400/80">Sempre use um token de System User permanente em produção. O token temporário da tela de Configuração da API é apenas para testes.</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">Phone Number ID</label>
              <input
                type="text"
                placeholder="Ex: 123456789012345"
                value={metaPhoneId}
                onChange={e => { setMetaPhoneId(e.target.value); setDiagResult(null); }}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-[var(--gold)]"
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Encontrado em: Meta for Developers → WhatsApp → Configuração da API → "ID do número de telefone"
              </p>
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">Access Token</label>
              <div className="relative">
                <input
                  type={showMetaToken ? "text" : "password"}
                  placeholder="EAAxxxxxxxxxxxxx..."
                  value={metaToken}
                  onChange={e => { setMetaToken(e.target.value); setDiagResult(null); }}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-[var(--gold)] pr-12"
                />
                <button onClick={() => setShowMetaToken(!showMetaToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]">
                  {showMetaToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Diagnóstico do número */}
            {metaPhoneId && metaToken && (
              <div>
                <button
                  onClick={handleMetaDiag}
                  disabled={diagLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text-secondary)] hover:border-[var(--gold)] transition-colors"
                >
                  {diagLoading ? <RefreshCw size={14} className="animate-spin" /> : <Wifi size={14} />}
                  Diagnosticar número no Meta
                </button>
                {diagResult && (
                  <div className={`mt-3 rounded-xl border p-3 text-xs ${diagResult.ok ? "bg-green-500/10 border-green-500/30 text-green-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
                    {diagResult.ok ? (
                      <div className="space-y-1">
                        <p className="font-bold text-green-200">✅ Número verificado no Meta!</p>
                        <p>📱 <strong>Número:</strong> {diagResult.data.displayPhone}</p>
                        <p>🏷️ <strong>Nome verificado:</strong> {diagResult.data.verifiedName}</p>
                        <p>⭐ <strong>Qualidade:</strong> {diagResult.data.qualityRating}</p>
                        <p>🔄 <strong>Status:</strong> {diagResult.data.status}</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-bold text-red-200">❌ Erro no número</p>
                        <p className="text-red-400 whitespace-pre-wrap">{diagResult.error}</p>
                        {diagResult.hint && <p className="text-amber-300 mt-1">{diagResult.hint}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Z-API fields */}
        {provider === "zapi" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">URL da API (send-text)</label>
              <input type="text" placeholder="https://api.z-api.io/instances/INST/token/TOKEN/send-text"
                value={zapiUrl} onChange={e => setZapiUrl(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-[var(--gold)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">Client-Token</label>
              <div className="relative">
                <input type={showToken ? "text" : "password"} placeholder="Fabed6a7b3..."
                  value={zapiToken} onChange={e => setZapiToken(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-[var(--gold)] pr-12" />
                <button onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]">
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Evolution API fields */}
        {provider === "evolution" && (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300">
              <p className="font-semibold mb-1">📌 Como usar a Evolution API gratuitamente:</p>
              <ol className="list-decimal list-inside space-y-1 text-amber-400">
                <li>Acesse <a href="https://railway.com/deploy/evolution-api-4" target="_blank" rel="noreferrer" className="underline">railway.com/deploy/evolution-api-4</a> e faça deploy em 1 clique</li>
                <li>Após o deploy, copie a URL pública do serviço (ex: <code className="bg-black/30 px-1 rounded">https://evolution-xxx.up.railway.app</code>)</li>
                <li>A API Key está em <strong>Variables → AUTHENTICATION_API_KEY</strong></li>
                <li>Cole os dados abaixo, salve e clique em <strong>Gerar QR Code</strong></li>
              </ol>
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">URL base da Evolution API</label>
              <input type="text" placeholder="https://evolution-xxx.up.railway.app"
                value={evoBaseUrl} onChange={e => setEvoBaseUrl(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-[var(--gold)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">Nome da instância</label>
              <input type="text" placeholder="triade-select"
                value={evoInstance} onChange={e => setEvoInstance(e.target.value)}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)]" />
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">API Key (AUTHENTICATION_API_KEY)</label>
              <div className="relative">
                <input type={showEvoKey ? "text" : "password"} placeholder="Sua senha forte..."
                  value={evoApiKey} onChange={e => setEvoApiKey(e.target.value)}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-[var(--gold)] pr-12" />
                <button onClick={() => setShowEvoKey(!showEvoKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]">
                  {showEvoKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botão salvar + verificar */}
        <div className="flex flex-wrap gap-3 mt-5">
          <Button onClick={handleSaveApi} loading={savingApi} className="flex items-center gap-2">
            {savedApi ? <><Check size={14} /> Salvo!</> : <><Save size={14} /> Salvar credenciais</>}
          </Button>
          {provider === "evolution" && (
            <button
              onClick={handleVerifyCredentials}
              disabled={verifying || !evoBaseUrl || !evoApiKey}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--gold)] transition-colors disabled:opacity-40"
            >
              {verifying ? <RefreshCw size={14} className="animate-spin" /> : <Wifi size={14} />}
              Verificar credenciais
            </button>
          )}
        </div>
        {verifyResult && (
          <div className={`mt-3 flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${verifyResult.ok ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
            {verifyResult.ok ? <Wifi size={14} /> : <WifiOff size={14} />}
            {verifyResult.msg}
          </div>
        )}

        {/* Meta: nota sem QR */}
        {provider === "meta" && metaPhoneId && metaToken && (
          <div className="mt-5 pt-5 border-t border-[var(--border)]">
            <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <Smartphone size={20} className="text-green-400" />
              <div>
                <p className="text-sm font-semibold text-green-400">Meta API configurada</p>
                <p className="text-xs text-green-400/70">Não precisa de QR Code — a Meta gerencia a conexão pelo painel de desenvolvedores.</p>
              </div>
            </div>
          </div>
        )}

        {/* QR Code (Evolution) */}
        {provider === "evolution" && (
          <div className="mt-5 pt-5 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-[var(--text)] flex items-center gap-2">
                <QrCode size={16} className="text-[var(--gold)]" /> Conectar WhatsApp
              </p>
              {connStatus === "connected" && (
                <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Wifi size={11} /> Conectado
                </span>
              )}
            </div>

            {connStatus !== "connected" && (
              <>
                <button onClick={handleConnectEvolution} disabled={loadingQr || !evoBaseUrl || !evoInstance || !evoApiKey}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--gold)] transition-colors disabled:opacity-40">
                  {loadingQr ? <RefreshCw size={14} className="animate-spin" /> : <QrCode size={14} />}
                  {qrCode ? "Atualizar QR Code" : "Gerar QR Code para conectar"}
                </button>
                {(!evoBaseUrl || !evoApiKey) && (
                  <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                    ⚠️ Preencha e salve as credenciais da Evolution API acima antes de gerar o QR Code.
                  </p>
                )}

                {/* Pairing Code — alternativa ao QR */}
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <p className="text-xs text-[var(--text-muted)] mb-2 font-medium">Conectar via código (sem QR)</p>
                  <p className="text-xs text-[var(--text-muted)] mb-3 opacity-70">
                    Digite seu número do WhatsApp Business e clique em obter código. No celular: WhatsApp → Dispositivos conectados → Vincular com número de telefone → insira o código.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: 43988656471"
                      value={pairingPhone}
                      onChange={e => setPairingPhone(e.target.value.replace(/\D/g, ""))}
                      maxLength={13}
                      className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-3 py-2 text-sm outline-none focus:border-[var(--gold)]"
                    />
                    <button
                      onClick={handleGetPairingCode}
                      disabled={loadingPairing || !pairingPhone.trim() || !evoBaseUrl || !evoApiKey}
                      className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--gold)] transition-colors disabled:opacity-40 shrink-0"
                    >
                      {loadingPairing ? <RefreshCw size={14} className="animate-spin" /> : <span>Obter código</span>}
                    </button>
                  </div>
                  {pairingError && (
                    <p className="text-xs text-red-400 mt-2">{pairingError}</p>
                  )}
                  {pairingCode && (
                    <div className="mt-3 p-4 bg-[var(--gold)]/10 border border-[var(--gold)]/30 rounded-xl text-center">
                      <p className="text-xs text-[var(--text-muted)] mb-1">Digite este código no WhatsApp:</p>
                      <p className="text-3xl font-mono font-bold tracking-widest text-[var(--gold)]">{pairingCode}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-2 animate-pulse">Aguardando conexão…</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {connStatus === "connected" && (
              <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                <Wifi size={20} className="text-green-400" />
                <div>
                  <p className="text-sm font-semibold text-green-400">WhatsApp conectado!</p>
                  <p className="text-xs text-green-400/70">Notificações funcionando normalmente.</p>
                </div>
              </div>
            )}

            {qrError && (
              <div className="mt-3 flex items-start gap-2 text-sm px-4 py-3 rounded-xl border bg-red-500/10 border-red-500/30 text-red-400">
                <WifiOff size={14} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold mb-0.5">Erro ao contatar a Evolution API</p>
                  <p className="text-xs opacity-80">{qrError}</p>
                  <p className="text-xs opacity-60 mt-1">Dica: salve as credenciais e clique em "Verificar credenciais" para diagnóstico.</p>
                </div>
              </div>
            )}

            {qrCode && connStatus !== "connected" && (
              <div className="mt-4 text-center">
                <p className="text-xs text-[var(--text-muted)] mb-3">
                  Abra o WhatsApp no celular → Dispositivos conectados → Conectar dispositivo → Escaneie o QR abaixo:
                </p>
                <div className="inline-block bg-white p-3 rounded-xl">
                  {qrCode.startsWith("data:") ? (
                    <img src={qrCode} alt="QR Code" className="w-52 h-52" />
                  ) : (
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`} alt="QR Code" className="w-52 h-52" />
                  )}
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-2 animate-pulse">Aguardando scan… (atualiza automaticamente)</p>
              </div>
            )}
          </div>
        )}

        {/* Testar conexão */}
        <div className="mt-5 pt-5 border-t border-[var(--border)]">
          <p className="text-sm font-medium text-[var(--text)] mb-3">Testar conexão</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">Número de teste (DDD + número)</label>
              <input type="text" placeholder="Ex: 11999999999" value={testPhone} onChange={e => setTestPhone(e.target.value.replace(/\D/g, ""))} maxLength={13}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)]" />
            </div>
            <Button onClick={handleTest} loading={testing} disabled={!testPhone.trim()} className="flex items-center gap-2 shrink-0">
              <Send size={14} /> Enviar teste
            </Button>
          </div>
          {testResult && (
            <div className={`mt-3 flex items-center gap-2 text-sm px-4 py-3 rounded-xl border ${testResult.ok ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
              {testResult.ok ? <Wifi size={14} /> : <WifiOff size={14} />}
              {testResult.msg}
            </div>
          )}
        </div>
      </div>

      {/* ── Grupo de novos pedidos ── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Users size={16} className="text-[var(--gold)]" />
          <h2 className="font-bold text-[var(--text)]">Grupo de novos pedidos</h2>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-4">Cada novo pedido será enviado neste grupo do WhatsApp.</p>

        <div className="mb-3">
          <button onClick={handleFetchGroups} disabled={loadingGroups}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--gold)] transition-colors disabled:opacity-50">
            {loadingGroups ? <RefreshCw size={14} className="animate-spin" /> : <ChevronDown size={14} />}
            Buscar meus grupos do WhatsApp
          </button>
          {groupsError && <p className="text-red-400 text-xs mt-2">{groupsError}</p>}
        </div>

        {showGroupList && groups.length > 0 && (
          <div className="mb-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
            {groups.map(g => (
              <button key={g.id} onClick={() => { setGroupId(g.id); setShowGroupList(false); }}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-[var(--gold)]/10 transition-colors border-b border-[var(--border)] last:border-0 ${groupId === g.id ? "text-[var(--gold)] bg-[var(--gold)]/5" : "text-[var(--text-secondary)]"}`}>
                <span className="font-medium">{g.name}</span>
                <span className="block text-xs font-mono text-[var(--text-muted)] mt-0.5">{g.id}</span>
              </button>
            ))}
          </div>
        )}
        {showGroupList && groups.length === 0 && <p className="text-sm text-[var(--text-muted)] mb-3">Nenhum grupo encontrado.</p>}

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">ID do grupo</label>
            <input type="text" placeholder="Clique em 'Buscar grupos' ou cole o ID manualmente"
              value={groupId} onChange={e => setGroupId(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)] font-mono" />
          </div>
          <Button onClick={handleSaveGroup} loading={savingGroup} disabled={!groupId} className="flex items-center gap-2 shrink-0">
            {savedGroup ? <><Check size={14} /> Salvo!</> : <><Save size={14} /> Salvar</>}
          </Button>
        </div>
      </div>

      {/* ── Telefones individuais ── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-6">
        <h2 className="font-bold text-[var(--text)] mb-1">Telefones individuais</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">Receberão notificações de novos pedidos além do grupo.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">Nome</label>
            <input type="text" placeholder="Ex: Iuri (admin)" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)]" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">WhatsApp (com DDD)</label>
            <input type="text" placeholder="11999999999" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} maxLength={13}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)]" />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAdd} loading={adding} className="flex items-center gap-2">
              <Plus size={16} /> Adicionar
            </Button>
          </div>
        </div>
        {phoneError && <p className="text-red-400 text-sm mt-3">{phoneError}</p>}
      </div>

      {/* ── Lista de telefones ── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h2 className="font-bold text-[var(--text)]">Telefones cadastrados</h2>
        </div>
        {loadingPhones ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : phones.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum telefone cadastrado.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {phones.map(p => (
              <div key={p.id} className={`flex items-center justify-between px-5 py-4 ${!p.active ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${p.active ? "bg-green-400" : "bg-[var(--border)]"}`} />
                  <div>
                    <p className="font-medium text-[var(--text)] text-sm">{p.name}</p>
                    <p className="text-xs text-[var(--text-muted)] font-mono">{p.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggle(p.id, p.active)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${p.active ? "text-green-400 border-green-400/30 hover:bg-green-400/10" : "text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--gold)]"}`}>
                    {p.active ? <><Bell size={12} /> Ativo</> : <><BellOff size={12} /> Inativo</>}
                  </button>
                  <button onClick={() => handleDelete(p.id)}
                    className="p-2 rounded-xl text-red-400 hover:bg-red-400/10 border border-transparent hover:border-red-400/30 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── PIN do Vendedor ── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mt-6">
        <h2 className="font-bold text-[var(--text)] mb-1">Vendedor externo</h2>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          PIN de acesso para a interface simplificada de lançamento de pedidos ({" "}
          <a href="/vendedor" target="_blank" rel="noopener noreferrer" className="text-[var(--gold)] hover:underline">
            /vendedor
          </a>
          ). Padrão: <code className="font-mono">1234</code>.
        </p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs text-[var(--text-muted)] font-medium block mb-1.5">PIN (somente números)</label>
            <input
              type="text"
              placeholder="Ex: 5678"
              value={vendorPin}
              onChange={(e) => setVendorPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
              maxLength={8}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold)] font-mono tracking-widest"
            />
          </div>
          <Button onClick={handleSavePin} loading={savingPin} disabled={!vendorPin} className="flex items-center gap-2 shrink-0">
            {savedPin ? <><Check size={14} /> Salvo!</> : <><Save size={14} /> Salvar</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
