import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { query } from "@/server/db";
import type { SessionPayload } from "@/server/session";

const csrfHeader = "x-csrf-token";

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET requerido");
  return value;
}

function csrfHash(token: string) {
  return createHmac("sha256", secret()).update(token).digest("hex");
}

function safeEquals(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function issueCsrfToken(session: SessionPayload) {
  const token = randomBytes(32).toString("base64url");
  await query(`update app_sessions set csrf_token_hash = $2 where token_hash = $1 and revoked_at is null`, [session.sessionTokenHash, csrfHash(token)]);
  return token;
}

export async function validateCsrfToken(request: Request, session: SessionPayload) {
  const token = request.headers.get(csrfHeader);
  if (!token) throw new Error("CSRF_TOKEN_INVALIDO");

  const { rows } = await query<{ csrf_token_hash: string | null }>(
    `select csrf_token_hash from app_sessions where token_hash = $1 and revoked_at is null and expires_at > now() limit 1`,
    [session.sessionTokenHash],
  );
  const expected = rows[0]?.csrf_token_hash;
  if (!expected || !safeEquals(csrfHash(token), expected)) throw new Error("CSRF_TOKEN_INVALIDO");
}