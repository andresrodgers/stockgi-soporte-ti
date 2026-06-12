import { assertRole } from "@/server/auth";
import { fail, ok } from "@/server/http";
import { getSession } from "@/server/session";
import { updateUser } from "@/server/users";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    await assertRole(session.userId, ["ti_administrativo"]);
    const { id } = await context.params;
    return ok({ user: await updateUser(id, await request.json()) });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible actualizar usuario");
  }
}
