import { validateCsrfToken } from "@/server/csrf";
import { fail, ok, publicError } from "@/server/http";
import { getSession, withSessionContext } from "@/server/session";
import { takeTicket } from "@/server/tickets";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      await validateCsrfToken(request, session);
      const { id } = await context.params;
      return ok({ ticket: await takeTicket(id, session.userId) });
    });
  } catch (error) {
    return publicError(error, "No fue posible tomar el ticket", 400);
  }
}