import { CheckCircle, XCircle, ExternalLink, Server, Database, Globe, GitBranch, MessageSquare, Package, Shield, Zap } from "lucide-react";

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? (
        <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
      ) : (
        <XCircle size={14} className="text-red-400 flex-shrink-0" />
      )}
      <span className={`text-sm ${ok ? "text-[var(--text)]" : "text-[var(--text-muted)]"}`}>{label}</span>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center">
          <Icon size={15} className="text-[var(--gold)]" />
        </div>
        <h2 className="font-bold text-[var(--text)] text-sm">{title}</h2>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
      <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-medium text-[var(--text)] ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function EnvVar({ name, set }: { name: string; set: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <code className="text-xs text-[var(--text-muted)] font-mono">{name}</code>
      {set ? (
        <span className="text-[10px] font-mono px-2 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full">
          configurada
        </span>
      ) : (
        <span className="text-[10px] font-mono px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full">
          não configurada
        </span>
      )}
    </div>
  );
}

export default function InfraestruturaPage() {
  const env = {
    DATABASE_URL:         !!process.env.DATABASE_URL,
    NEXTAUTH_SECRET:      !!process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL:         !!process.env.NEXTAUTH_URL,
    IMGBB_API_KEY:        !!process.env.IMGBB_API_KEY,
    MELHOR_ENVIO_TOKEN:   !!process.env.MELHOR_ENVIO_TOKEN,
    WHATSAPP_PROVIDER:    !!process.env.WHATSAPP_PROVIDER,
    WHATSAPP_API_URL:     !!process.env.WHATSAPP_API_URL,
    WHATSAPP_CLIENT_TOKEN:!!process.env.WHATSAPP_CLIENT_TOKEN,
    WHATSAPP_EVO_BASE_URL:!!process.env.WHATSAPP_EVO_BASE_URL,
    WHATSAPP_EVO_INSTANCE:!!process.env.WHATSAPP_EVO_INSTANCE,
    WHATSAPP_EVO_API_KEY: !!process.env.WHATSAPP_EVO_API_KEY,
  };

  const allCritical = env.DATABASE_URL && env.NEXTAUTH_SECRET;
  const whatsappOk  = env.WHATSAPP_PROVIDER && (env.WHATSAPP_CLIENT_TOKEN || env.WHATSAPP_EVO_API_KEY);
  const freteOk     = env.MELHOR_ENVIO_TOKEN;
  const uploadOk    = env.IMGBB_API_KEY;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-1">Infraestrutura</h1>
        <p className="text-[var(--text-muted)] text-sm">Visão geral dos serviços, integrações e status do ambiente.</p>
      </div>

      {/* Status geral */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Sistema core",    ok: allCritical,  icon: Shield },
          { label: "WhatsApp",        ok: !!whatsappOk, icon: MessageSquare },
          { label: "Frete (real)",    ok: !!freteOk,    icon: Package },
          { label: "Upload de imagem",ok: !!uploadOk,   icon: Zap },
        ].map(({ label, ok, icon: Icon }) => (
          <div
            key={label}
            className={`rounded-2xl border p-4 flex flex-col gap-2 ${
              ok
                ? "bg-green-500/5 border-green-500/20"
                : "bg-red-500/5 border-red-500/20"
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon size={14} className={ok ? "text-green-400" : "text-red-400"} />
              <span className={`text-[10px] font-mono uppercase tracking-wider ${ok ? "text-green-400" : "text-red-400"}`}>
                {ok ? "OK" : "Atenção"}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-medium">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Hospedagem */}
        <Card title="Hospedagem — Vercel" icon={Server}>
          <Row label="Plataforma"  value="Vercel" />
          <Row label="Framework"   value="Next.js 16 (App Router)" />
          <Row label="Região"      value="São Paulo / Global Edge" />
          <Row label="Deploy"      value="GitHub → Vercel (automático)" />
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-[var(--gold)] hover:opacity-80 transition-opacity mt-1"
          >
            Abrir painel Vercel <ExternalLink size={11} />
          </a>
        </Card>

        {/* Domínio */}
        <Card title="Domínio — Hostgator" icon={Globe}>
          <Row label="Domínio"       value="triadeselect.com.br" />
          <Row label="DNS"           value="Gerenciado no Hostgator" />
          <Row label="A record"      value="216.198.79.1 (Vercel)" mono />
          <Row label="CNAME www"     value="*.vercel-dns-017.com" mono />
          <StatusBadge ok label="SSL/HTTPS ativo (Let's Encrypt via Vercel)" />
          <StatusBadge ok label="Redirecionamento www → raiz configurado" />
          <a
            href="https://cpanel.hostgator.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-[var(--gold)] hover:opacity-80 transition-opacity mt-1"
          >
            Abrir cPanel Hostgator <ExternalLink size={11} />
          </a>
        </Card>

        {/* Repositório */}
        <Card title="Repositório — GitHub" icon={GitBranch}>
          <Row label="Organização" value="iurisilva78-eng" />
          <Row label="Repositório" value="triade-select" />
          <Row label="Branch main" value="master" mono />
          <Row label="CI/CD"       value="Push → deploy automático no Vercel" />
          <a
            href="https://github.com/iurisilva78-eng/triade-select"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-[var(--gold)] hover:opacity-80 transition-opacity mt-1"
          >
            Abrir repositório <ExternalLink size={11} />
          </a>
        </Card>

        {/* Banco de dados */}
        <Card title="Banco de Dados — PostgreSQL" icon={Database}>
          <Row label="ORM"       value="Prisma 7" />
          <Row label="Adapter"   value="@prisma/adapter-pg" />
          <Row label="Modelos"   value="User · Product · Order · Coupon · SiteConfig · Notification" />
          <StatusBadge ok={env.DATABASE_URL} label={env.DATABASE_URL ? "DATABASE_URL configurada" : "DATABASE_URL não configurada"} />
        </Card>

        {/* WhatsApp */}
        <Card title="WhatsApp — Notificações" icon={MessageSquare}>
          <Row label="Provedores suportados" value="Evolution API · Z-API · Meta Cloud API" />
          <StatusBadge ok={!!whatsappOk} label={whatsappOk ? "Variáveis de WhatsApp configuradas" : "WhatsApp não configurado"} />
          <p className="text-xs text-[var(--text-muted)]">
            Configure as credenciais em <strong>Configurações → WhatsApp</strong> no admin.
          </p>
        </Card>

        {/* Frete */}
        <Card title="Frete — Melhor Envio" icon={Package}>
          <Row label="Origem (CEP)"     value="86700-160 — Londrina/PR" />
          <Row label="Embalagem"        value="2×15×20 cm · 0,30 kg" />
          <Row label="Seguro"           value="R$ 50,00" />
          <StatusBadge ok={!!freteOk} label={freteOk ? "MELHOR_ENVIO_TOKEN configurado — preços reais" : "Token não configurado — usando estimativa"} />
          {!freteOk && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-400 leading-relaxed">
              Configure a variável <code className="font-mono">MELHOR_ENVIO_TOKEN</code> no Vercel (Settings → Environment Variables) com seu token do Melhor Envio para exibir preços e prazos reais.
            </div>
          )}
          <a
            href="https://melhorenvio.com.br/painel/gerenciar/tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-[var(--gold)] hover:opacity-80 transition-opacity"
          >
            Gerar token Melhor Envio <ExternalLink size={11} />
          </a>
        </Card>

        {/* Upload */}
        <Card title="Upload de Imagens — ImgBB" icon={Zap}>
          <StatusBadge ok={!!uploadOk} label={uploadOk ? "IMGBB_API_KEY configurada — produção" : "Sem IMGBB_API_KEY — salvando em disco (desenvolvimento)"} />
          {!uploadOk && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-400 leading-relaxed">
              Configure <code className="font-mono">IMGBB_API_KEY</code> no Vercel para que uploads de imagens funcionem em produção.
            </div>
          )}
          <a
            href="https://api.imgbb.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-[var(--gold)] hover:opacity-80 transition-opacity"
          >
            Gerar API key ImgBB <ExternalLink size={11} />
          </a>
        </Card>

        {/* Variáveis de ambiente */}
        <Card title="Variáveis de Ambiente" icon={Shield}>
          <p className="text-xs text-[var(--text-muted)] mb-1">Configure no Vercel → Settings → Environment Variables</p>
          <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-1">
            {Object.entries(env).map(([name, set]) => (
              <EnvVar key={name} name={name} set={set} />
            ))}
          </div>
        </Card>

      </div>

      {/* Links rápidos */}
      <div className="mt-8 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <h2 className="font-bold text-[var(--text)] text-sm mb-4">Links rápidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {[
            { label: "Vercel Dashboard",      url: "https://vercel.com/dashboard" },
            { label: "GitHub Repositório",    url: "https://github.com/iurisilva78-eng/triade-select" },
            { label: "Hostgator cPanel",      url: "https://cpanel.hostgator.com.br" },
            { label: "Melhor Envio Painel",   url: "https://melhorenvio.com.br/painel" },
            { label: "ImgBB API",             url: "https://api.imgbb.com/" },
            { label: "Site (produção)",       url: "https://triadeselect.com.br" },
            { label: "Prisma Studio (local)", url: "http://localhost:5555" },
            { label: "Loja",                  url: "/produtos" },
          ].map(({ label, url }) => (
            <a
              key={label}
              href={url}
              target={url.startsWith("http") ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:text-[var(--gold)] hover:border-[var(--gold)]/40 transition-colors"
            >
              {label}
              <ExternalLink size={11} className="flex-shrink-0 opacity-60" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
