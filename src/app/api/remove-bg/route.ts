import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.REMOVEBG_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "REMOVEBG_API_KEY não configurada." }, { status: 503 });
  }

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Nenhuma imagem enviada." }, { status: 400 });
  }

  const body = new FormData();
  body.append("image_file", file);
  body.append("size", "auto");

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: { "X-Api-Key": apiKey },
    body,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Erro desconhecido");
    console.error("[remove-bg]", res.status, err);
    return NextResponse.json({ error: "Falha ao remover fundo." }, { status: 502 });
  }

  const buffer = await res.arrayBuffer();
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
