import type { User } from "@/lib/types";
import { getRepository } from "@/server/repositories";

export function listUsers() {
  return getRepository().listUsers();
}

export function createUser(input: Omit<User, "id">) {
  return getRepository().createUser(input);
}

export function updateUser(userId: string, updates: Partial<User>) {
  return getRepository().updateUser(userId, updates);
}
