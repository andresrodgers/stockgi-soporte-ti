import type { TicketAttachment } from "@/lib/types";
import { validateAttachment } from "@/server/attachments";
import { saveUploadedFile } from "@/server/attachments/storage";
import { validateCsrfToken } from "@/server/csrf";
import { fail, ok, publicError } from "@/server/http";
import { getSession, withSessionContext } from "@/server/session";
import { addTicketAttachments } from "@/server/tickets";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      await validateCsrfToken(request, session);
      const { id } = await context.params;
      const contentType = request.headers.get("content-type") || "";
      let attachments: TicketAttachment[] = [];
      let commentId: string | null = null;

      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const files = formData.getAll("files").filter((value): value is File => value instanceof File);
        commentId = typeof formData.get("commentId") === "string" && String(formData.get("commentId") || "").trim().length ? String(formData.get("commentId")).trim() : null;
        if (!files.length) return fail("No se recibieron adjuntos");
        attachments = await Promise.all(files.map((file) => saveUploadedFile(id, file)));
      } else {
        const body = await request.json();
        commentId = typeof body.commentId === "string" && body.commentId.trim().length ? body.commentId.trim() : null;
        attachments = Array.isArray(body.attachments) ? body.attachments as TicketAttachment[] : [];
        for (const attachment of attachments) {
          validateAttachment({ name: attachment.name, type: attachment.mimeType, size: attachment.storedSizeBytes });
        }
      }

      if (!attachments.length) return fail("No se recibieron adjuntos");
      return ok({ ticket: await addTicketAttachments(id, session.userId, attachments, commentId) });
    });
  } catch (error) {
    return publicError(error, "No fue posible agregar adjuntos", 400);
  }
}