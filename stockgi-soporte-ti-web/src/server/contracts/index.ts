import type { Contract } from "@/lib/types";
import { getRepository } from "@/server/repositories";

export async function listContracts() {
  return getRepository().listContracts();
}

export async function createContract(input: Omit<Contract, "id">) {
  return getRepository().createContract(input);
}

export async function updateContract(contractId: string, updates: Partial<Contract>) {
  return getRepository().updateContract(contractId, updates);
}
