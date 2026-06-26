import { assertRole } from "@/server/auth";
import { validateCsrfToken } from "@/server/csrf";
import { fail, ok } from "@/server/http";
import { getSession, withSessionContext } from "@/server/session";
import { deleteUser, updateUser } from "@/server/users";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      await validateCsrfToken(request, session);
      await assertRole(session.userId, ["ti_administrativo"]);
      const { id } = await context.params;
      return ok({ user: await updateUser(id, await request.json()) });
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible actualizar usuario", 400);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      await validateCsrfToken(request, session);
      await assertRole(session.userId, ["ti_administrativo"]);
      const { id } = await context.params;
      if (id === session.userId) return fail("No puedes eliminar tu propio usuario", 400);
      await deleteUser(id);
      return ok({ deleted: true });
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible eliminar usuario", 400);
  }
}