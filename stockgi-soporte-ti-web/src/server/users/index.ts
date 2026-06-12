import type { CreateUserInput, User } from "@/lib/types";
import { getRepository } from "@/server/repositories";

export async function listUsers() {
  return getRepository().listUsers();
}

export async function createUser(input: CreateUserInput) {
  return getRepository().createUser(input);
}

export async function updateUser(userId: string, updates: Partial<User>) {
  return getRepository().updateUser(userId, updates);
}
