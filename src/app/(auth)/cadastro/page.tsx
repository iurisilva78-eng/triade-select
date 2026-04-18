"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("As senhas não conferem.");
      return;
    }

    if (form.password.length < 6) {
      setError("Senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone.replace(/\D/g, ""),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao cadastrar.");
        setLoading(false);
        return;
      }

      await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      router.push("/produtos");
      router.refresh();
    } catch {
      setError("Erro ao cadastrar. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--gold)] flex items-center justify-center mx-auto mb-4">
            <span className="text-black font-bold text-2xl">T</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Criar conta</h1>
          <p className="text-[var(--text-secondary)] mt-1">Comece a fazer pedidos hoje mesmo</p>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Nome completo"
              placeholder="Seu nome"
              value={form.name}
              onChange={set("name")}
              required
              autoComplete="name"
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={set("email")}
              required
              autoComplete="email"
            />
            <Input
              label="WhatsApp"
              type="tel"
              placeholder="(11) 99999-9999"
              value={form.phone}
              onChange={set("phone")}
              required
              helper="Usado para envio de atualizações do pedido"
            />
            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={set("password")}
              required
              autoComplete="new-password"
            />
            <Input
              label="Confirmar senha"
              type="password"
              placeholder="Repita a senha"
              value={form.confirmPassword}
              onChange={set("confirmPassword")}
              required
              autoComplete="new-password"
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
              Criar conta
            </Button>
          </form>

          <p className="text-center text-[var(--text-secondary)] text-sm mt-4">
            Já tem conta?{" "}
            <Link href="/login" className="text-[var(--gold)] hover:text-[var(--gold-light)] font-semibold">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
