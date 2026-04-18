import { FreightOption } from "@/types";

interface FreightCalcParams {
  cepDestino: string;
  weightGrams: number;
  heightCm: number;
  widthCm: number;
  lengthCm: number;
}

export async function lookupCep(cep: string): Promise<{
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
} | null> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;

    return {
      cep: data.cep,
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
    };
  } catch {
    return null;
  }
}

export async function calculateFreight(
  params: FreightCalcParams
): Promise<FreightOption[]> {
  // Integração com Melhor Envio ou tabela própria dos Correios
  // Por ora, usa tabela simplificada baseada no peso
  const { weightGrams } = params;
  const weightKg = weightGrams / 1000;

  // Valores aproximados — substitua por chamada real à API dos Correios/Melhor Envio
  const basePrice = 15 + weightKg * 8;

  return [
    {
      service: "PAC",
      name: "PAC (Econômico)",
      price: parseFloat(basePrice.toFixed(2)),
      deliveryDays: 10,
    },
    {
      service: "SEDEX",
      name: "SEDEX (Expresso)",
      price: parseFloat((basePrice * 1.8).toFixed(2)),
      deliveryDays: 3,
    },
  ];
}
