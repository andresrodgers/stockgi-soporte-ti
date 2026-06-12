import type { Contract } from "@/lib/types";
import { getRepository } from "@/server/repositories";

export function listContracts() {
  return getRepository().listContracts();
}

export function createContract(input: Omit<Contract, "id">) {
  return getRepository().createContract(input);
}

export function updateContract(contractId: string, updates: Partial<Contract>) {
  return getRepository().updateContract(contractId, updates);
}
