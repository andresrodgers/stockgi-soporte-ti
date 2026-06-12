import { createTicketForUser, listTicketsForUser } from "@/server/tickets";
import { fail, ok, requireString } from "@/server/http";
import { getSession } from "@/server/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return ok({ tickets: listTicketsForUser(session.userId) });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible consultar tickets");
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    const body = await request.json();
    const ticket = createTicketForUser(session.userId, {
      categoryId: requireString(body.categoryId, "categoryId"),
      requestTypeId: requireString(body.requestTypeId, "requestTypeId"),
      subject: requireString(body.subject, "subject"),
      description: requireString(body.description, "description"),
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
    });
    return ok({ ticket }, { status: 201 });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible crear el ticket");
  }
}

