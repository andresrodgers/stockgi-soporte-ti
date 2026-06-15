import { listContracts } from "@/server/contracts";
import { ok, publicError } from "@/server/http";

export async function GET() {
  try {
    const contracts = (await listContracts())
      .filter((contract) => contract.status === "Activo")
      .map((contract) => ({ id: contract.id, name: contract.name, client: contract.client, status: contract.status }));
    return ok({ contracts });
  } catch (error) {
    return publicError(error, "No fue posible consultar contratos", 400);
  }
}