import { getTicketForUser } from "@/server/tickets";
import { fail, ok, publicError } from "@/server/http";
import { getSession, withSessionContext } from "@/server/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      const { id } = await context.params;
      return ok({ ticket: await getTicketForUser(id, session.userId) });
    });
  } catch (error) {
    return publicError(error, "No fue posible consultar el ticket", 404);
  }
}