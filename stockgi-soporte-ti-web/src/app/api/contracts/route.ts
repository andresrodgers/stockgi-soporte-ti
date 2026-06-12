import { listContracts } from "@/server/contracts";
import { ok } from "@/server/http";

export async function GET() {
  return ok({ contracts: await listContracts() });
}

