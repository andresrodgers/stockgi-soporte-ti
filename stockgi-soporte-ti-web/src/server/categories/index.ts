import { getRepository } from "@/server/repositories";

export async function listCategories() {
  return getRepository().listCategories();
}
