"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, inputClass, selectClass } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import type { Role } from "@/lib/types";

const rolePath: Record<Role, string> = {
  usuario: "/usuario",
  ti_operativo: "/ti",
  ti_administrativo: "/admin",
};

export function LoginClient() {
  const router = useRouter();
  const { contracts, setCurrentUserId } = useAppState();
  const activeContracts = contracts.filter((contract) => contract.status === "Activo");
  const [contractId, setContractId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedContractId = contractId || activeContracts[0]?.id || "";

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contractId: selectedContractId, documentId: documentId.trim(), password }),
      });

      const payload = await response.json().catch(() => null) as { data?: { user?: { id: string; role: Role; mustChangePassword?: boolean } }; error?: string } | null;

      if (!response.ok || !payload?.data?.user) {
        setError(payload?.error || "No fue posible ingresar. Verifica los datos e intenta nuevamente.");
        return;
      }

      const user = payload.data.user;
      setCurrentUserId(user.id);
      router.push(user.mustChangePassword ? "/cambiar-contrasena" : rolePath[user.role]);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[var(--background)] lg:grid-cols-[0.95fr_1.05fr]">
      <section className="sidebar-gradient relative hidden overflow-hidden px-12 py-10 text-white lg:flex lg:flex-col lg:justify-center">
        <div>
          <div className="inline-flex">
            <Image src="/stockgi-logo.png" alt="StockGI" width={196} height={72} priority />
          </div>
          <div className="mt-16 max-w-lg">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/58">Portal privado</p>
            <h1 className="mt-3 text-[36px] font-semibold leading-tight">Mesa de Ayuda TI StockGI</h1>
            <p className="mt-4 text-[15px] leading-7 text-white/72">
              Registra solicitudes, consulta el seguimiento y gestiona el soporte de TI por contrato.
            </p>
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[430px] rounded-[20px] bg-white p-6 card-shadow sm:p-8">
          <div className="mb-8 text-center lg:hidden">
            <Image src="/stockgi-logo.png" alt="StockGI" width={168} height={64} className="mx-auto" priority />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand-secondary)]">Acceso privado</p>
          <h2 className="mt-2 text-[24px] font-semibold text-[var(--foreground)]">Ingresar al portal</h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--brand-secondary)]">
            Ingresa con el contrato asignado, tu cédula y la contraseña entregada por StockGI.
          </p>

          <form onSubmit={login} className="mt-6 grid gap-4">
            <Field label="Contrato">
              <select className={selectClass} value={selectedContractId} onChange={(event) => setContractId(event.target.value)} required>
                <option value="" disabled>Selecciona un contrato</option>
                {activeContracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>{contract.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Cédula">
              <input className={inputClass} value={documentId} onChange={(event) => setDocumentId(event.target.value)} autoComplete="username" inputMode="numeric" required />
            </Field>
            <Field label="Contraseña">
              <input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
            </Field>
            {error ? <p className="rounded-[12px] bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700">{error}</p> : null}
            <button disabled={loading} className="mt-2 h-12 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[14px] font-semibold text-white btn-shadow transition hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}