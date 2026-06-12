import { closeTicket } from "@/server/tickets";
import { fail, ok, requireString } from "@/server/http";
import { getSession } from "@/server/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    const { id } = await context.params;
    const body = await request.json();
    return ok({ ticket: closeTicket(id, session.userId, requireString(body.solution, "solution")) });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible cerrar el ticket");
  }
}
