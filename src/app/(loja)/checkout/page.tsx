"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import type { FreightOption, AddressData } from "@/types";
import { MapPin, Truck, Check } from "lucide-react";

export default function CheckoutPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { items, total, clear } = useCartStore();

  const [cep, setCep] = useState("");
  const [address, setAddress] = useState<AddressData | null>(null);
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [freightOptions, setFreightOptions] = useState<FreightOption[]>([]);
  const [selectedFreight, setSelectedFreight] = useState<FreightOption | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [cepError, setCepError] = useState("");

  if (!session) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-xl font-bold text-[var(--text)] mb-2">Login necessário</p>
        <p className="text-[var(--text-secondary)] mb-6">Faça login para finalizar seu pedido.</p>
        <Link href="/login">
          <Button size="lg">Entrar</Button>
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    router.push("/carrinho");
    return null;
  }

  const subtotal = total();
  const freightCost = selectedFreight?.price ?? 0;
  const orderTotal = subtotal + freightCost;
  const minimumPayment = orderTotal * 0.5;

  const searchCep = async () => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) { setCepError("CEP inválido."); return; }

    setCepError("");
    setLoadingCep(true);
    setFreightOptions([]);
    setSelectedFreight(null);

    try {
      // Calcula com base no primeiro item (simplificado)
      const firstItem = items[0];
      const res = await fetch("/api/freight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cep: clean,
          weightGrams: 500,
          heightCm: 10,
          widthCm: 20,
          lengthCm: 30,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setCepError(data.error); return; }

      setAddress(data.address);
      setFreightOptions(data.options);
      setSelectedFreight(data.options[0]);
    } catch {
      setCepError("Erro ao calcular frete.");
    } finally {
      setLoadingCep(false);
    }
  };

  const handleFinalize = async () => {
    if (!address || !selectedFreight) {
      alert("Calcule o frete antes de continuar.");
      return;
    }
    if (!number) {
      alert("Informe o número do endereço.");
      return;
    }

    setLoadingOrder(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            hasCustomization: i.hasCustomization,
            logoUrl: i.logoUrl,
            logoFileName: i.logoFileName,
            notes: i.notes,
            selectedColor: i.selectedColor,
            selectedSize: i.selectedSize,
            selectedClosure: i.selectedClosure,
          })),
          cep: address.cep,
          street: address.street,
          number,
          complement,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          freightService: selectedFreight.service,
          freightCost: selectedFreight.price,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Erro ao criar pedido.");
        return;
      }

      clear();
      router.push(`/pedido/${data.id}`);
    } catch {
      alert("Erro ao finalizar pedido. Tente novamente.");
    } finally {
      setLoadingOrder(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-8">Finalizar Pedido</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Endereço */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
            <h2 className="font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-[var(--gold)]" /> Endereço de entrega
            </h2>

            <div className="flex gap-3 mb-4">
              <Input
                label="CEP"
                placeholder="00000-000"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                error={cepError}
                maxLength={9}
                className="max-w-40"
              />
              <div className="flex items-end">
                <Button
                  variant="secondary"
                  onClick={searchCep}
                  loading={loadingCep}
                  disabled={loadingCep}
                >
                  Buscar
                </Button>
              </div>
            </div>

            {address && (
              <div className="flex flex-col gap-3">
                <div className="bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-secondary)]">
                  {address.street}, {address.neighborhood} — {address.city}/{address.state}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Número"
                    placeholder="123"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    required
                  />
                  <Input
                    label="Complemento"
                    placeholder="Apto, sala..."
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Frete */}
          {freightOptions.length > 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
              <h2 className="font-bold text-[var(--text)] mb-4 flex items-center gap-2">
                <Truck size={18} className="text-[var(--gold)]" /> Forma de envio
              </h2>
              <div className="flex flex-col gap-3">
                {freightOptions.map((opt) => (
                  <button
                    key={opt.service}
                    onClick={() => setSelectedFreight(opt)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors text-left ${
                      selectedFreight?.service === opt.service
                        ? "border-[var(--gold)] bg-[var(--gold)]/5"
                        : "border-[var(--border)] hover:border-[var(--gold)]/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedFreight?.service === opt.service
                            ? "border-[var(--gold)] bg-[var(--gold)]"
                            : "border-[var(--border)]"
                        }`}
                      >
                        {selectedFreight?.service === opt.service && (
                          <Check size={10} className="text-black" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text)] text-sm">{opt.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          Prazo: {opt.deliveryDays} dias úteis
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-[var(--gold)]">
                      {formatCurrency(opt.price)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Resumo */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 h-fit">
          <h2 className="font-bold text-[var(--text)] mb-4">Resumo</h2>

          <div className="flex flex-col gap-3 mb-4">
            {items.map((item) => (
              <div key={item.productId} className="flex flex-col gap-0.5">
                <div className="flex justify-between text-sm">
                  <span className="truncate mr-2 font-medium text-[var(--text)]">{item.name} ×{item.quantity}</span>
                  <span className="text-[var(--gold)] font-bold shrink-0">{formatCurrency(item.unitPrice * item.quantity)}</span>
                </div>
                {item.hasCustomization && (
                  <span className="text-xs text-[var(--gold)]/70">✓ Com personalização</span>
                )}
                {(item.selectedColor || item.selectedSize || item.selectedClosure) && (
                  <span className="text-xs text-[var(--text-muted)]">
                    {[item.selectedColor, item.selectedSize, item.selectedClosure].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-[var(--border)] pt-3 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Frete ({selectedFreight?.name ?? "—"})</span>
              <span>{selectedFreight ? formatCurrency(freightCost) : "—"}</span>
            </div>
          </div>

          <div className="flex justify-between font-bold text-lg mt-3 mb-4">
            <span className="text-[var(--text)]">Total</span>
            <span className="text-[var(--gold)]">{formatCurrency(orderTotal)}</span>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-5">
            <p className="text-xs text-amber-300 font-semibold">Pagamento mínimo (50%)</p>
            <p className="text-lg font-bold text-amber-300">{formatCurrency(minimumPayment)}</p>
            <p className="text-xs text-amber-400 mt-0.5">Necessário para iniciar a produção</p>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleFinalize}
            loading={loadingOrder}
            disabled={!address || !selectedFreight || !number}
          >
            Confirmar pedido
          </Button>

          <p className="text-xs text-center text-[var(--text-muted)] mt-3">
            Você receberá as instruções de pagamento pelo WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
}
