import type { Contract, CreateUserInput, CreatedUserResult, PaginatedResult, User } from "@/lib/types";
import { listContracts } from "@/server/contracts";
import { query } from "@/server/db";
import { getRepository } from "@/server/repositories";
import {
  normalizeCedula,
  normalizeContractLookup,
  normalizeEmail,
  normalizePhone,
  normalizeRoleInput,
  normalizeStatusInput,
  validateCedula,
  validateEmail,
  validateName,
  validatePhone,
} from "./validation";

function normalizeText(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized.length ? normalized : undefined;
}

function findContractById(contracts: Contract[], contractId: string) {
  return contracts.find((contract) => contract.id === contractId) ?? null;
}

function findContractByName(contracts: Contract[], name: string) {
  const lookup = normalizeContractLookup(name);
  return contracts.find((contract) => normalizeContractLookup(contract.name) === lookup) ?? null;
}

async function getExistingUser(userId: string) {
  const users = await getRepository().listUsers();
  const existing = users.find((user) => user.id === userId) ?? null;
  if (!existing) throw new Error("Usuario no encontrado");
  return { existing, users };
}

async function prepareUserInput(input: Partial<CreateUserInput>, currentUserId?: string): Promise<CreateUserInput> {
  const contracts = await listContracts();
  const { existing, users } = currentUserId ? await getExistingUser(currentUserId) : { existing: null, users: await getRepository().listUsers() };

  const requestedContractId = normalizeText(typeof input.contractId === "string" ? input.contractId : existing?.contractId);
  if (!requestedContractId) throw new Error("El contrato es obligatorio");

  const contract = findContractById(contracts, requestedContractId) ?? findContractByName(contracts, requestedContractId);
  if (!contract) throw new Error("El contrato no existe");
  if (contract.status !== "Activo") throw new Error("No se puede asignar un usuario a un contrato inactivo");

  const cedula = normalizeCedula(typeof input.cedula === "string" ? input.cedula : existing?.cedula ?? "");
  if (!cedula) throw new Error("La c\u00e9dula es obligatoria");
  validateCedula(cedula);

  const name = normalizeText(typeof input.name === "string" ? input.name : existing?.name);
  if (!name) throw new Error("El nombre completo es obligatorio");
  validateName(name);

  const roleRaw = typeof input.role === "string" ? input.role : existing?.role ?? "";
  const role = normalizeRoleInput(roleRaw);
  if (!role) throw new Error("El rol no es v\u00e1lido");

  const statusRaw = typeof input.status === "string" ? input.status : existing?.status ?? "Activo";
  const status = normalizeStatusInput(statusRaw);
  if (!status) throw new Error("El estado no es v\u00e1lido");

  const email = normalizeEmail(typeof input.email === "string" ? input.email : existing?.email);
  validateEmail(email);

  const phone = normalizePhone(typeof input.phone === "string" ? input.phone : existing?.phone);
  validatePhone(phone);

  const duplicatedCedula = users.find((user) => user.id !== currentUserId && normalizeCedula(user.cedula) === cedula);
  if (duplicatedCedula) throw new Error("Ya existe un usuario con esa c\u00e9dula");

  if (email) {
    const duplicatedEmail = users.find((user) => user.id !== currentUserId && normalizeEmail(user.email) === email);
    if (duplicatedEmail) throw new Error("Ya existe un usuario con ese correo");
  }

  if (phone) {
    const duplicatedPhone = users.find((user) => user.id !== currentUserId && normalizePhone(user.phone) === phone);
    if (duplicatedPhone) throw new Error("Ya existe un usuario con ese celular");
  }

  return {
    contractId: contract.id,
    cedula,
    name,
    role,
    email: email ?? undefined,
    phone: phone ?? undefined,
    area: normalizeText(typeof input.area === "string" ? input.area : existing?.area),
    position: normalizeText(typeof input.position === "string" ? input.position : existing?.position),
    location: normalizeText(typeof input.location === "string" ? input.location : existing?.location),
    status,
    mustChangePassword: input.mustChangePassword ?? existing?.mustChangePassword ?? true,
    locale: normalizeText(typeof input.locale === "string" ? input.locale : existing?.locale) ?? "es-CO",
    temporaryPassword: normalizeText(typeof input.temporaryPassword === "string" ? input.temporaryPassword : undefined),
  };
}

export async function listUsers() {
  return getRepository().listUsers();
}

export async function listUsersPage(page: number, pageSize: number): Promise<PaginatedResult<User>> {
  return getRepository().listUsersPage({ page, pageSize });
}

export async function createUser(input: CreateUserInput): Promise<CreatedUserResult> {
  const prepared = await prepareUserInput(input);
  return getRepository().createUser(prepared);
}

export async function updateUser(userId: string, updates: Partial<User>) {
  const prepared = await prepareUserInput(updates, userId);
  return getRepository().updateUser(userId, prepared);
}

export async function resetUserPasswordByAdmin(actorUserId: string, targetUserId: string): Promise<CreatedUserResult> {
  if (actorUserId === targetUserId) throw new Error("No puedes restablecer tu propia contraseña desde este flujo");
  const result = await getRepository().resetUserPassword(targetUserId);
  await query(`update app_sessions set revoked_at = now() where user_id = $1 and revoked_at is null`, [targetUserId]);
  await query(
    `insert into session_events(user_id, event_type, metadata) values ($1, 'password_reset_by_admin', $2)`,
    [targetUserId, JSON.stringify({ actorUserId })],
  );
  return result;
}

export async function deleteUser(userId: string) {
  return getRepository().deleteUser(userId);
}