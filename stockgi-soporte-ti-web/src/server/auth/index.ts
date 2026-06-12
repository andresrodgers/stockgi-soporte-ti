import type { Role } from "@/lib/types";
import { safeUser } from "@/server/demo-store";
import { getRepository } from "@/server/repositories";
import { query } from "@/server/db";
import { validatePasswordPolicy, verifyPassword } from "@/server/auth/password";

export const demoPassword = "stockgi-demo";

function isPostgresMode() {
  return process.env.DATA_SOURCE === "postgres";
}

export async function getCurrentUser(userId: string) {
  const users = await getRepository().listUsers();
  const user = users.find((item) => item.id === userId && item.status === "Activo");
  return user ? safeUser(user) : null;
}

export async function assertRole(userId: string, allowedRoles: Role[]) {
  const user = await getCurrentUser(userId);
  if (!user) throw new Error("Sesion invalida");
  if (user.mustChangePassword) throw new Error("Debe cambiar la contraseña temporal antes de continuar");
  if (!allowedRoles.includes(user.role)) throw new Error("No autorizado");
  return user;
}

async function recordFailedLogin(userId?: string) {
  if (!isPostgresMode() || !userId) return;
  await query(`
    update app_users
    set failed_login_attempts = failed_login_attempts + 1,
        locked_until = case when failed_login_attempts + 1 >= 5 then now() + interval '15 minutes' else locked_until end
    where id = $1
  `, [userId]);
}

export async function loginByContractDocument(input: { contractId: string; documentId: string; password: string }) {
  if (!isPostgresMode()) {
    const repository = getRepository();
    const contracts = await repository.listContracts();
    const users = await repository.listUsers();
    const contract = contracts.find((item) => item.id === input.contractId && item.status === "Activo");
    if (!contract) throw new Error("Contrato inactivo o no encontrado");

    const user = users.find((item) => item.contractId === input.contractId && item.cedula === input.documentId && item.status === "Activo");
    if (!user) throw new Error("Usuario no encontrado o inactivo");
    if (input.password !== demoPassword) throw new Error("Contraseña invalida");

    return safeUser(user);
  }

  const { rows } = await query<{ id: string; password_hash: string; locked_until: Date | null }>(`
    select u.id, u.password_hash, u.locked_until
    from app_users u
    join contracts c on c.id = u.contract_id
    where u.contract_id = $1 and u.document_id = $2 and u.status='active' and c.status='active'
    limit 1
  `, [input.contractId, input.documentId]);

  const authUser = rows[0];
  if (!authUser) throw new Error("Usuario no encontrado o inactivo");
  if (authUser.locked_until && authUser.locked_until > new Date()) throw new Error("Usuario bloqueado temporalmente");

  const ok = await verifyPassword(input.password, authUser.password_hash);
  if (!ok) {
    await recordFailedLogin(authUser.id);
    throw new Error("Contraseña invalida");
  }

  await query(`update app_users set failed_login_attempts = 0, locked_until = null, last_login_at = now() where id = $1`, [authUser.id]);
  const user = await getCurrentUser(authUser.id);
  if (!user) throw new Error("Usuario no encontrado o inactivo");
  return user;
}

export async function changeOwnPassword(userId: string, currentPassword: string, newPassword: string) {
  validatePasswordPolicy(newPassword);
  const { hashPassword } = await import("@/server/auth/password");
  const { rows } = await query<{ password_hash: string }>(`select password_hash from app_users where id=$1`, [userId]);
  if (!rows[0]) throw new Error("Usuario no encontrado");
  const currentOk = await verifyPassword(currentPassword, rows[0].password_hash);
  if (!currentOk) throw new Error("Contraseña actual invalida");
  const nextHash = await hashPassword(newPassword);
  await query(`update app_users set password_hash=$2, must_change_password=false, failed_login_attempts=0, locked_until=null where id=$1`, [userId, nextHash]);
}

