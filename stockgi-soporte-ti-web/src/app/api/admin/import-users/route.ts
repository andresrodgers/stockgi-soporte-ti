import type { BulkImportEditableRow, BulkImportResult } from "@/lib/types";
import { assertRole } from "@/server/auth";
import { importCorrectedUsers, importUsersFromCsv, readCsvFileText } from "@/server/bulk-import";
import { validateCsrfToken } from "@/server/csrf";
import { fail } from "@/server/http";
import { runIdempotent } from "@/server/idempotency";
import { getSession, withSessionContext } from "@/server/session";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      await validateCsrfToken(request, session);
      await assertRole(session.userId, ["ti_administrativo"]);
      const contentType = request.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        return runIdempotent(session, request, "admin.importUsers.resolve", async () => {
          const body = await request.json() as { rows?: Array<{ rowNumber: number; values: BulkImportEditableRow }> };
          const result: BulkImportResult = await importCorrectedUsers(body.rows || []);
          return { data: { result } };
        });
      }

      return runIdempotent(session, request, "admin.importUsers", async () => {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!(file instanceof File)) throw new Error("Archivo CSV obligatorio");
        const result: BulkImportResult = await importUsersFromCsv(await readCsvFileText(file));
        return { data: { result } };
      });
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible importar usuarios", 400);
  }
}
