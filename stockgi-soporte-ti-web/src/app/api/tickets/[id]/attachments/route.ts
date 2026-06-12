import type { TicketAttachment } from "@/lib/types";
import { validateAttachment } from "@/server/attachments";
import { fail, ok } from "@/server/http";
import { getSession } from "@/server/session";
import { addTicketAttachments } from "@/server/tickets";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    const { id } = await context.params;
    const body = await request.json();
    const attachments = Array.isArray(body.attachments) ? body.attachments as TicketAttachment[] : [];

    if (!attachments.length) return fail("No se recibieron adjuntos");

    for (const attachment of attachments) {
      validateAttachment({ name: attachment.name, type: attachment.mimeType, size: attachment.storedSizeBytes });
    }

    return ok({ ticket: addTicketAttachments(id, session.userId, attachments) });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible agregar adjuntos");
  }
}
