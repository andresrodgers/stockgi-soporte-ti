"use client";

import { useEffect, useReducer, useRef } from "react";
import { Field, inputClass } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import type { User } from "@/lib/types";

type DeleteState = {
  confirmation: string;
  error: string | null;
  deleting: boolean;
};

const initialDeleteState: DeleteState = { confirmation: "", error: null, deleting: false };

type DeleteAction =
  | { type: "reset" }
  | { type: "set_confirmation"; value: string }
  | { type: "start" }
  | { type: "error"; message: string };

function deleteReducer(state: DeleteState, action: DeleteAction): DeleteState {
  switch (action.type) {
    case "reset":
      return initialDeleteState;
    case "set_confirmation":
      return { ...state, confirmation: action.value };
    case "start":
      return { ...state, deleting: true, error: null };
    case "error":
      return { ...state, deleting: false, error: action.message };
    default:
      return state;
  }
}

export function DeleteUserModal({
  target,
  onClose,
  onDeleted,
}: {
  target: User | null;
  onClose: () => void;
  onDeleted: () => Promise<void>;
}) {
  const { deleteUser } = useAppState();
  const [state, dispatch] = useReducer(deleteReducer, initialDeleteState);
  const { confirmation, error, deleting } = state;
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (target) dispatch({ type: "reset" });
  }, [target]);

  useEffect(() => {
    if (target) dialogRef.current?.showModal();
  }, [target]);

  if (!target) return null;

  async function confirmDelete() {
    if (!target) return;
    if (confirmation.trim() !== target.cedula) {
      dispatch({ type: "error", message: "Escribe la cédula exacta para confirmar la eliminación." });
      return;
    }

    dispatch({ type: "start" });
    try {
      await deleteUser(target.id);
      await onDeleted();
      onClose();
    } catch (deleteRequestError) {
      dispatch({ type: "error", message: deleteRequestError instanceof Error ? deleteRequestError.message : "No fue posible eliminar el usuario" });
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="delete-user-title"
      className="fixed inset-0 m-auto w-full max-w-[520px] rounded-[20px] bg-white p-0 card-shadow backdrop:bg-black/20 backdrop:backdrop-blur-[2px]"
    >
        <div className="border-b border-[var(--app-border-soft)] px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b63c2a]">Confirmación requerida</p>
          <h2 id="delete-user-title" className="mt-1 text-[20px] font-semibold">Eliminar usuario</h2>
          <p className="mt-2 text-[13px] text-[var(--brand-secondary)]">
            Esta acción elimina el usuario si no tiene historial asociado. Si ya tiene tickets, comentarios o adjuntos, el sistema pedirá inactivarlo para conservar trazabilidad.
          </p>
        </div>
        <div className="grid gap-4 px-6 py-5">
          <div className="rounded-[13px] bg-[var(--app-muted)] px-4 py-3 text-[13px]">
            <p className="font-semibold text-[var(--foreground)]">{target.name}</p>
            <p className="mt-1 text-[var(--brand-secondary)]">Cédula: {target.cedula}</p>
          </div>
          <Field label={`Escribe la cédula ${target.cedula} para confirmar`}>
            <input className={inputClass} value={confirmation} onChange={(event) => dispatch({ type: "set_confirmation", value: event.target.value })} placeholder={target.cedula} />
          </Field>
          {error ? <p className="rounded-[13px] bg-[#fae4df] p-3 text-[13px] font-semibold text-[#b63c2a]">{error}</p> : null}
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--app-border-soft)] pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="h-11 rounded-[14px] bg-white px-5 text-[13px] font-semibold text-[var(--brand-primary)] shadow-sm ring-1 ring-[var(--app-border)]">Cancelar</button>
            <button type="button" onClick={confirmDelete} disabled={deleting || confirmation.trim() !== target.cedula} className="h-11 rounded-[14px] bg-[#b63c2a] px-5 text-[13px] font-semibold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50">{deleting ? "Eliminando..." : "Eliminar usuario"}</button>
          </div>
        </div>
    </dialog>
  );
}
