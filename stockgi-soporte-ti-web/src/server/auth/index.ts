import type { Role } from "@/lib/types";
import { safeUser } from "@/server/demo-store";
import { getRepository } from "@/server/repositories";

export const demoPassword = "stockgi-demo";

export function getCurrentUser(userId: string) {
  const users = getRepository().listUsers();
  if (users instanceof Promise) throw new Error("Repositorio asincrono pendiente de integracion");
  const user = users.find((item) => item.id === userId && item.status === "Activo");
  return user ? safeUser(user) : null;
}

export function assertRole(userId: string, allowedRoles: Role[]) {
  const user = getCurrentUser(userId);
  if (!user) throw new Error("Sesion invalida");
  if (!allowedRoles.includes(user.role)) throw new Error("No autorizado");
  return user;
}

export function loginByContractDocument(input: { contractId: string; documentId: string; password: string }) {
  const repository = getRepository();
  const contracts = repository.listContracts();
  const users = repository.listUsers();
  if (contracts instanceof Promise || users instanceof Promise) throw new Error("Repositorio asincrono pendiente de integracion");

  const contract = contracts.find((item) => item.id === input.contractId && item.status === "Activo");
  if (!contract) throw new Error("Contrato inactivo o no encontrado");

  const user = users.find((item) => item.contractId === input.contractId && item.cedula === input.documentId && item.status === "Activo");
  if (!user) throw new Error("Usuario no encontrado o inactivo");
  if (input.password !== demoPassword) throw new Error("Contrasena invalida");

  return safeUser(user);
}
