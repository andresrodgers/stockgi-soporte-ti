import type { PaginatedResult, Role, Ticket, TicketAttachment, TicketStatus, User } from "@/lib/types";
import { assertRole, getCurrentUser } from "@/server/auth";
import { getRepository } from "@/server/repositories";

type CreateTicketInput = {
  categoryId: string;
  requestTypeId: string;
  description: string;
  attachments: TicketAttachment[];
};

type ListTicketsPageInput = {
  page: number;
  pageSize: number;
  status?: TicketStatus;
  scope?: "all" | "assigned" | "waiting";
};

function nowLabel() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

async function repoData() {
  const repository = getRepository();
  const tickets = await repository.listTickets();
  const categories = await repository.listCategories();
  return { repository, tickets, categories };
}

async function findTicket(ticketId: string) {
  const { tickets } = await repoData();
  const ticket = tickets.find((item) => item.id === ticketId);
  if (!ticket) throw new Error("Ticket no encontrado");
  return ticket;
}

function canViewTicket(ticket: Ticket, user: User) {
  if (user.mustChangePassword) return false;
  if (user.role === "ti_administrativo") return true;
  if (user.role === "ti_operativo") return !ticket.assigneeId || ticket.assigneeId === user.id;
  return ticket.requesterId === user.id;
}

function canActOnTicket(ticket: Ticket, user: User) {
  if (user.mustChangePassword) return false;
  if (user.role === "ti_administrativo") return true;
  if (user.role === "ti_operativo") return ticket.assigneeId === user.id;
  return ticket.requesterId === user.id;
}

export async function listTicketsForUser(userId: string) {
  const user = await getCurrentUser(userId);
  if (!user) throw new Error("Sesion invalida");
  if (user.mustChangePassword) throw new Error("Debe cambiar la contrasena temporal antes de continuar");
  const { tickets } = await repoData();

  if (user.role === "ti_administrativo") return tickets;
  if (user.role === "ti_operativo") {
    return tickets.filter((ticket) => !ticket.assigneeId || ticket.assigneeId === user.id);
  }

  return tickets.filter((ticket) => ticket.requesterId === user.id);
}

export async function listTicketsPageForUser(userId: string, input: ListTicketsPageInput): Promise<PaginatedResult<Ticket>> {
  const user = await getCurrentUser(userId);
  if (!user) throw new Error("Sesion invalida");
  if (user.mustChangePassword) throw new Error("Debe cambiar la contrasena temporal antes de continuar");

  return getRepository().listTicketsPage({
    page: input.page,
    pageSize: input.pageSize,
    role: user.role,
    userId: user.id,
    status: input.status,
    scope: input.scope,
  });
}
export async function getTicketForUser(ticketId: string, userId: string) {
  const user = await getCurrentUser(userId);
  if (!user) throw new Error("Sesion invalida");
  const ticket = await findTicket(ticketId);
  if (!canViewTicket(ticket, user)) throw new Error("No autorizado");
  return ticket;
}

export async function createTicketForUser(userId: string, input: CreateTicketInput) {
  const user = await assertRole(userId, ["usuario"]);
  const { repository, tickets, categories } = await repoData();
  const category = categories.find((item) => item.id === input.categoryId);
  if (!category) throw new Error("Categoria no encontrada");
  const requestType = category.requestTypes.find((item) => item.id === input.requestTypeId);
  if (!requestType) throw new Error("Tipo de solicitud no encontrado");
  const createdAt = nowLabel();
  const ticket: Ticket = {
    id: `ticket-${Date.now()}`,
    number: `STI-${String(tickets.length + 1).padStart(6, "0")}`,
    subject: requestType.name,
    description: input.description,
    categoryId: category.id,
    requestTypeId: requestType.id,
    priority: requestType.priority,
    status: "Nuevo",
    requesterId: user.id,
    contractId: user.contractId,
    createdAt,
    updatedAt: createdAt,
    dueAt: createdAt,
    attachments: input.attachments,
    comments: [{ id: `comment-${Date.now()}`, author: user.name, role: user.role, message: "Ticket creado por el usuario.", createdAt }],
  };
  return repository.createTicket(ticket);
}

