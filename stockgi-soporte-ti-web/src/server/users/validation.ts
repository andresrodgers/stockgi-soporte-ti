import type { Role, User } from "@/lib/types";

const roleAliases: Record<string, Role> = {
  usuario: "usuario",
  "ti operativo": "ti_operativo",
  ti_operativo: "ti_operativo",
  "ti administrativo": "ti_administrativo",
  ti_administrativo: "ti_administrativo",
};

const statusAliases: Record<string, User["status"]> = {
  activo: "Activo",
  inactivo: "Inactivo",
};

function normalizeLoose(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCedula(value: string) {
  return String(value ?? "").trim();
}

export function normalizeEmail(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized.length ? normalized : null;
}

export function normalizePhone(value: string | null | undefined) {
  const digits = String(value ?? "").replace(/\D+/g, "");
  return digits.length ? digits : null;
}

export function normalizeContractLookup(value: string) {
  return normalizeLoose(String(value ?? ""));
}

export function normalizeRoleInput(value: string) {
  return roleAliases[normalizeLoose(String(value ?? ""))] ?? null;
}

export function normalizeStatusInput(value: string) {
  return statusAliases[normalizeLoose(String(value ?? ""))] ?? null;
}

export function validateCedula(value: string) {
  if (!/^[0-9]{5,20}$/.test(value)) {
    throw new Error("La cédula debe tener entre 5 y 20 dígitos");
  }
}

export function validateName(value: string) {
  const trimmed = String(value ?? "").trim();
  if (trimmed.length < 2 || trimmed.length > 120) {
    throw new Error("El nombre debe tener entre 2 y 120 caracteres");
  }
}

export function validateEmail(value: string | null) {
  if (!value) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("El correo no tiene un formato válido");
  }
}

export function validatePhone(value: string | null) {
  if (!value) return;
  if (!/^[0-9]{7,15}$/.test(value)) {
    throw new Error("El celular debe tener entre 7 y 15 dígitos");
  }
}
