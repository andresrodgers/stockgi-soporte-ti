"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, Field, PageHeader, PaginationControls, inputClass, selectClass } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import { apiFetch } from "@/lib/api-client";
import type { CreatedUserResult, PaginationMeta, Role, User } from "@/lib/types";

const PAGE_SIZE = 10;
const initialPagination: PaginationMeta = { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 };

export default function UsuariosPage() {
  const { contracts, createUser, updateUser } = useAppState();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createdResult, setCreatedResult] = useState<CreatedUserResult | null>(null);
  const [page, setPage] = useState(1);
  const [tableUsers, setTableUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadUsers = useCallback(async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiFetch<{ users: User[]; pagination: PaginationMeta }>(`/api/admin/users?page=${pageNumber}&pageSize=${PAGE_SIZE}`);
      setTableUsers(payload.users);
      setPagination(payload.pagination);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible consultar usuarios");
      setTableUsers([]);
      setPagination({ ...initialPagination, page: pageNumber });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => {
      void loadUsers(page);
    }, 0);
    return () => window.clearTimeout(task);
  }, [loadUsers, page]);

  function openCreate() {
    setEditingUser(null);
    setSaved(false);
    setCreatedResult(null);
    setFormError(null);
    setOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setSaved(false);
    setCreatedResult(null);
    setFormError(null);
    setOpen(true);
  }

  async function refreshUsersAfterMutation(targetPage: number) {
    if (page !== targetPage) {
      setPage(targetPage);
      return;
    }
    await loadUsers(targetPage);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);
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
      mustChangePassword: !editingUser,
    };

    try {
      if (editingUser) {
        await updateUser(editingUser.id, payload);
        await refreshUsersAfterMutation(page);
        setSaved(true);
        window.setTimeout(() => {
          setSaved(false);
          setOpen(false);
        }, 900);
        return;
      }

      const created = await createUser(payload);
      setCreatedResult(created);
      await refreshUsersAfterMutation(1);
      setSaved(true);
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "No fue posible guardar el usuario");
    }
  }

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader eyebrow="Administración" title="Usuarios" description="Crea usuarios, cambia contratos, ajusta roles y activa o inactiva accesos." />
        <Card>
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">Usuarios</h2>
              <p className="text-[12px] text-[var(--brand-secondary)]">Los cambios quedan registrados en la base de datos del portal.</p>
            </div>
            <button onClick={openCreate} className="h-10 rounded-[13px] bg-[var(--brand-primary)] px-4 text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)]">Nuevo usuario</button>
          </div>
          {loading && tableUsers.length === 0 ? <p className="px-5 py-8 text-center text-[13px] text-[var(--brand-secondary)]">Cargando usuarios...</p> : null}
          {error ? <p className="px-5 py-8 text-center text-[13px] font-semibold text-[#b63c2a]">{error}</p> : null}
          {!error && (!loading || tableUsers.length > 0) ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-[880px] w-full text-left text-[13px]">
                  <thead className="text-[11px] uppercase tracking-[0.08em] text-[var(--brand-secondary)]">
                    <tr><th className="px-5 py-3">Nombre</th><th className="px-5 py-3">Cédula</th><th className="px-5 py-3">Contrato</th><th className="px-5 py-3">Rol</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3">Acción</th></tr>
                  </thead>
                  <tbody>
                    {tableUsers.map((user) => (
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
              <PaginationControls pagination={pagination} onPageChange={setPage} />
            </>
          ) : null}
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
                <Field label="Estado">
                  <select name="status" className={selectClass} defaultValue={editingUser?.status ?? "Activo"} required>
                    <option>Activo</option>
                    <option>Inactivo</option>
                  </select>
                </Field>
                {!editingUser ? <div className="rounded-[13px] bg-[var(--app-muted)] px-4 py-3 text-[12px] text-[var(--brand-secondary)]">La contraseña temporal se genera automáticamente y se mostrará una sola vez al guardar.</div> : <div />}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Correo opcional">
                  <input name="email" className={inputClass} type="email" defaultValue={editingUser?.email} placeholder="correo@empresa.com" />
                </Field>
                <Field label="Celular opcional">
                  <input name="phone" className={inputClass} defaultValue={editingUser?.phone} placeholder="300 000 0000" />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Área opcional">
                  <input name="area" className={inputClass} defaultValue={editingUser?.area} placeholder="Operación" />
                </Field>
                <Field label="Cargo opcional">
                  <input name="position" className={inputClass} defaultValue={editingUser?.position} placeholder="Analista" />
                </Field>
                <Field label="Sede opcional">
                  <input name="location" className={inputClass} defaultValue={editingUser?.location} placeholder="Sede principal" />
                </Field>
              </div>

              {formError ? <p className="rounded-[13px] bg-[#fae4df] p-3 text-[13px] font-semibold text-[#b63c2a]">{formError}</p> : null}
              {saved && editingUser ? <p className="rounded-[13px] bg-[var(--brand-primary-soft)] p-3 text-[13px] font-semibold text-[var(--brand-primary)]">Usuario guardado correctamente.</p> : null}
              {createdResult?.temporaryPasswordGenerated ? (
                <div className="rounded-[13px] bg-[var(--brand-primary-soft)] p-4 text-[13px] text-[var(--brand-primary)]">
                  <p className="font-semibold">Usuario creado correctamente.</p>
                  <p className="mt-1">Contraseña temporal generada:</p>
                  <p className="mt-2 rounded-[10px] bg-white px-3 py-2 font-mono text-[14px] font-semibold text-[var(--foreground)]">{createdResult.temporaryPasswordGenerated}</p>
                  <p className="mt-2 text-[12px]">Debes compartirla al usuario. Solo se muestra en este momento.</p>
                </div>
              ) : null}

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
