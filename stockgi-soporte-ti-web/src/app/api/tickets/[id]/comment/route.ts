import { addTicketComment } from "@/server/tickets";
import { fail, ok, requireString } from "@/server/http";
import { getSession } from "@/server/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    const { id } = await context.params;
    const body = await request.json();
    return ok({ ticket: addTicketComment(id, session.userId, requireString(body.message, "message")) });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible comentar el ticket");
  }
}
