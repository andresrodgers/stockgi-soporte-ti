import { ok } from "@/server/http";
import { clearSession } from "@/server/session";

export async function POST() {
  await clearSession();
  return ok({ success: true });
}

