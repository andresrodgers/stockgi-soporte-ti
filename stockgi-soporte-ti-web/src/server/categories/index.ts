import { getRepository } from "@/server/repositories";

export function listCategories() {
  return getRepository().listCategories();
}
