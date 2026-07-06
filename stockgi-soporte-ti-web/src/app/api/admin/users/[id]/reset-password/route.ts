import { assertRole } from "@/server/auth";
import { validateCsrfToken } from "@/server/csrf";
import { fail, ok } from "@/server/http";
import { getSession, withSessionContext } from "@/server/session";
import { resetUserPasswordByAdmin } from "@/server/users";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      const [, , { id }] = await Promise.all([
        validateCsrfToken(request, session),
        assertRole(session.userId, ["ti_administrativo"]),
        context.params,
      ]);
      return ok(await resetUserPasswordByAdmin(session.userId, id));
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible restablecer la contraseña", 400);
  }
}
