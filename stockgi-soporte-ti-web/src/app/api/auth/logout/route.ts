import { validateCsrfToken } from "@/server/csrf";
import { ok, publicError } from "@/server/http";
import { clearSession, getSession, withSessionContext } from "@/server/session";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (session) {
      await withSessionContext(session, async () => validateCsrfToken(request, session));
    }
    await clearSession();
    return ok({ success: true });
  } catch (error) {
    return publicError(error, "No fue posible cerrar sesión", 403);
  }
}