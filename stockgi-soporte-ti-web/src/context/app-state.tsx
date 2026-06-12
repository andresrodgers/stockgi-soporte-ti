"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { categories, contracts as initialContracts, initialTickets, users as initialUsers } from "@/lib/demo-data";
import type { Contract, Priority, Role, Ticket, TicketAttachment, TicketStatus, User } from "@/lib/types";

type CreateTicketInput = {
  categoryId: string;
  requestTypeId: string;
  subject: string;
  description: string;
  attachments: TicketAttachment[];
};

type CreateUserInput = Omit<User, "id">;
type CreateContractInput = Omit<Contract, "id">;

type ApiResponse<T> = { data?: T; error?: string };

type AppState = {
  contracts: Contract[];
  categories: typeof categories;
  users: User[];
  tickets: Ticket[];
  currentUser: User;
  setCurrentUserId: (id: string) => void;
  createTicket: (input: CreateTicketInput) => Promise<Ticket>;
  updateTicket: (ticketId: string, updates: Partial<Pick<Ticket, "status" | "assigneeId" | "priority" | "categoryId" | "requestTypeId" | "diagnosis" | "solution">>) => void;
  addComment: (ticketId: string, message: string, roleOverride?: Role) => Promise<Ticket>;
  takeTicket: (ticketId: string) => Promise<Ticket>;
  requestTicketInfo: (ticketId: string, message: string) => Promise<Ticket>;
  closeTicket: (ticketId: string, solution: string) => Promise<Ticket>;
  createUser: (input: CreateUserInput) => Promise<User>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<User>;
  createContract: (input: CreateContractInput) => Promise<Contract>;
  updateContract: (contractId: string, updates: Partial<Contract>) => Promise<Contract>;
};

const AppStateContext = createContext<AppState | null>(null);

function nextDueDate(priority: Priority) {
  const date = new Date();
  const hoursByPriority: Record<Priority, number> = {
    Critica: 4,
    Alta: 8,
    Media: 48,
    Baja: 120,
  };
  date.setHours(date.getHours() + hoursByPriority[priority]);
  return date.toISOString().slice(0, 16).replace("T", " ");
}

function nowLabel() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `item-${Date.now()}`;
}

