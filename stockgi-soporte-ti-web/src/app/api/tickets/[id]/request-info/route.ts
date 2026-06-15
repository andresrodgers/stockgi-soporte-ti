import { validateCsrfToken } from "@/server/csrf";
import { fail, ok, publicError, requireString } from "@/server/http";
import { getSession, withSessionContext } from "@/server/session";
import { requestTicketInfo } from "@/server/tickets";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      await validateCsrfToken(request, session);
      const { id } = await context.params;
      const body = await request.json();
      return ok({ ticket: await requestTicketInfo(id, session.userId, requireString(body.message, "message")) });
    });
  } catch (error) {
    return publicError(error, "No fue posible solicitar información", 400);
  }
}