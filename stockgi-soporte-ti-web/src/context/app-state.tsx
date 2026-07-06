"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import type { Contract, CreateUserInput, CreatedUserResult, Role, Ticket, TicketAttachment, TicketCategory, User } from "@/lib/types";

type CreateTicketInput = {
  categoryId: string;
  requestTypeId: string;
  description: string;
  attachments: TicketAttachment[];
};

type CreateContractInput = Omit<Contract, "id">;

type AppState = {
  contracts: Contract[];
  categories: TicketCategory[];
  users: User[];
  tickets: Ticket[];
  currentUser: User;
  loading: boolean;
  refreshData: () => Promise<void>;
  setCurrentUserId: (id: string) => void;
  createTicket: (input: CreateTicketInput) => Promise<Ticket>;
  uploadTicketAttachments: (ticketId: string, files: File[], commentId?: string | null) => Promise<Ticket>;
  updateTicket: (ticketId: string, updates: Partial<Pick<Ticket, "status" | "assigneeId" | "priority" | "categoryId" | "requestTypeId" | "diagnosis" | "solution">>) => void;
  addComment: (ticketId: string, message: string, roleOverride?: Role) => Promise<Ticket>;
  takeTicket: (ticketId: string) => Promise<Ticket>;
  requestTicketInfo: (ticketId: string, message: string) => Promise<Ticket>;
  closeTicket: (ticketId: string, solution: string) => Promise<Ticket>;
  createUser: (input: CreateUserInput) => Promise<CreatedUserResult>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<User>;
  resetUserPassword: (userId: string) => Promise<CreatedUserResult>;
  deleteUser: (userId: string) => Promise<void>;
  createContract: (input: CreateContractInput) => Promise<Contract>;
  updateContract: (contractId: string, updates: Partial<Contract>) => Promise<Contract>;
};

const AppStateContext = createContext<AppState | null>(null);

const emptyUser: User = {
  id: "",
  contractId: "",
  cedula: "",
  name: "",
  role: "usuario",
  status: "Activo",
  locale: "es-CO",
};

function nowLabel() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [currentUserId, setCurrentUserIdState] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUser = currentUserId ? users.find((user) => user.id === currentUserId) ?? emptyUser : emptyUser;

  async function refreshData() {
    setLoading(true);
    try {
      const mePayload = await apiFetch<{ user: User }>("/api/auth/me").catch(() => null);
      const sessionUser = mePayload?.user;
      const [contractsPayload, categoriesPayload, ticketsPayload, usersPayload] = await Promise.all([
        apiFetch<{ contracts: Contract[] }>("/api/contracts").catch(() => ({ contracts: [] })),
        apiFetch<{ categories: TicketCategory[] }>("/api/categories").catch(() => ({ categories: [] })),
        apiFetch<{ tickets: Ticket[] }>("/api/tickets?all=true").catch(() => ({ tickets: [] })),
        apiFetch<{ users: User[] }>("/api/users").catch(() => ({ users: [] })),
      ]);

      if (!sessionUser) {
        setCurrentUserIdState("");
        setContracts(contractsPayload.contracts);
        setCategories(categoriesPayload.categories);
        setTickets([]);
        setUsers([]);
        return;
      }

      const merged = new Map<string, User>();
      for (const user of usersPayload.users) merged.set(user.id, user);
      merged.set(sessionUser.id, sessionUser);

      setCurrentUserIdState(sessionUser.id);
      setContracts(contractsPayload.contracts);
      setCategories(categoriesPayload.categories);
      setTickets(ticketsPayload.tickets);
      setUsers(Array.from(merged.values()));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const task = window.setTimeout(() => {
      void refreshData();
    }, 0);
    return () => window.clearTimeout(task);
  }, []);

  function setCurrentUserId(id: string) {
    setCurrentUserIdState(id);
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
    loading,
    refreshData,
    setCurrentUserId,
    async createTicket(input) {
      const { ticket } = await apiFetch<{ ticket: Ticket }>("/api/tickets", { method: "POST", body: JSON.stringify(input) });
      return replaceTicket(ticket);
    },
    async uploadTicketAttachments(ticketId, files, commentId) {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }
      if (commentId) {
        formData.append("commentId", commentId);
      }
      const { ticket } = await apiFetch<{ ticket: Ticket }>(`/api/tickets/${ticketId}/attachments`, { method: "POST", body: formData });
      return replaceTicket(ticket);
    },
    updateTicket(ticketId, updates) {
      setTickets((items) => items.map((ticket) => (
        ticket.id === ticketId ? { ...ticket, ...updates, updatedAt: nowLabel() } : ticket
      )));
    },
    async addComment(ticketId, message) {
      const { ticket } = await apiFetch<{ ticket: Ticket }>(`/api/tickets/${ticketId}/comment`, { method: "POST", body: JSON.stringify({ message }) });
      return replaceTicket(ticket);
    },
    async takeTicket(ticketId) {
      const { ticket } = await apiFetch<{ ticket: Ticket }>(`/api/tickets/${ticketId}/take`, { method: "POST" });
      return replaceTicket(ticket);
    },
    async requestTicketInfo(ticketId, message) {
      const { ticket } = await apiFetch<{ ticket: Ticket }>(`/api/tickets/${ticketId}/request-info`, { method: "POST", body: JSON.stringify({ message }) });
      return replaceTicket(ticket);
    },
    async closeTicket(ticketId, solution) {
      const { ticket } = await apiFetch<{ ticket: Ticket }>(`/api/tickets/${ticketId}/close`, { method: "POST", body: JSON.stringify({ solution }) });
      return replaceTicket(ticket);
    },
    async createUser(input) {
      const created = await apiFetch<CreatedUserResult>("/api/admin/users", { method: "POST", body: JSON.stringify(input) });
      setUsers((items) => [created.user, ...items]);
      return created;
    },
    async updateUser(userId, updates) {
      const { user } = await apiFetch<{ user: User }>(`/api/admin/users/${userId}`, { method: "PATCH", body: JSON.stringify(updates) });
      setUsers((items) => items.map((item) => (item.id === userId ? user : item)));
      return user;
    },
    async resetUserPassword(userId) {
      const result = await apiFetch<CreatedUserResult>(`/api/admin/users/${userId}/reset-password`, { method: "POST" });
      setUsers((items) => items.map((item) => (item.id === userId ? result.user : item)));
      return result;
    },
    async deleteUser(userId) {
      await apiFetch<{ deleted: boolean }>(`/api/admin/users/${userId}`, { method: "DELETE" });
      setUsers((items) => items.filter((item) => item.id !== userId));
    },
    async createContract(input) {
      const { contract } = await apiFetch<{ contract: Contract }>("/api/admin/contracts", { method: "POST", body: JSON.stringify(input) });
      setContracts((items) => [contract, ...items]);
      return contract;
    },
    async updateContract(contractId, updates) {
      const { contract } = await apiFetch<{ contract: Contract }>(`/api/admin/contracts/${contractId}`, { method: "PATCH", body: JSON.stringify(updates) });
      setContracts((items) => items.map((item) => (item.id === contractId ? contract : item)));
      return contract;
    },
  }), [contracts, categories, currentUser, loading, tickets, users]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState debe usarse dentro de AppStateProvider");
  }
  return context;
}
