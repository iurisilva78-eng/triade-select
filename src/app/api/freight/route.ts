import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { lookupCep, calculateFreight } from "@/lib/freight";

const schema = z.object({
  cep: z.string().min(8).max(9),
  weightGrams: z.number().positive(),
  heightCm: z.number().positive(),
  widthCm: z.number().positive(),
  lengthCm: z.number().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const address = await lookupCep(data.cep);
    if (!address) {
      return NextResponse.json({ error: "CEP inválido ou não encontrado." }, { status: 400 });
    }

    const options = await calculateFreight({ cepDestino: data.cep, ...data });

    return NextResponse.json({ address, options });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues?.[0]?.message ?? err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao calcular frete." }, { status: 500 });
  }
}
