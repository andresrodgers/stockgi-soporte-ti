import { listContracts } from "@/server/contracts";
import { ok, publicError } from "@/server/http";
import type { Contract } from "@/lib/types";

export async function GET() {
  try {
    const contracts = (await listContracts()).reduce<Array<Pick<Contract, "id" | "name" | "client" | "status">>>((acc, contract) => {
      if (contract.status === "Activo") acc.push({ id: contract.id, name: contract.name, client: contract.client, status: contract.status });
      return acc;
    }, []);
    return ok({ contracts });
  } catch (error) {
    return publicError(error, "No fue posible consultar contratos", 400);
  }
}