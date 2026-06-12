import { getTicketForUser } from "@/server/tickets";
import { fail, ok } from "@/server/http";
import { getSession } from "@/server/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    const { id } = await context.params;
    return ok({ ticket: getTicketForUser(id, session.userId) });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible consultar el ticket", 404);
  }
}
