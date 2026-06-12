import { demoRepository } from "./demo-repository";
import { postgresRepository } from "./postgres-repository";
import { supabaseRepository } from "./supabase-repository";
import type { DataRepository } from "./types";

export function getRepository(): DataRepository {
  if (process.env.DATA_SOURCE === "postgres") {
    return postgresRepository;
  }

  if (process.env.DATA_SOURCE === "supabase") {
    return supabaseRepository;
  }

  return demoRepository;
}

export type { DataRepository } from "./types";

