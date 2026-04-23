import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const isAdmin = async () => {
  const s = await getServerSession(authOptions);
  return s && (s.user as any).role === "ADMIN";
};

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const body = await req.json();
  const { code, description, type, value, minOrderValue, maxUses, expiresAt } = body;
  if (!code || !value) return NextResponse.json({ error: "Código e valor obrigatórios." }, { status: 400 });
  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        description: description ?? "",
        type: type ?? "percent",
        value: parseFloat(value),
        minOrderValue: parseFloat(minOrderValue ?? 0),
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    return NextResponse.json(coupon);
  } catch {
    return NextResponse.json({ error: "Código já existe." }, { status: 409 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { id, active } = await req.json();
  const coupon = await prisma.coupon.update({ where: { id }, data: { active } });
  return NextResponse.json(coupon);
}

export async function DELETE(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID obrigatório." }, { status: 400 });
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
