import { getCurrentUser } from "@/server/auth";
import { fail, ok } from "@/server/http";
import { getSession } from "@/server/session";

export async function GET() {
  const session = await getSession();
  if (!session) return fail("No autenticado", 401);
  const user = getCurrentUser(session.userId);
  if (!user) return fail("Sesion invalida", 401);
  return ok({ user });
}
