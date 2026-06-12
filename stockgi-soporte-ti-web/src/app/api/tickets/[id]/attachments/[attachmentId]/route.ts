import { NextResponse } from "next/server";
import { getAuthorizedAttachmentFile } from "@/server/attachments/storage";
import { fail } from "@/server/http";
import { getSession } from "@/server/session";

type RouteContext = { params: Promise<{ id: string; attachmentId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    const { id, attachmentId } = await context.params;
    const file = await getAuthorizedAttachmentFile(id, attachmentId, session.userId);
    return new NextResponse(file.bytes, {
      headers: {
        "Content-Type": file.mimeType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.filename)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible descargar el adjunto", 404);
  }
}
