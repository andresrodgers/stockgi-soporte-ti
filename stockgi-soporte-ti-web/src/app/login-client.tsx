"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Field, inputClass, selectClass } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import type { Role } from "@/lib/types";

const rolePath: Record<Role, string> = {
  usuario: "/usuario",
  ti_operativo: "/ti",
  ti_administrativo: "/admin",
};

const roleLabel: Record<Role, string> = {
  usuario: "Usuario solicitante",
  ti_operativo: "TI operativo",
  ti_administrativo: "TI administrativo",
};

export function LoginClient() {
  const router = useRouter();
  const { users, contracts, setCurrentUserId } = useAppState();
  const [selectedUserId, setSelectedUserId] = useState("user-1");
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0];
  const selectedContract = contracts.find((contract) => contract.id === selectedUser.contractId);

  const demoUsers = useMemo(() => users.filter((user) => user.status === "Activo"), [users]);

  async function login() {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractId: selectedUser.contractId, documentId: selectedUser.cedula, password: "stockgi-demo" }),
    });

    if (!response.ok) return;
    const payload = await response.json().catch(() => null) as { data?: { user?: { id: string; role: Role; mustChangePassword?: boolean } } } | null;
    const user = payload?.data?.user;
    setCurrentUserId(user?.id ?? selectedUser.id);
    router.push(user?.mustChangePassword ? "/cambiar-contrasena" : rolePath[user?.role ?? selectedUser.role]);
    router.refresh();
  }

  return (
    <main className="grid min-h-screen bg-[var(--background)] lg:grid-cols-[0.95fr_1.05fr]">
      <section className="sidebar-gradient relative hidden overflow-hidden px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="inline-flex">
            <Image src="/stockgi-logo.png" alt="StockGI" width={196} height={72} priority />
          </div>
          <div className="mt-16 max-w-lg">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/58">Portal privado</p>
            <h1 className="mt-3 text-[36px] font-semibold leading-tight">Mesa de Ayuda TI StockGI</h1>
            <p className="mt-4 text-[15px] leading-7 text-white/72">
              Prototipo funcional para registrar solicitudes, hacer seguimiento y gestionar soporte por contrato.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {["Tickets", "SLA", "Contratos"].map((item) => (
            <div key={item} className="rounded-[14px] bg-white/10 p-4">
              <p className="text-[22px] font-semibold">{item === "Tickets" ? "24" : item === "SLA" ? "91%" : "4"}</p>
              <p className="text-[12px] text-white/64">{item}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[430px] rounded-[20px] bg-white p-6 card-shadow sm:p-8">
          <div className="mb-8 text-center lg:hidden">
            <Image src="/stockgi-logo.png" alt="StockGI" width={168} height={64} className="mx-auto" priority />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand-secondary)]">Acceso demo</p>
          <h2 className="mt-2 text-[24px] font-semibold text-[var(--foreground)]">Ingresar al portal</h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--brand-secondary)]">
            Selecciona un perfil demo. Los campos de contrato, cedula y contrasena simulan el flujo final.
          </p>

          <div className="mt-6 grid gap-4">
            <Field label="Perfil demo">
              <select className={selectClass} value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                {demoUsers.map((user) => (
                  <option key={user.id} value={user.id}>{roleLabel[user.role]} - {user.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Contrato">
              <select className={selectClass} value={selectedUser.contractId} disabled>
                <option>{selectedContract?.name}</option>
              </select>
            </Field>
            <Field label="Cedula">
              <input className={inputClass} value={selectedUser.cedula} readOnly />
            </Field>
            <Field label="Contrasena">
              <input className={inputClass} type="password" value="stockgi-demo" readOnly />
            </Field>
            <button onClick={login} className="mt-2 h-12 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[14px] font-semibold text-white btn-shadow transition hover:bg-[var(--brand-primary-dark)]">
              Entrar como {roleLabel[selectedUser.role]}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

