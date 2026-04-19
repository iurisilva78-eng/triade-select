import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

const CONFIG_KEY = "mockup_positions";

export async function GET() {
  try {
    const row = await prisma.siteConfig.findUnique({ where: { key: CONFIG_KEY } });
    if (!row) return NextResponse.json(null);
    return NextResponse.json(JSON.parse(row.value));
  } catch {
    return NextResponse.json(null);
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = await req.json();

  await prisma.siteConfig.upsert({
    where: { key: CONFIG_KEY },
    create: {
      key: CONFIG_KEY,
      value: JSON.stringify(body),
      label: "Posições dos Mockups",
      type: "json",
      section: "mockups",
    },
    update: { value: JSON.stringify(body) },
  });

  return NextResponse.json({ success: true });
}
