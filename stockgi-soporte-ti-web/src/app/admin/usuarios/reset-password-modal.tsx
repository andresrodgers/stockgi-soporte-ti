"use client";

import { useEffect, useReducer, useRef } from "react";
import { Field, inputClass } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import type { CreatedUserResult, User } from "@/lib/types";

type ResetState = {
  confirmation: string;
  error: string | null;
  resetting: boolean;
  result: CreatedUserResult | null;
};

const initialResetState: ResetState = { confirmation: "", error: null, resetting: false, result: null };

type ResetAction =
  | { type: "reset" }
  | { type: "set_confirmation"; value: string }
  | { type: "start" }
  | { type: "success"; result: CreatedUserResult }
  | { type: "error"; message: string };

function resetReducer(state: ResetState, action: ResetAction): ResetState {
  switch (action.type) {
    case "reset":
      return initialResetState;
    case "set_confirmation":
      return { ...state, confirmation: action.value };
    case "start":
      return { ...state, resetting: true, error: null };
    case "success":
      return { ...state, resetting: false, result: action.result };
    case "error":
      return { ...state, resetting: false, error: action.message };
    default:
      return state;
  }
}

export function ResetPasswordModal({
  target,
  onClose,
  onDone,
}: {
  target: User | null;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const { resetUserPassword } = useAppState();
  const [state, dispatch] = useReducer(resetReducer, initialResetState);
  const { confirmation, error, resetting, result } = state;
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (target) dispatch({ type: "reset" });
  }, [target]);

  useEffect(() => {
    if (target) dialogRef.current?.showModal();
  }, [target]);

  if (!target) return null;

  async function confirmResetPassword() {
    if (!target) return;
    if (confirmation.trim() !== target.cedula) {
      dispatch({ type: "error", message: "Escribe la cédula exacta para confirmar el restablecimiento." });
      return;
    }

    dispatch({ type: "start" });
    try {
      const resetResult = await resetUserPassword(target.id);
      dispatch({ type: "success", result: resetResult });
      await onDone();
    } catch (resetRequestError) {
      dispatch({ type: "error", message: resetRequestError instanceof Error ? resetRequestError.message : "No fue posible restablecer la contraseña" });
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby="reset-user-password-title"
      className="fixed inset-0 m-auto w-full max-w-[540px] rounded-[20px] bg-white p-0 card-shadow backdrop:bg-black/20 backdrop:backdrop-blur-[2px]"
    >
        <div className="border-b border-[var(--app-border-soft)] px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)]">Confirmación requerida</p>
          <h2 id="reset-user-password-title" className="mt-1 text-[20px] font-semibold">Restablecer contraseña</h2>
          <p className="mt-2 text-[13px] text-[var(--brand-secondary)]">
            La contraseña temporal volverá a ser la cédula del usuario. El usuario deberá cambiarla en el siguiente ingreso.
          </p>
        </div>
        <div className="grid gap-4 px-6 py-5">
          <div className="rounded-[13px] bg-[var(--app-muted)] px-4 py-3 text-[13px]">
            <p className="font-semibold text-[var(--foreground)]">{target.name}</p>
            <p className="mt-1 text-[var(--brand-secondary)]">Cédula: {target.cedula}</p>
          </div>
          {!result ? (
            <Field label={`Escribe la cédula ${target.cedula} para confirmar`}>
              <input className={inputClass} value={confirmation} onChange={(event) => dispatch({ type: "set_confirmation", value: event.target.value })} placeholder={target.cedula} />
            </Field>
          ) : null}
          {error ? <p className="rounded-[13px] bg-[#fae4df] p-3 text-[13px] font-semibold text-[#b63c2a]">{error}</p> : null}
          {result?.temporaryPasswordGenerated ? (
            <div className="rounded-[13px] bg-[var(--brand-primary-soft)] p-4 text-[13px] text-[var(--brand-primary)]">
              <p className="font-semibold">Contraseña restablecida correctamente.</p>
              <p className="mt-1">Contraseña temporal:</p>
              <p className="mt-2 rounded-[10px] bg-white px-3 py-2 font-mono text-[14px] font-semibold text-[var(--foreground)]">{result.temporaryPasswordGenerated}</p>
              <p className="mt-2 text-[12px]">Compártela al usuario por un canal seguro. Solo se muestra en este momento.</p>
            </div>
          ) : null}
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--app-border-soft)] pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="h-11 rounded-[14px] bg-white px-5 text-[13px] font-semibold text-[var(--brand-primary)] shadow-sm ring-1 ring-[var(--app-border)]">{result ? "Cerrar" : "Cancelar"}</button>
            {!result ? (
              <button type="button" onClick={confirmResetPassword} disabled={resetting || confirmation.trim() !== target.cedula} className="h-11 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50">{resetting ? "Restableciendo..." : "Restablecer contraseña"}</button>
            ) : null}
          </div>
        </div>
    </dialog>
  );
}
