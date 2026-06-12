import { assertRole } from "@/server/auth";
import { fail, ok } from "@/server/http";
import { getSession } from "@/server/session";
import { createUser, listUsers } from "@/server/users";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    assertRole(session.userId, ["ti_administrativo"]);
    return ok({ users: listUsers() });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No autorizado", 403);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    assertRole(session.userId, ["ti_administrativo"]);
    const user = createUser(await request.json());
    return ok({ user }, { status: 201 });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible crear usuario");
  }
}
