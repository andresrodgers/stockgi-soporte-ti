import { assertRole } from "@/server/auth";
import { createContract, listContracts } from "@/server/contracts";
import { fail, ok } from "@/server/http";
import { getSession } from "@/server/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    await assertRole(session.userId, ["ti_administrativo"]);
    return ok({ contracts: await listContracts() });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No autorizado", 403);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    await assertRole(session.userId, ["ti_administrativo"]);
    const contract = await createContract(await request.json());
    return ok({ contract }, { status: 201 });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible crear contrato");
  }
}

