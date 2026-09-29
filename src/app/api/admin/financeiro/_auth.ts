import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export async function exigirAdmin() {
  const s = await getServerSession(authOptions);
  if (s && (s.user as { role?: string }).role === "ADMIN") return null;
  return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
}

export function erro(msg: string, err?: unknown, status = 500) {
  const e = err as { code?: string; message?: string } | undefined;
  return NextResponse.json({ error: msg, _raw: e ? { code: e.code, message: e.message } : undefined }, { status });
}

export const mesValido = (m: string | null) => (m && /^\d{4}-\d{2}$/.test(m) ? m : null);
