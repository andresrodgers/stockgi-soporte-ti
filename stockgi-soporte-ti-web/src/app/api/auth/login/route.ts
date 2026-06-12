import { fail, ok, requireString } from "@/server/http";
import { loginByContractDocument } from "@/server/auth";
import { setSession } from "@/server/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await loginByContractDocument({
      contractId: requireString(body.contractId, "contractId"),
      documentId: requireString(body.documentId, "documentId"),
      password: requireString(body.password, "password"),
    });
    await setSession({ userId: user.id, role: user.role, contractId: user.contractId }, request);
    return ok({ user });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "No fue posible iniciar sesion", 401);
  }
}

