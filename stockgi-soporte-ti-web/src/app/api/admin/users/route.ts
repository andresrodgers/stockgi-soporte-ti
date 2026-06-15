import { assertRole } from "@/server/auth";
import { validateCsrfToken } from "@/server/csrf";
import { fail, ok, parsePositiveInt } from "@/server/http";
import { getSession, withSessionContext } from "@/server/session";
import { createUser, listUsersPage } from "@/server/users";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      await assertRole(session.userId, ["ti_administrativo"]);
      const url = new URL(request.url);
      const page = parsePositiveInt(url.searchParams.get("page"), 1, { min: 1, max: 1000 });
      const pageSize = parsePositiveInt(url.searchParams.get("pageSize"), 10, { min: 1, max: 50 });
      const result = await listUsersPage(page, pageSize);
      return ok({ users: result.items, pagination: result.pagination });
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No autorizado", 403);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      await validateCsrfToken(request, session);
      await assertRole(session.userId, ["ti_administrativo"]);
      const created = await createUser(await request.json());
      return ok(created, { status: 201 });
    });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible crear usuario", 400);
  }
}
