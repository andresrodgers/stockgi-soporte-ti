import { changeOwnPassword } from "@/server/auth";
import { fail, ok, requireString } from "@/server/http";
import { getSession } from "@/server/session";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    const body = await request.json();
    await changeOwnPassword(session.userId, requireString(body.currentPassword, "currentPassword"), requireString(body.newPassword, "newPassword"));
    return ok({ changed: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible cambiar la contraseña");
  }
}
