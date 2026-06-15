import { AsyncLocalStorage } from "async_hooks";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import type { Role } from "@/lib/types";

let pool: Pool | null = null;

export type DbSecurityContext = {
  userId?: string | null;
  role?: Role | null;
  contractId?: string | null;
  authFlow?: "login" | "session" | "csrf" | "system" | null;
};

const contextStore = new AsyncLocalStorage<DbSecurityContext>();

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL no configurado");
    }

    pool = new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX || 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  return pool;
}

export function getDbSecurityContext() {
  return contextStore.getStore() ?? null;
}

export async function withDbSecurityContext<T>(context: DbSecurityContext, callback: () => Promise<T>) {
  return contextStore.run(context, callback);
}

async function setContext(client: PoolClient, context: DbSecurityContext) {
  await client.query(`select set_config('app.current_user_id', $1, true)`, [context.userId ?? ""]);
  await client.query(`select set_config('app.current_role', $1, true)`, [context.role ?? ""]);
  await client.query(`select set_config('app.current_contract_id', $1, true)`, [context.contractId ?? ""]);
  await client.query(`select set_config('app.auth_flow', $1, true)`, [context.authFlow ?? ""]);
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  const context = contextStore.getStore();
  if (!context) return getPool().query<T>(text, params);

  const client = await getPool().connect();
  try {
    await client.query("begin");
    await setContext(client, context);
    const result = await client.query<T>(text, params);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function queryWithSecurityContext<T extends QueryResultRow = QueryResultRow>(context: DbSecurityContext, text: string, params: unknown[] = []) {
  return withDbSecurityContext(context, () => query<T>(text, params));
}