import type { Contract, Ticket, User } from "@/lib/types";
import { demoCategories, getDemoStore, slugify } from "@/server/demo-store";
import type { CreateContractRecord, CreateUserRecord, DataRepository } from "./types";

export const demoRepository: DataRepository = {
  source: "demo",
  listContracts() {
    return getDemoStore().contracts;
  },
  createContract(input: CreateContractRecord) {
    const store = getDemoStore();
    const contract: Contract = { ...input, id: `${slugify(input.name)}-${Date.now()}` };
    store.contracts = [contract, ...store.contracts];
    return contract;
  },
  updateContract(contractId: string, updates: Partial<Contract>) {
    const store = getDemoStore();
    const index = store.contracts.findIndex((item) => item.id === contractId);
    if (index < 0) throw new Error("Contrato no encontrado");
    store.contracts[index] = { ...store.contracts[index], ...updates, id: contractId };
    return store.contracts[index];
  },
  listUsers() {
    return getDemoStore().users;
  },
  createUser(input: CreateUserRecord) {
    const store = getDemoStore();
    const exists = store.users.some((user) => user.contractId === input.contractId && user.cedula === input.cedula);
    if (exists) throw new Error("Ya existe un usuario con esa cedula en ese contrato");

    const user: User = { ...input, id: `user-${Date.now()}` };
    store.users = [user, ...store.users];
    return user;
  },
  updateUser(userId: string, updates: Partial<User>) {
    const store = getDemoStore();
    const index = store.users.findIndex((item) => item.id === userId);
    if (index < 0) throw new Error("Usuario no encontrado");
    store.users[index] = { ...store.users[index], ...updates, id: userId };
    return store.users[index];
  },
  listCategories() {
    return demoCategories;
  },
  listTickets() {
    return getDemoStore().tickets;
  },
  createTicket(ticket: Ticket) {
    const store = getDemoStore();
    store.tickets = [ticket, ...store.tickets];
    return ticket;
  },
  updateTicket(ticketId: string, updates: Partial<Ticket>) {
    const store = getDemoStore();
    const ticket = store.tickets.find((item) => item.id === ticketId);
    if (!ticket) throw new Error("Ticket no encontrado");
    const updated = { ...ticket, ...updates, id: ticketId };
    store.tickets = store.tickets.map((item) => (item.id === ticketId ? updated : item));
    return updated;
  },
};
