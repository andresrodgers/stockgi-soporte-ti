import { takeTicket } from "@/server/tickets";
import { fail, ok } from "@/server/http";
import { getSession } from "@/server/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    const { id } = await context.params;
    return ok({ ticket: await takeTicket(id, session.userId) });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible tomar el ticket");
  }
}
