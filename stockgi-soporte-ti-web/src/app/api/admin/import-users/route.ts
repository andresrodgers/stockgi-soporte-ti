import { assertRole } from "@/server/auth";
import { importUsersFromCsv } from "@/server/bulk-import";
import { fail, ok } from "@/server/http";
import { getSession } from "@/server/session";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    await assertRole(session.userId, ["ti_administrativo"]);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return fail("Archivo CSV obligatorio");
    if (!file.name.toLowerCase().endsWith(".csv")) return fail("Solo se acepta archivo .csv");

    const result = await importUsersFromCsv(await file.text());
    return ok({ result });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible importar usuarios");
  }
}

