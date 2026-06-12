import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { Role } from "@/lib/types";
import { query } from "@/server/db";

const cookieName = "stockgi_session";

type SessionPayload = {
  userId: string;
  role: Role;
  contractId: string;
};

function isPostgresMode() {
  return process.env.DATA_SOURCE === "postgres";
}

function secret() {
  return process.env.SESSION_SECRET || "stockgi-demo-session-secret";
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function tokenHash(token: string) {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

function encodeSession(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

function decodeSession(value: string): SessionPayload | null {
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

async function getPostgresSession(value: string): Promise<SessionPayload | null> {
  const [token, signature] = value.split(".");
  if (!token || !signature || sign(token) !== signature) return null;

  const { rows } = await query<{ user_id: string; role: Role; contract_id: string }>(`
    select s.user_id, u.role, u.contract_id
    from app_sessions s
    join app_users u on u.id = s.user_id
    where s.token_hash = $1
      and s.revoked_at is null
      and s.expires_at > now()
      and u.status = 'active'
    limit 1
  `, [tokenHash(token)]);

  if (!rows[0]) return null;
  await query(`update app_sessions set last_seen_at = now() where token_hash = $1`, [tokenHash(token)]);
  return { userId: rows[0].user_id, role: rows[0].role, contractId: rows[0].contract_id };
}

export async function getSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(cookieName)?.value;
  if (!value) return null;

  if (isPostgresMode()) {
    return getPostgresSession(value);
  }

  return decodeSession(value);
}

export async function setSession(payload: SessionPayload, request?: Request) {
  const cookieStore = await cookies();

  if (isPostgresMode()) {
    const token = randomBytes(32).toString("base64url");
    const hours = Number(process.env.SESSION_TTL_HOURS || 8);
    const ip = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
    const userAgent = request?.headers.get("user-agent") || null;
    await query(`insert into app_sessions(user_id, token_hash, ip_address, user_agent, expires_at) values ($1,$2,$3,$4, now() + ($5 || ' hours')::interval)`, [payload.userId, tokenHash(token), ip, userAgent, hours]);
    await query(`insert into session_events(user_id, event_type, ip_address, user_agent) values ($1,'login',$2,$3)`, [payload.userId, ip, userAgent]);
    cookieStore.set(cookieName, `${token}.${sign(token)}`, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * hours,
    });
    return;
  }

  cookieStore.set(cookieName, encodeSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(cookieName)?.value;

  if (isPostgresMode() && value) {
    const [token] = value.split(".");
    if (token) {
      await query(`update app_sessions set revoked_at = now() where token_hash = $1 and revoked_at is null`, [tokenHash(token)]);
    }
  }

  cookieStore.delete(cookieName);
}
