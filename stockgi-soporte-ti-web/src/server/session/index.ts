import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { Role } from "@/lib/types";
import { query, queryWithSecurityContext, withDbSecurityContext } from "@/server/db";

const cookieName = "stockgi_session";

export type SessionPayload = {
  userId: string;
  role: Role;
  contractId: string;
  sessionTokenHash: string;
};

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET requerido");
  return value;
}

function secureCookie() {
  if (process.env.SESSION_COOKIE_SECURE === "true") return true;
  if (process.env.SESSION_COOKIE_SECURE === "false") return false;
  return process.env.NODE_ENV === "production" && (process.env.APP_BASE_URL?.startsWith("https://") ?? true);
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function tokenHash(token: string) {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

function signaturesMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

function parseSessionCookie(value: string) {
  const [token, signature] = value.split(".");
  if (!token || !signature || !signaturesMatch(signature, sign(token))) return null;
  return { token, sessionTokenHash: tokenHash(token) };
}

async function getPostgresSession(value: string): Promise<SessionPayload | null> {
  const parsed = parseSessionCookie(value);
  if (!parsed) return null;

  const { rows } = await queryWithSecurityContext<{ user_id: string; role: Role; contract_id: string }>(
    { authFlow: "session" },
    `
      select s.user_id, u.role, u.contract_id
      from app_sessions s
      join app_users u on u.id = s.user_id
      where s.token_hash = $1
        and s.revoked_at is null
        and s.expires_at > now()
        and u.status = 'active'
      limit 1
    `,
    [parsed.sessionTokenHash],
  );

  if (!rows[0]) return null;
  await queryWithSecurityContext({ authFlow: "session" }, `update app_sessions set last_seen_at = now() where token_hash = $1`, [parsed.sessionTokenHash]);
  return { userId: rows[0].user_id, role: rows[0].role, contractId: rows[0].contract_id, sessionTokenHash: parsed.sessionTokenHash };
}

export async function getSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(cookieName)?.value;
  if (!value) return null;
  return getPostgresSession(value);
}

export async function withSessionContext<T>(session: SessionPayload, callback: () => Promise<T>) {
  return withDbSecurityContext({ userId: session.userId, role: session.role, contractId: session.contractId, authFlow: "session" }, callback);
}

export async function setSession(payload: Omit<SessionPayload, "sessionTokenHash">, request?: Request) {
  const cookieStore = await cookies();
  const token = randomBytes(32).toString("base64url");
  const hours = Number(process.env.SESSION_TTL_HOURS || 8);
  const ip = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const userAgent = request?.headers.get("user-agent") || null;

  await query(`insert into app_sessions(user_id, token_hash, ip_address, user_agent, expires_at) values ($1,$2,$3,$4, now() + ($5 || ' hours')::interval)`, [payload.userId, tokenHash(token), ip, userAgent, hours]);
  await query(`insert into session_events(user_id, event_type, ip_address, user_agent) values ($1,'login',$2,$3)`, [payload.userId, ip, userAgent]);
  cookieStore.set(cookieName, `${token}.${sign(token)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie(),
    path: "/",
    maxAge: 60 * 60 * hours,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(cookieName)?.value;

  if (value) {
    const parsed = parseSessionCookie(value);
    if (parsed) {
      await query(`update app_sessions set revoked_at = now() where token_hash = $1 and revoked_at is null`, [parsed.sessionTokenHash]);
    }
  }

  cookieStore.delete(cookieName);
}