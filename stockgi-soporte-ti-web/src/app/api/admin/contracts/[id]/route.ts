import { assertRole } from "@/server/auth";
import { validateCsrfToken } from "@/server/csrf";
import { updateContract } from "@/server/contracts";
import { fail, ok, publicError } from "@/server/http";
import { getSession, withSessionContext } from "@/server/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      const [, , { id }, body] = await Promise.all([
        validateCsrfToken(request, session),
        assertRole(session.userId, ["ti_administrativo"]),
        context.params,
        request.json(),
      ]);
      return ok({ contract: await updateContract(id, body) });
    });
  } catch (error) {
    return publicError(error, "No fue posible actualizar contrato", 400);
  }
}