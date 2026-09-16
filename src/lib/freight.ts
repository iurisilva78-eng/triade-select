import { FreightOption } from "@/types";

const ORIGIN_CEP = "86700160";
const PACKAGE = { height: 2, width: 15, length: 20, weight: 0.3 };
const INSURANCE_VALUE = 50;

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
  params: { cepDestino: string }
): Promise<FreightOption[]> {
  const clean = params.cepDestino.replace(/\D/g, "");
  const token = process.env.MELHOR_ENVIO_TOKEN;

  if (token) {
    try {
      const res = await fetch(
        "https://melhorenvio.com.br/api/v2/me/shipment/calculate",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "Triade Select triadeselect.com.br suporte@triadeselect.com.br",
          },
          body: JSON.stringify({
            from: { postal_code: ORIGIN_CEP },
            to: { postal_code: clean },
            package: PACKAGE,
            options: {
              insurance_value: INSURANCE_VALUE,
              receipt: false,
              own_hand: false,
            },
          }),
        }
      );

      if (res.ok) {
        const services = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const options: FreightOption[] = (services as any[])
          .filter((s) => !s.error && s.price)
          .map((s) => ({
            service: String(s.id),
            name: `${s.company?.name ?? ""} ${s.name}`.trim(),
            price: parseFloat(s.price),
            deliveryDays: s.custom_delivery_time ?? s.delivery_time,
          }))
          .sort((a, b) => a.price - b.price);

        if (options.length > 0) return options;
      }
    } catch {
      // fall through to mock
    }
  }

  // Estimativa aproximada (configure MELHOR_ENVIO_TOKEN para valores reais)
  const base = 22;
  return [
    { service: "PAC", name: "PAC — Correios (estimativa)", price: base, deliveryDays: 10 },
    {
      service: "SEDEX",
      name: "SEDEX — Correios (estimativa)",
      price: parseFloat((base * 1.8).toFixed(2)),
      deliveryDays: 3,
    },
  ];
}
