import { NextResponse } from "next/server";
import type { SessionPayload } from "@/server/session";
import { query } from "@/server/db";

type HandlerResult<T> = {
  data: T;
  status?: number;
};

const maxKeyLength = 120;

function normalizeKey(value: string | null) {
  const key = String(value ?? "").trim();
  if (!key || key.length > maxKeyLength || !/^[a-zA-Z0-9:._-]+$/.test(key)) return null;
  return key;
}

export async function runIdempotent<T>(session: SessionPayload, request: Request, operation: string, handler: () => Promise<HandlerResult<T>>) {
  const key = normalizeKey(request.headers.get("Idempotency-Key"));
  if (!key) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const inserted = await query<{ id: string }>(
    `insert into idempotency_keys(user_id, operation, idempotency_key, status)
     values ($1,$2,$3,'processing')
     on conflict (user_id, operation, idempotency_key) do nothing
     returning id`,
    [session.userId, operation, key],
  );

  if (!inserted.rows[0]) {
    const existing = await query<{ status: string; response_status: number | null; response_body: unknown }>(
      `select status, response_status, response_body from idempotency_keys where user_id=$1 and operation=$2 and idempotency_key=$3 limit 1`,
      [session.userId, operation, key],
    );
    const row = existing.rows[0];
    if (row?.status === "completed" && row.response_body) {
      return NextResponse.json(row.response_body, { status: row.response_status || 200 });
    }
    return NextResponse.json({ error: "Solicitud en proceso" }, { status: 409 });
  }

  try {
    const result = await handler();
    const status = result.status || 200;
    const responseBody = { data: result.data };
    await query(
      `update idempotency_keys set status='completed', response_status=$4, response_body=$5, completed_at=now() where user_id=$1 and operation=$2 and idempotency_key=$3`,
      [session.userId, operation, key, status, JSON.stringify(responseBody)],
    );
    return NextResponse.json(responseBody, { status });
  } catch (error) {
    await query(
      `update idempotency_keys set status='failed', completed_at=now() where user_id=$1 and operation=$2 and idempotency_key=$3`,
      [session.userId, operation, key],
    );
    throw error;
  }
}