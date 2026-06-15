import { postgresRepository } from "./postgres-repository";
import type { DataRepository } from "./types";

export function getRepository(): DataRepository {
  if (!process.env.DATA_SOURCE || process.env.DATA_SOURCE === "postgres") {
    return postgresRepository;
  }

  throw new Error(`DATA_SOURCE no soportado: ${process.env.DATA_SOURCE}`);
}

export type { DataRepository } from "./types";
