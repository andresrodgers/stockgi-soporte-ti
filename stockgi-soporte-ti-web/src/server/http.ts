import { NextResponse } from "next/server";

const safeMessages = new Set([
  "No autenticado",
  "No autorizado",
  "Solicitud inválida",
  "Credenciales inválidas",
  "Debe cambiar la contraseña temporal antes de continuar",
  "El adjunto ya no existe en el almacenamiento privado",
]);

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function publicError(error: unknown, fallback: string, status = 400) {
  if (error instanceof Error && safeMessages.has(error.message)) {
    const safeStatus = error.message === "No autenticado" ? 401 : error.message === "No autorizado" ? 403 : status;
    return fail(error.message, safeStatus);
  }
  console.error(fallback, error);
  return fail(fallback, status);
}

export function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} es obligatorio`);
  }

  return value.trim();
}

export function parsePositiveInt(value: string | null, fallback: number, options?: { min?: number; max?: number }) {
  const min = options?.min ?? 1;
  const max = options?.max ?? Number.MAX_SAFE_INTEGER;
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}