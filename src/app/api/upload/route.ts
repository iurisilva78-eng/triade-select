import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Formato inválido. Use PNG, JPG ou WebP." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 10 MB." }, { status: 400 });
  }

  // Produção: usar imgBB se a chave estiver configurada
  const imgbbKey = process.env.IMGBB_API_KEY;
  if (imgbbKey) {
    try {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");

      const body = new URLSearchParams();
      body.append("key", imgbbKey);
      body.append("image", base64);
      body.append("name", `produto_${randomUUID()}`);

      const res = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body,
      });

      const data = await res.json();
      if (!data.success) {
        return NextResponse.json({ error: "Erro no upload da imagem." }, { status: 500 });
      }

      return NextResponse.json({ url: data.data.url, filename: data.data.title });
    } catch (err) {
      console.error("imgBB upload error:", err);
      return NextResponse.json({ error: "Erro ao enviar imagem." }, { status: 500 });
    }
  }

  // Desenvolvimento: salvar localmente
  try {
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split(".").pop() ?? "png";
    const filename = `${randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}`, filename });
  } catch (err) {
    console.error("Local upload error:", err);
    return NextResponse.json(
      { error: "Configure IMGBB_API_KEY no Netlify para upload de imagens em produção. Crie uma conta grátis em imgbb.com." },
      { status: 500 }
    );
  }
}
