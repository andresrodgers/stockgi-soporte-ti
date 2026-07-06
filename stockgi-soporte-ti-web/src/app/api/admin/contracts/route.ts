import { assertRole } from "@/server/auth";
import { validateCsrfToken } from "@/server/csrf";
import { createContract, listContracts } from "@/server/contracts";
import { fail, ok, publicError } from "@/server/http";
import { getSession, withSessionContext } from "@/server/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      await assertRole(session.userId, ["ti_administrativo"]);
      return ok({ contracts: await listContracts() });
    });
  } catch (error) {
    return publicError(error, "No autorizado", 403);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      const [, , body] = await Promise.all([
        validateCsrfToken(request, session),
        assertRole(session.userId, ["ti_administrativo"]),
        request.json(),
      ]);
      const contract = await createContract(body);
      return ok({ contract }, { status: 201 });
    });
  } catch (error) {
    return publicError(error, "No fue posible crear contrato", 400);
  }
}