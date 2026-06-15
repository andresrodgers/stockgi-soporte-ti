import { changeOwnPassword } from "@/server/auth";
import { validateCsrfToken } from "@/server/csrf";
import { fail, ok, publicError, requireString } from "@/server/http";
import { getSession, withSessionContext } from "@/server/session";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      await validateCsrfToken(request, session);
      const body = await request.json();
      const currentPassword = typeof body.currentPassword === "string" && body.currentPassword.length ? body.currentPassword : undefined;
      await changeOwnPassword(session.userId, requireString(body.newPassword, "newPassword"), currentPassword, session.sessionTokenHash);
      return ok({ changed: true });
    });
  } catch (error) {
    return publicError(error, "No fue posible cambiar la contraseña", 400);
  }
}