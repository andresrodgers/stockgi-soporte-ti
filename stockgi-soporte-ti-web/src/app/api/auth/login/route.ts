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
    }, request);
    await setSession({ userId: user.id, role: user.role, contractId: user.contractId }, request);
    return ok({ user });
  } catch {
    return fail("Credenciales invalidas", 401);
  }
}