export async function addTicketComment(ticketId: string, userId: string, message: string, options?: { roleOverride?: Role; commentType?: "comment" | "request_info" | "resolution" | "system" }) {
  const user = await getCurrentUser(userId);
  if (!user) throw new Error("Sesion invalida");
  if (user.mustChangePassword) throw new Error("Debe cambiar la contrasena temporal antes de continuar");
  const ticket = await findTicket(ticketId);
  const allowed = user.role === "usuario" ? canViewTicket(ticket, user) : canActOnTicket(ticket, user);
  if (!allowed) throw new Error("No autorizado");
  const now = nowLabel();
  return getRepository().updateTicket(ticketId, {
    actorUserId: user.id,
    commentType: options?.commentType ?? "comment",
    updatedAt: now,
    comments: [...ticket.comments, { id: `comment-${Date.now()}`, author: user.name, role: options?.roleOverride ?? user.role, message, createdAt: now }],
  });
}

export async function takeTicket(ticketId: string, userId: string) {
  const user = await assertRole(userId, ["ti_operativo", "ti_administrativo"]);
  const ticket = await findTicket(ticketId);
  if (ticket.assigneeId && ticket.assigneeId !== user.id) throw new Error("El ticket ya esta asignado");
  await updateTicket(ticketId, { assigneeId: user.id, status: "En proceso", actorUserId: user.id });
  return addTicketComment(ticketId, userId, `Ticket tomado por ${user.name}. Se inicia atencion.`, { roleOverride: user.role, commentType: "system" });
}

export async function requestTicketInfo(ticketId: string, userId: string, message: string) {
  const user = await assertRole(userId, ["ti_operativo", "ti_administrativo"]);
  const ticket = await findTicket(ticketId);
  if (!canActOnTicket(ticket, user)) throw new Error("No autorizado");
  await updateTicket(ticketId, { status: "Esperando informacion", actorUserId: user.id });
  return addTicketComment(ticketId, userId, `Solicitud de informacion: ${message}`, { roleOverride: user.role, commentType: "request_info" });
}

export async function closeTicket(ticketId: string, userId: string, solution: string) {
  const user = await assertRole(userId, ["ti_operativo", "ti_administrativo"]);
  const ticket = await findTicket(ticketId);
  if (!canActOnTicket(ticket, user)) throw new Error("No autorizado");
  await updateTicket(ticketId, { status: "Cerrado", solution, actorUserId: user.id, closedById: user.id });
  return addTicketComment(ticketId, userId, `Ticket resuelto y cerrado: ${solution}`, { roleOverride: user.role, commentType: "resolution" });
}

export async function addTicketAttachments(ticketId: string, userId: string, attachments: TicketAttachment[], commentId?: string | null) {
  const user = await getCurrentUser(userId);
  if (!user) throw new Error("Sesion invalida");
  if (user.mustChangePassword) throw new Error("Debe cambiar la contrasena temporal antes de continuar");
  const ticket = await findTicket(ticketId);
  const allowed = user.role === "usuario" ? canViewTicket(ticket, user) : canActOnTicket(ticket, user);
  if (!allowed) throw new Error("No autorizado");
  return updateTicket(ticketId, { actorUserId: user.id, attachmentCommentId: commentId ?? null, attachments: [...ticket.attachments, ...attachments] });
}

export async function updateTicket(ticketId: string, updates: Partial<Ticket> & { actorUserId?: string; commentType?: "comment" | "request_info" | "resolution" | "system"; attachmentCommentId?: string | null; closedById?: string | null }) {
  return getRepository().updateTicket(ticketId, { ...updates, updatedAt: nowLabel() });
}

