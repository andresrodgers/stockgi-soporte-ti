import { getCurrentUser } from "@/server/auth";
import { fail, ok, publicError } from "@/server/http";
import { getSession, withSessionContext } from "@/server/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      const user = await getCurrentUser(session.userId);
      if (!user) return fail("No autenticado", 401);
      return ok({ user });
    });
  } catch (error) {
    return publicError(error, "No fue posible consultar sesión", 400);
  }
}