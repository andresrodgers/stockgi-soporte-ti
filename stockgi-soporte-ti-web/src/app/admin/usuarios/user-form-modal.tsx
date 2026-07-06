"use client";

import { useEffect, useReducer, useRef } from "react";
import { Field, inputClass, selectClass } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import type { Contract, CreatedUserResult, Role, User } from "@/lib/types";

type FormState = {
  saved: boolean;
  createdResult: CreatedUserResult | null;
  formError: string | null;
};

const initialFormState: FormState = { saved: false, createdResult: null, formError: null };

type FormAction =
  | { type: "reset" }
  | { type: "submit_start" }
  | { type: "submit_success_edit" }
  | { type: "submit_success_create"; result: CreatedUserResult }
  | { type: "submit_error"; message: string };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "reset":
      return initialFormState;
    case "submit_start":
      return { ...state, saved: false, formError: null };
    case "submit_success_edit":
      return { ...state, saved: true };
    case "submit_success_create":
      return { ...state, saved: true, createdResult: action.result };
    case "submit_error":
      return { ...state, formError: action.message };
    default:
      return state;
  }
}

export function UserFormModal({
  open,
  editingUser,
  contracts,
  onClose,
  onSaved,
}: {
  open: boolean;
  editingUser: User | null;
  contracts: Contract[];
  onClose: () => void;
  onSaved: (isNewUser: boolean) => Promise<void>;
}) {
  const { createUser, updateUser } = useAppState();
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const { saved, createdResult, formError } = state;
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dispatch({ type: "reset" });
  }, [open, editingUser]);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
  }, [open]);

  if (!open) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({ type: "submit_start" });
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
        dispatch({ type: "submit_success_edit" });
        await onSaved(false);
        window.setTimeout(() => {
          onClose();
        }, 900);
        return;
      }

      const created = await createUser(payload);
      dispatch({ type: "submit_success_create", result: created });
      await onSaved(true);
    } catch (submitError) {
      dispatch({ type: "submit_error", message: submitError instanceof Error ? submitError.message : "No fue posible guardar el usuario" });
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="user-modal-title"
      className="fixed inset-0 m-auto max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-[20px] bg-white p-0 card-shadow backdrop:bg-black/20 backdrop:backdrop-blur-[2px]"
    >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--app-border-soft)] px-6 py-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)]">{editingUser ? "Editar usuario" : "Nuevo usuario"}</p>
            <h2 id="user-modal-title" className="mt-1 text-[20px] font-semibold">{editingUser ? "Actualizar usuario" : "Crear usuario"}</h2>
            <p className="mt-1 text-[13px] text-[var(--brand-secondary)]">{editingUser ? "Cambia contrato, rol, estado o datos del usuario." : "Completa los datos mínimos para entregar acceso al portal."}</p>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose} className="grid size-9 place-items-center rounded-[11px] bg-[var(--app-muted)] text-[18px] font-semibold text-[var(--brand-secondary)] hover:bg-[var(--brand-primary-soft)]">x</button>
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
            {!editingUser ? <div className="rounded-[13px] bg-[var(--app-muted)] px-4 py-3 text-[12px] text-[var(--brand-secondary)]">La contraseña temporal será la misma cédula y se mostrará una sola vez al guardar.</div> : <div />}
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
              <p className="mt-1">Contraseña temporal:</p>
              <p className="mt-2 rounded-[10px] bg-white px-3 py-2 font-mono text-[14px] font-semibold text-[var(--foreground)]">{createdResult.temporaryPasswordGenerated}</p>
              <p className="mt-2 text-[12px]">Debes compartirla al usuario. Solo se muestra en este momento.</p>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-[var(--app-border-soft)] pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="h-11 rounded-[14px] bg-white px-5 text-[13px] font-semibold text-[var(--brand-primary)] shadow-sm ring-1 ring-[var(--app-border)]">Cancelar</button>
            <button type="submit" className="h-11 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)]">Guardar usuario</button>
          </div>
        </form>
    </dialog>
  );
}
