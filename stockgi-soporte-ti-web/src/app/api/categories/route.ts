import { listCategories } from "@/server/categories";
import { ok } from "@/server/http";

export async function GET() {
  return ok({ categories: listCategories() });
}
