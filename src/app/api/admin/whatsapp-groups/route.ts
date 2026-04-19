import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const apiUrl = process.env.WHATSAPP_API_URL;
  const clientToken = process.env.WHATSAPP_CLIENT_TOKEN;

  if (!apiUrl) {
    return NextResponse.json({ error: "WHATSAPP_API_URL não configurado." }, { status: 400 });
  }

  // Deriva a URL base: remove o endpoint final (/send-text)
  const base = apiUrl.replace(/\/[^/]+$/, "");
  const groupsUrl = `${base}/groups`;

  try {
    const res = await fetch(groupsUrl, {
      headers: {
        "Content-Type": "application/json",
        ...(clientToken ? { "Client-Token": clientToken } : {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Erro Z-API: ${res.status} — ${text}` }, { status: 502 });
    }

    const data = await res.json();

    // Z-API retorna array de grupos com { phone, name, ... }
    const groups = Array.isArray(data) ? data : (data.groups ?? data.data ?? []);

    const list = groups.map((g: any) => ({
      id: g.phone ?? g.id ?? g.groupId,
      name: g.name ?? g.subject ?? g.phone,
    })).filter((g: any) => g.id);

    return NextResponse.json(list);
  } catch (err) {
    console.error("Erro ao buscar grupos Z-API:", err);
    return NextResponse.json({ error: "Erro ao conectar com Z-API." }, { status: 500 });
  }
}