async function apiJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.data) {
    throw new Error(payload.error || "Error de API interna");
  }

  return payload.data;
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [currentUserId, setCurrentUserIdState] = useState(() => {
    if (typeof window === "undefined") return "user-1";
    return window.localStorage.getItem("stockgi-demo-user-id") || "user-1";
  });
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [contracts, setContracts] = useState<Contract[]>(initialContracts);
  const currentUser = users.find((user) => user.id === currentUserId) ?? users[0];



  useEffect(() => {
    void Promise.all([
      fetch("/api/auth/me").then((response) => response.ok ? response.json() : null),
      fetch("/api/contracts").then((response) => response.ok ? response.json() : null),
      fetch("/api/tickets").then((response) => response.ok ? response.json() : null),
    ]).then(([mePayload, contractsPayload, ticketsPayload]) => {
      if (mePayload?.data?.user) {
        const sessionUser = mePayload.data.user as User;
        setUsers((items) => items.some((item) => item.id === sessionUser.id) ? items.map((item) => (item.id === sessionUser.id ? sessionUser : item)) : [sessionUser, ...items]);
        setCurrentUserIdState(sessionUser.id);
        window.localStorage.setItem("stockgi-demo-user-id", sessionUser.id);
      }
      if (contractsPayload?.data?.contracts) setContracts(contractsPayload.data.contracts);
      if (ticketsPayload?.data?.tickets) setTickets(ticketsPayload.data.tickets);
    }).catch(() => {
      // Demo fallback: keep initial in-memory data if the API session is not ready.
    });
  }, []);
  function setCurrentUserId(id: string) {
    setCurrentUserIdState(id);
    window.localStorage.setItem("stockgi-demo-user-id", id);
  }

  function replaceTicket(ticket: Ticket) {
    setTickets((items) => items.some((item) => item.id === ticket.id) ? items.map((item) => (item.id === ticket.id ? ticket : item)) : [ticket, ...items]);
    return ticket;
  }

  const value = useMemo<AppState>(() => ({
    contracts,
    categories,
    users,
    tickets,
    currentUser,
    setCurrentUserId,
    async createTicket(input) {
      try {
        const { ticket } = await apiJson<{ ticket: Ticket }>("/api/tickets", { method: "POST", body: JSON.stringify(input) });
        return replaceTicket(ticket);
      } catch {
        const category = categories.find((item) => item.id === input.categoryId) ?? categories[0];
        const requestType = category.requestTypes.find((item) => item.id === input.requestTypeId) ?? category.requestTypes[0];
        const createdAt = nowLabel();
        const ticket: Ticket = {
          id: `ticket-${Date.now()}`,
          number: `STK-${String(tickets.length + 1).padStart(4, "0")}`,
          subject: input.subject,
          description: input.description,
          categoryId: category.id,
          requestTypeId: requestType.id,
          priority: requestType.priority,
          status: "Nuevo",
          requesterId: currentUser.id,
          contractId: currentUser.contractId,
          createdAt,
          updatedAt: createdAt,
          dueAt: nextDueDate(requestType.priority),
          attachments: input.attachments,
          comments: [{ id: `comment-${Date.now()}`, author: currentUser.name, role: currentUser.role, message: "Ticket creado por el usuario.", createdAt }],
        };
        return replaceTicket(ticket);
      }
    },
    updateTicket(ticketId, updates) {
      setTickets((items) => items.map((ticket) => (
        ticket.id === ticketId ? { ...ticket, ...updates, updatedAt: nowLabel() } : ticket
      )));
    },
    async addComment(ticketId, message, roleOverride) {
      try {
        const { ticket } = await apiJson<{ ticket: Ticket }>(`/api/tickets/${ticketId}/comment`, { method: "POST", body: JSON.stringify({ message }) });
        return replaceTicket(ticket);
      } catch {
        const now = nowLabel();
        const ticket = tickets.find((item) => item.id === ticketId);
        if (!ticket) throw new Error("Ticket no encontrado");
        return replaceTicket({
          ...ticket,
          updatedAt: now,
          comments: [...ticket.comments, { id: `comment-${Date.now()}`, author: currentUser.name, role: roleOverride ?? currentUser.role, message, createdAt: now }],
        });
      }
    },
    async takeTicket(ticketId) {
      const { ticket } = await apiJson<{ ticket: Ticket }>(`/api/tickets/${ticketId}/take`, { method: "POST" });
      return replaceTicket(ticket);
    },
    async requestTicketInfo(ticketId, message) {
      const { ticket } = await apiJson<{ ticket: Ticket }>(`/api/tickets/${ticketId}/request-info`, { method: "POST", body: JSON.stringify({ message }) });
      return replaceTicket(ticket);
    },
    async closeTicket(ticketId, solution) {
      const { ticket } = await apiJson<{ ticket: Ticket }>(`/api/tickets/${ticketId}/close`, { method: "POST", body: JSON.stringify({ solution }) });
      return replaceTicket(ticket);
    },
    async createUser(input) {
      try {
        const { user } = await apiJson<{ user: User }>("/api/admin/users", { method: "POST", body: JSON.stringify(input) });
        setUsers((items) => [user, ...items]);
        return user;
      } catch {
        const user: User = { ...input, id: `user-${Date.now()}` };
        setUsers((items) => [user, ...items]);
        return user;
      }
    },
    async updateUser(userId, updates) {
      try {
        const { user } = await apiJson<{ user: User }>(`/api/admin/users/${userId}`, { method: "PATCH", body: JSON.stringify(updates) });
        setUsers((items) => items.map((item) => (item.id === userId ? user : item)));
        return user;
      } catch {
        const user = users.find((item) => item.id === userId);
        if (!user) throw new Error("Usuario no encontrado");
        const updated = { ...user, ...updates };
        setUsers((items) => items.map((item) => (item.id === userId ? updated : item)));
        return updated;
      }
    },
    async createContract(input) {
      try {
        const { contract } = await apiJson<{ contract: Contract }>("/api/admin/contracts", { method: "POST", body: JSON.stringify(input) });
        setContracts((items) => [contract, ...items]);
        return contract;
      } catch {
        const contract: Contract = { ...input, id: `${slugify(input.name)}-${Date.now()}` };
        setContracts((items) => [contract, ...items]);
        return contract;
      }
    },
    async updateContract(contractId, updates) {
      try {
        const { contract } = await apiJson<{ contract: Contract }>(`/api/admin/contracts/${contractId}`, { method: "PATCH", body: JSON.stringify(updates) });
        setContracts((items) => items.map((item) => (item.id === contractId ? contract : item)));
        return contract;
      } catch {
        const contract = contracts.find((item) => item.id === contractId);
        if (!contract) throw new Error("Contrato no encontrado");
        const updated = { ...contract, ...updates };
        setContracts((items) => items.map((item) => (item.id === contractId ? updated : item)));
        return updated;
      }
    },
  }), [contracts, currentUser, tickets, users]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }
  return context;
}

export const statusOptions: TicketStatus[] = [
  "Nuevo",
  "Asignado",
  "En proceso",
  "Esperando informacion",
  "Resuelto",
  "Cerrado",
  "Reabierto",
  "Cancelado",
];





