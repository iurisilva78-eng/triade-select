import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { code, orderTotal } = await req.json();
  if (!code) return NextResponse.json({ error: "Informe o código." }, { status: 400 });

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });

  if (!coupon || !coupon.active) return NextResponse.json({ error: "Cupom inválido ou inativo." }, { status: 404 });
  if (coupon.expiresAt && new Date() > coupon.expiresAt) return NextResponse.json({ error: "Cupom expirado." }, { status: 400 });
  if (coupon.maxUses !== null && coupon.uses >= coupon.maxUses) return NextResponse.json({ error: "Cupom esgotado." }, { status: 400 });
  if (orderTotal < coupon.minOrderValue) return NextResponse.json({
    error: `Pedido mínimo de R$ ${coupon.minOrderValue.toFixed(2).replace(".", ",")} para usar este cupom.`,
  }, { status: 400 });

  let discount = 0;
  if (coupon.type === "percent") {
    discount = (orderTotal * coupon.value) / 100;
  } else if (coupon.type === "fixed") {
    discount = Math.min(coupon.value, orderTotal);
  } else if (coupon.type === "shipping") {
    // Frete grátis — retorna valor especial, quem aplica é o checkout
    discount = coupon.value; // valor máximo de desconto no frete
  }

  return NextResponse.json({
    ok: true,
    couponId: coupon.id,
    code: coupon.code,
    type: coupon.type,
    discount: Math.round(discount * 100) / 100,
    description: coupon.description,
  });
}
