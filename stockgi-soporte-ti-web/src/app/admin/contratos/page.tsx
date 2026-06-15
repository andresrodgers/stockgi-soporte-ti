"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, Field, PageHeader, inputClass, selectClass } from "@/components/ui";
import { useAppState } from "@/context/app-state";

export default function ContratosPage() {
  const { contracts, users, tickets, createContract, updateContract } = useAppState();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await createContract({
      name: String(form.get("name")),
      client: String(form.get("client")),
      status: String(form.get("status")) as "Activo" | "Inactivo",
    });
    setSaved(true);
    window.setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 900);
  }

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader
          eyebrow="Administración"
          title="Contratos"
          description="Crea contratos y activa o inactiva operaciónes sin borrar historial. Los contratos inactivos no deberian aparecer en login final."
          action={<button onClick={() => setOpen(true)} className="h-10 rounded-[13px] bg-[var(--brand-primary)] px-4 text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)]">Nuevo contrato</button>}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {contracts.map((contract) => {
            const userCount = users.filter((user) => user.contractId === contract.id).length;
            const ticketCount = tickets.filter((ticket) => ticket.contractId === contract.id).length;
            const inactive = contract.status === "Inactivo";
            return (
              <Card key={contract.id} className={`p-5 ${inactive ? "opacity-70" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)]">{contract.client}</p>
                    <h2 className="mt-2 text-[16px] font-semibold">{contract.name}</h2>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${inactive ? "bg-[#e9efeb] text-[#69756e]" : "bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"}`}>{contract.status}</span>
                </div>
                <div className="mt-5 grid gap-2 text-[13px] text-[var(--brand-secondary)]">
                  <p>{userCount} usuarios</p>
                  <p>{ticketCount} tickets</p>
                </div>
                <button
                  onClick={() => { void updateContract(contract.id, { status: inactive ? "Activo" : "Inactivo" }); }}
                  className={`mt-5 h-9 w-full rounded-[12px] px-3 text-[12px] font-semibold ${inactive ? "bg-[var(--brand-primary)] text-white" : "bg-white text-[#b63c2a] shadow-sm ring-1 ring-[#fae4df]"}`}
                >
                  {inactive ? "Activar contrato" : "Inactivar contrato"}
                </button>
              </Card>
            );
          })}
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 px-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="contract-modal-title">
          <div className="w-full max-w-[560px] rounded-[20px] bg-white card-shadow">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--app-border-soft)] px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)]">Nuevo contrato</p>
                <h2 id="contract-modal-title" className="mt-1 text-[20px] font-semibold">Crear contrato</h2>
                <p className="mt-1 text-[13px] text-[var(--brand-secondary)]">Agrega una operación o cliente para segmentar usuarios y tickets.</p>
              </div>
              <button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-[11px] bg-[var(--app-muted)] text-[18px] font-semibold text-[var(--brand-secondary)] hover:bg-[var(--brand-primary-soft)]">x</button>
            </div>
            <form onSubmit={submit} className="grid gap-4 px-6 py-5">
              <Field label="Nombre del contrato">
                <input name="name" className={inputClass} placeholder="Ej. Operación Occidente" required />
              </Field>
              <Field label="Cliente o empresa relacionada">
                <input name="client" className={inputClass} placeholder="Ej. Cliente externo" required />
              </Field>
              <Field label="Estado inicial">
                <select name="status" className={selectClass} defaultValue="Activo" required>
                  <option>Activo</option>
                  <option>Inactivo</option>
                </select>
              </Field>
              {saved ? <p className="rounded-[13px] bg-[var(--brand-primary-soft)] p-3 text-[13px] font-semibold text-[var(--brand-primary)]">Contrato guardado correctamente.</p> : null}
              <div className="flex flex-col-reverse gap-2 border-t border-[var(--app-border-soft)] pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-[14px] bg-white px-5 text-[13px] font-semibold text-[var(--brand-primary)] shadow-sm ring-1 ring-[var(--app-border)]">Cancelar</button>
                <button className="h-11 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)]">Guardar contrato</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

