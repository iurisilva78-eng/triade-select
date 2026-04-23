import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWhatsAppConfig } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const cfg = await getWhatsAppConfig();

  try {
    if (cfg.provider === "evolution") {
      if (!cfg.evoBaseUrl || !cfg.evoInstance || !cfg.evoApiKey) {
        return NextResponse.json({ error: "Evolution API não configurada." }, { status: 400 });
      }
      const res = await fetch(
        `${cfg.evoBaseUrl}/group/fetchAllGroups/${cfg.evoInstance}?getParticipants=false`,
        { headers: { apikey: cfg.evoApiKey } }
      );
      if (!res.ok) return NextResponse.json({ error: `Erro Evolution API: ${res.status}` }, { status: 502 });
      const data = await res.json();
      const groups = Array.isArray(data) ? data : [];
      return NextResponse.json(
        groups.map((g: any) => ({ id: g.id, name: g.subject ?? g.id }))
      );
    }

    // Z-API
    if (!cfg.zapiUrl) return NextResponse.json({ error: "WhatsApp não configurado." }, { status: 400 });
    const base = cfg.zapiUrl.replace(/\/[^/]+$/, "");
    const res = await fetch(`${base}/groups`, {
      headers: { "Content-Type": "application/json", ...(cfg.zapiClientToken ? { "Client-Token": cfg.zapiClientToken } : {}) },
    });
    if (!res.ok) return NextResponse.json({ error: `Erro Z-API: ${res.status}` }, { status: 502 });
    const data = await res.json();
    const groups = Array.isArray(data) ? data : (data.groups ?? data.data ?? []);
    return NextResponse.json(
      groups.map((g: any) => ({ id: g.phone ?? g.id, name: g.name ?? g.subject ?? g.phone })).filter((g: any) => g.id)
    );
  } catch (err) {
    console.error("[whatsapp-groups]", err);
    return NextResponse.json({ error: "Erro ao buscar grupos." }, { status: 500 });
  }
}
