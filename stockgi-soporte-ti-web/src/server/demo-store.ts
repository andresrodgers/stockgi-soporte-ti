import { categories as initialCategories, contracts as initialContracts, initialTickets, users as initialUsers } from "@/lib/demo-data";
import type { Contract, Ticket, User } from "@/lib/types";

type DemoStore = {
  contracts: Contract[];
  users: User[];
  tickets: Ticket[];
};

declare global {
  var stockgiDemoStore: DemoStore | undefined;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function getDemoStore() {
  if (!globalThis.stockgiDemoStore) {
    globalThis.stockgiDemoStore = {
      contracts: clone(initialContracts),
      users: clone(initialUsers),
      tickets: clone(initialTickets),
    };
  }

  return globalThis.stockgiDemoStore;
}

export const demoCategories = initialCategories;

export function safeUser(user: User) {
  return { ...user };
}

export function nowLabel() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

export function nextDueDate(priority: Ticket["priority"]) {
  const date = new Date();
  const hoursByPriority: Record<Ticket["priority"], number> = {
    Critica: 4,
    Alta: 8,
    Media: 48,
    Baja: 120,
  };
  date.setHours(date.getHours() + hoursByPriority[priority]);
  return date.toISOString().slice(0, 16).replace("T", " ");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `item-${Date.now()}`;
}

