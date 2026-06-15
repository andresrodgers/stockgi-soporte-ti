import { NextResponse } from "next/server";
import { getAuthorizedAttachmentFile } from "@/server/attachments/storage";
import { fail, publicError } from "@/server/http";
import { getSession, withSessionContext } from "@/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; attachmentId: string }> };

function contentDisposition(filename: string, download: boolean) {
  const mode = download ? "attachment" : "inline";
  const safeFallback = filename.replace(/[^a-zA-Z0-9._-]+/g, "_") || "archivo";
  return `${mode}; filename="${safeFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      const { id, attachmentId } = await context.params;
      const file = await getAuthorizedAttachmentFile(id, attachmentId, session.userId);
      const download = new URL(request.url).searchParams.get("download") === "1";
      return new NextResponse(file.bytes, {
        headers: {
          "Content-Type": file.mimeType,
          "Content-Disposition": contentDisposition(file.filename, download),
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "ENOENT") {
      return fail("El adjunto ya no existe en el almacenamiento privado", 404);
    }
    return publicError(error, "No fue posible descargar el adjunto", 404);
  }
}