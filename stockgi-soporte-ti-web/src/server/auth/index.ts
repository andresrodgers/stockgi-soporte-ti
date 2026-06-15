import type { Role, User } from "@/lib/types";
import { query, queryWithSecurityContext } from "@/server/db";
import { validatePasswordPolicy, verifyPassword } from "@/server/auth/password";

const genericLoginError = "Credenciales invalidas";
const loginRouteKey = "/api/auth/login";
const rateLimitWindowMinutes = 15;
const maxLoginAttemptsPerIp = 10;

type LoginRequest = {
  contractId: string;
  documentId: string;
  password: string;
};

type CurrentUserRow = {
  id: string;
  contract_id: string;
  document_id: string;
  full_name: string;
  role: Role;
  email: string | null;
  phone: string | null;
  area: string | null;
  position: string | null;
  location: string | null;
  status: "active" | "inactive";
  must_change_password: boolean;
  locale: string | null;
};

function getIpAddress(request?: Request) {
  return request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

function getIpKey(request?: Request) {
  return getIpAddress(request) || "local";
}

function getUserAgent(request?: Request) {
  return request?.headers.get("user-agent") || null;
}

async function recordSessionEvent(userId: string | null, eventType: string, ipAddress: string | null, userAgent: string | null, metadata?: Record<string, unknown>) {
  await query(
    `insert into session_events(user_id, event_type, ip_address, user_agent, metadata) values ($1,$2,$3,$4,$5)`,
    [userId, eventType, ipAddress, userAgent, metadata ? JSON.stringify(metadata) : null],
  );
}

async function assertIpRateLimit(ipKey: string) {
  const { rows } = await query<{ locked_until: Date | null }>(
    `select locked_until from auth_rate_limits where ip_key = $1 and route = $2 limit 1`,
    [ipKey, loginRouteKey],
  );

  if (rows[0]?.locked_until && rows[0].locked_until > new Date()) {
    throw new Error(genericLoginError);
  }
}

async function registerFailedIpAttempt(ipKey: string) {
  await query(
    `
      insert into auth_rate_limits(ip_key, route, attempts, window_started_at, locked_until)
      values ($1, $2, 1, now(), null)
      on conflict (ip_key, route) do update
      set attempts = case
            when auth_rate_limits.window_started_at <= now() - ($3 || ' minutes')::interval then 1
            else auth_rate_limits.attempts + 1
          end,
          window_started_at = case
            when auth_rate_limits.window_started_at <= now() - ($3 || ' minutes')::interval then now()
            else auth_rate_limits.window_started_at
          end,
          locked_until = case
            when auth_rate_limits.window_started_at <= now() - ($3 || ' minutes')::interval then null
            when auth_rate_limits.attempts + 1 >= $4 then now() + ($3 || ' minutes')::interval
            else auth_rate_limits.locked_until
          end
    `,
    [ipKey, loginRouteKey, rateLimitWindowMinutes, maxLoginAttemptsPerIp],
  );
}

async function clearIpRateLimit(ipKey: string) {
  await query(
    `
      update auth_rate_limits
      set attempts = 0,
          window_started_at = now(),
          locked_until = null
      where ip_key = $1 and route = $2
    `,
    [ipKey, loginRouteKey],
  );
}

export function safeUser(user: User): User {
  return user;
}

function userFromRow(row: CurrentUserRow): User {
  return {
    id: row.id,
    contractId: row.contract_id,
    cedula: row.document_id,
    name: row.full_name,
    role: row.role,
    email: row.email || undefined,
    phone: row.phone || undefined,
    area: row.area || undefined,
    position: row.position || undefined,
    location: row.location || undefined,
    status: row.status === "active" ? "Activo" : "Inactivo",
    mustChangePassword: row.must_change_password,
    locale: row.locale || "es-CO",
  };
}

export async function getCurrentUser(userId: string) {
  const { rows } = await queryWithSecurityContext<CurrentUserRow>(
    { userId, authFlow: "session" },
    `select id, contract_id, document_id, full_name, role, email, phone, area, position, location, status, must_change_password, locale from app_users where id=$1 and status='active' limit 1`,
    [userId],
  );
  return rows[0] ? safeUser(userFromRow(rows[0])) : null;
}

export async function assertRole(userId: string, allowedRoles: Role[]) {
  const user = await getCurrentUser(userId);
  if (!user) throw new Error("Sesion invalida");
  if (user.mustChangePassword) throw new Error("Debe cambiar la contrasena temporal antes de continuar");
  if (!allowedRoles.includes(user.role)) throw new Error("No autorizado");
  return user;
}

async function recordFailedLogin(userId?: string) {
  if (!userId) return;
  await queryWithSecurityContext(
    { authFlow: "login" },
    `
      update app_users
      set failed_login_attempts = failed_login_attempts + 1,
          locked_until = case when failed_login_attempts + 1 >= 5 then now() + interval '15 minutes' else locked_until end
      where id = $1
    `,
    [userId],
  );
}

export async function loginByContractDocument(input: LoginRequest, request?: Request) {
  const ipKey = getIpKey(request);
  const ipAddress = getIpAddress(request);
  const userAgent = getUserAgent(request);

  await assertIpRateLimit(ipKey);

  const { rows } = await queryWithSecurityContext<{ id: string; password_hash: string; locked_until: Date | null }>(
    { authFlow: "login" },
    `
      select u.id, u.password_hash, u.locked_until
      from app_users u
      join contracts c on c.id = u.contract_id
      where u.contract_id = $1 and u.document_id = $2 and u.status='active' and c.status='active'
      limit 1
    `,
    [input.contractId, input.documentId],
  );

  const authUser = rows[0];
  if (!authUser) {
    await registerFailedIpAttempt(ipKey);
    await recordSessionEvent(null, "login_failed", ipAddress, userAgent, { reason: "invalid_credentials" });
    throw new Error(genericLoginError);
  }

  if (authUser.locked_until && authUser.locked_until > new Date()) {
    await registerFailedIpAttempt(ipKey);
    await recordSessionEvent(authUser.id, "login_blocked", ipAddress, userAgent, { reason: "user_locked" });
    throw new Error(genericLoginError);
  }

  const passwordOk = await verifyPassword(input.password, authUser.password_hash);
  if (!passwordOk) {
    await recordFailedLogin(authUser.id);
    await registerFailedIpAttempt(ipKey);
    await recordSessionEvent(authUser.id, "login_failed", ipAddress, userAgent, { reason: "invalid_credentials" });
    throw new Error(genericLoginError);
  }

  await queryWithSecurityContext({ authFlow: "login" }, `update app_users set failed_login_attempts = 0, locked_until = null, last_login_at = now() where id = $1`, [authUser.id]);
  await clearIpRateLimit(ipKey);
  const user = await getCurrentUser(authUser.id);
  if (!user) throw new Error(genericLoginError);
  return user;
}

export async function changeOwnPassword(userId: string, newPassword: string, currentPassword?: string, currentSessionTokenHash?: string) {
  validatePasswordPolicy(newPassword);
  const { hashPassword } = await import("@/server/auth/password");
  const { rows } = await query<{ password_hash: string; must_change_password: boolean }>(`select password_hash, must_change_password from app_users where id=$1`, [userId]);
  const user = rows[0];
  if (!user) throw new Error("Usuario no encontrado");

  if (!user.must_change_password) {
    if (!currentPassword) throw new Error("Debes ingresar la contrasena actual");
    const currentOk = await verifyPassword(currentPassword, user.password_hash);
    if (!currentOk) throw new Error("Contrasena actual invalida");
  }

  const nextHash = await hashPassword(newPassword);
  await query(`update app_users set password_hash=$2, must_change_password=false, failed_login_attempts=0, locked_until=null where id=$1`, [userId, nextHash]);

  if (currentSessionTokenHash) {
    await query(`update app_sessions set revoked_at = now() where user_id = $1 and revoked_at is null and token_hash <> $2`, [userId, currentSessionTokenHash]);
  } else {
    await query(`update app_sessions set revoked_at = now() where user_id = $1 and revoked_at is null`, [userId]);
  }

  await recordSessionEvent(userId, "password_changed", null, null, { preservedCurrentSession: Boolean(currentSessionTokenHash) });
}