"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, Field, PageHeader, inputClass, selectClass } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import type { Role, User } from "@/lib/types";

export default function UsuariosPage() {
  const { users, contracts, createUser, updateUser } = useAppState();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  function openCreate() {
    setEditingUser(null);
    setSaved(false);
    setOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setSaved(false);
    setOpen(true);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const payload = {
      contractId: String(form.get("contractId")),
      cedula: String(form.get("cedula")),
      name: String(form.get("name")),
      role: String(form.get("role")) as Role,
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      area: String(form.get("area") || ""),
      position: String(form.get("position") || ""),
      location: String(form.get("location") || ""),
      status: String(form.get("status")) as "Activo" | "Inactivo",
      temporaryPassword: String(form.get("temporaryPassword") || ""),
      mustChangePassword: !editingUser,
    };

    if (editingUser) {
      await updateUser(editingUser.id, payload);
    } else {
      await createUser(payload);
    }

    setSaved(true);
    window.setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 900);
  }

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader eyebrow="Administracion" title="Usuarios" description="Crea usuarios, cambia contratos, ajusta roles y activa o inactiva accesos." />
        <Card>
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">Usuarios demo</h2>
              <p className="text-[12px] text-[var(--brand-secondary)]">Los cambios quedan activos durante esta sesion de demo.</p>
            </div>
            <button onClick={openCreate} className="h-10 rounded-[13px] bg-[var(--brand-primary)] px-4 text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)]">Nuevo usuario</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[880px] w-full text-left text-[13px]">
              <thead className="text-[11px] uppercase tracking-[0.08em] text-[var(--brand-secondary)]">
                <tr><th className="px-5 py-3">Nombre</th><th className="px-5 py-3">Cédula</th><th className="px-5 py-3">Contrato</th><th className="px-5 py-3">Rol</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3">Accion</th></tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--app-muted)]">
                    <td className="border-t border-[var(--app-border-soft)] px-5 py-3 font-semibold">{user.name}</td>
                    <td className="border-t border-[var(--app-border-soft)] px-5 py-3">{user.cedula}</td>
                    <td className="border-t border-[var(--app-border-soft)] px-5 py-3">{contracts.find((contract) => contract.id === user.contractId)?.name}</td>
                    <td className="border-t border-[var(--app-border-soft)] px-5 py-3">{user.role}</td>
                    <td className="border-t border-[var(--app-border-soft)] px-5 py-3">{user.status}</td>
                    <td className="border-t border-[var(--app-border-soft)] px-5 py-3"><button onClick={() => openEdit(user)} className="h-8 rounded-[10px] bg-[var(--app-muted)] px-3 text-[12px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]">Editar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 px-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="user-modal-title">
          <div className="max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-[20px] bg-white card-shadow">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--app-border-soft)] px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)]">{editingUser ? "Editar usuario" : "Nuevo usuario"}</p>
                <h2 id="user-modal-title" className="mt-1 text-[20px] font-semibold">{editingUser ? "Actualizar usuario" : "Crear usuario"}</h2>
                <p className="mt-1 text-[13px] text-[var(--brand-secondary)]">{editingUser ? "Cambia contrato, rol, estado o datos del usuario." : "Completa los datos mínimos para entregar acceso al portal."}</p>
              </div>
              <button onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-[11px] bg-[var(--app-muted)] text-[18px] font-semibold text-[var(--brand-secondary)] hover:bg-[var(--brand-primary-soft)]">x</button>
            </div>

            <form onSubmit={submit} className="grid gap-4 px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Contrato">
                  <select name="contractId" className={selectClass} defaultValue={editingUser?.contractId ?? contracts.find((contract) => contract.status === "Activo")?.id} required>
                    {contracts.map((contract) => (
                      <option key={contract.id} value={contract.id}>{contract.name} {contract.status === "Inactivo" ? "(inactivo)" : ""}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Rol">
                  <select name="role" className={selectClass} defaultValue={editingUser?.role ?? "usuario"} required>
                    <option value="usuario">Usuario</option>
                    <option value="ti_operativo">TI operativo</option>
                    <option value="ti_administrativo">TI administrativo</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cédula">
                  <input name="cedula" className={inputClass} defaultValue={editingUser?.cedula} placeholder="Ej. 10101010" required />
                </Field>
                <Field label="Nombre completo">
                  <input name="name" className={inputClass} defaultValue={editingUser?.name} placeholder="Nombre y apellido" required />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Contraseña temporal">
                  <input name="temporaryPassword" className={inputClass} type="password" placeholder={editingUser ? "Dejar en blanco si no cambia" : "Clave inicial"} required={!editingUser} />
                </Field>
                <Field label="Estado">
                  <select name="status" className={selectClass} defaultValue={editingUser?.status ?? "Activo"} required>
                    <option>Activo</option>
                    <option>Inactivo</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Correo opcional">
                  <input name="email" className={inputClass} type="email" defaultValue={editingUser?.email} placeholder="correo@empresa.com" />
                </Field>
                <Field label="Telefono opcional">
                  <input name="phone" className={inputClass} defaultValue={editingUser?.phone} placeholder="300 000 0000" />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Area opcional">
                  <input name="area" className={inputClass} defaultValue={editingUser?.area} placeholder="Operacion" />
                </Field>
                <Field label="Cargo opcional">
                  <input name="position" className={inputClass} defaultValue={editingUser?.position} placeholder="Analista" />
                </Field>
                <Field label="Sede opcional">
                  <input name="location" className={inputClass} defaultValue={editingUser?.location} placeholder="Sede principal" />
                </Field>
              </div>

              {saved ? <p className="rounded-[13px] bg-[var(--brand-primary-soft)] p-3 text-[13px] font-semibold text-[var(--brand-primary)]">Usuario guardado en modo demo.</p> : null}

              <div className="flex flex-col-reverse gap-2 border-t border-[var(--app-border-soft)] pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setOpen(false)} className="h-11 rounded-[14px] bg-white px-5 text-[13px] font-semibold text-[var(--brand-primary)] shadow-sm ring-1 ring-[var(--app-border)]">Cancelar</button>
                <button className="h-11 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)]">Guardar usuario</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}



