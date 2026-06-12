import type { Contract, Ticket, TicketCategory, User } from "@/lib/types";

export type CreateTicketRecord = Ticket;
export type CreateUserRecord = Omit<User, "id">;
export type CreateContractRecord = Omit<Contract, "id">;

export interface DataRepository {
  readonly source: "demo" | "supabase";
  listContracts(): Contract[] | Promise<Contract[]>;
  createContract(input: CreateContractRecord): Contract | Promise<Contract>;
  updateContract(contractId: string, updates: Partial<Contract>): Contract | Promise<Contract>;
  listUsers(): User[] | Promise<User[]>;
  createUser(input: CreateUserRecord): User | Promise<User>;
  updateUser(userId: string, updates: Partial<User>): User | Promise<User>;
  listCategories(): TicketCategory[] | Promise<TicketCategory[]>;
  listTickets(): Ticket[] | Promise<Ticket[]>;
  createTicket(ticket: CreateTicketRecord): Ticket | Promise<Ticket>;
  updateTicket(ticketId: string, updates: Partial<Ticket>): Ticket | Promise<Ticket>;
}
