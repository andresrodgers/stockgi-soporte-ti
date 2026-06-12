import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { DataRepository } from "./types";

function notReady(): never {
  throw new Error("Repositorio Supabase pendiente: crear proyecto Supabase Pro, ejecutar migraciones y completar mapeos de datos.");
}

export const supabaseRepository: DataRepository = {
  source: "supabase",
  listContracts() {
    getSupabaseAdmin();
    return notReady();
  },
  createContract() {
    getSupabaseAdmin();
    return notReady();
  },
  updateContract() {
    getSupabaseAdmin();
    return notReady();
  },
  listUsers() {
    getSupabaseAdmin();
    return notReady();
  },
  createUser() {
    getSupabaseAdmin();
    return notReady();
  },
  updateUser() {
    getSupabaseAdmin();
    return notReady();
  },
  listCategories() {
    getSupabaseAdmin();
    return notReady();
  },
  listTickets() {
    getSupabaseAdmin();
    return notReady();
  },
  createTicket() {
    getSupabaseAdmin();
    return notReady();
  },
  updateTicket() {
    getSupabaseAdmin();
    return notReady();
  },
};
