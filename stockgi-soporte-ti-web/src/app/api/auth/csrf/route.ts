import { issueCsrfToken } from "@/server/csrf";
import { fail, ok, publicError } from "@/server/http";
import { getSession, withSessionContext } from "@/server/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => ok({ csrfToken: await issueCsrfToken(session) }));
  } catch (error) {
    return publicError(error, "No fue posible generar token de seguridad", 400);
  }
}