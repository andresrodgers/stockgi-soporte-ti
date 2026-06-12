import { assertRole } from "@/server/auth";
import { updateContract } from "@/server/contracts";
import { fail, ok } from "@/server/http";
import { getSession } from "@/server/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    assertRole(session.userId, ["ti_administrativo"]);
    const { id } = await context.params;
    return ok({ contract: updateContract(id, await request.json()) });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible actualizar contrato");
  }
}
