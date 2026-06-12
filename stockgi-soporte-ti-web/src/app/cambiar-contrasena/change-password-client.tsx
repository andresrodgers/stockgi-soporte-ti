"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, inputClass } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import type { Role } from "@/lib/types";

const rolePath: Record<Role, string> = {
  usuario: "/usuario",
  ti_operativo: "/ti",
  ti_administrativo: "/admin",
};

export function ChangePasswordClient() {
  const router = useRouter();
  const { currentUser } = useAppState();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") || "");
    const newPassword = String(form.get("newPassword") || "");
    const confirmPassword = String(form.get("confirmPassword") || "");

    if (newPassword !== confirmPassword) {
      setSaving(false);
      setError("La confirmacion no coincide");
      return;
    }

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    setSaving(false);

    if (!response.ok) {
      setError(payload?.error || "No fue posible cambiar la contrasena");
      return;
    }

    router.push(rolePath[currentUser.role]);
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--background)] px-4 py-10">
      <div className="w-full max-w-[430px] rounded-[20px] bg-white p-6 card-shadow sm:p-8">
        <Image src="/stockgi-logo.png" alt="StockGI" width={168} height={64} className="mb-7 h-auto w-[168px]" priority />
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand-secondary)]">Seguridad</p>
        <h1 className="mt-2 text-[24px] font-semibold text-[var(--foreground)]">Cambiar contrasena temporal</h1>
        <p className="mt-2 text-[13px] leading-6 text-[var(--brand-secondary)]">Debes definir una contrasena nueva antes de usar el portal.</p>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <Field label="Contrasena temporal">
            <input name="currentPassword" className={inputClass} type="password" autoComplete="current-password" required />
          </Field>
          <Field label="Nueva contrasena">
            <input name="newPassword" className={inputClass} type="password" autoComplete="new-password" minLength={8} required />
          </Field>
          <Field label="Confirmar nueva contrasena">
            <input name="confirmPassword" className={inputClass} type="password" autoComplete="new-password" minLength={8} required />
          </Field>
          {error ? <p className="rounded-[13px] bg-red-50 p-3 text-[13px] font-semibold text-red-700">{error}</p> : null}
          <button disabled={saving} className="mt-2 h-12 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[14px] font-semibold text-white btn-shadow transition hover:bg-[var(--brand-primary-dark)] disabled:opacity-55">
            {saving ? "Guardando..." : "Guardar contrasena"}
          </button>
        </form>
      </div>
    </main>
  );
}
