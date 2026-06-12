import type { Role, Ticket, TicketAttachment } from "@/lib/types";
import { nextDueDate, nowLabel } from "@/server/demo-store";
import { assertRole, getCurrentUser } from "@/server/auth";
import { getRepository } from "@/server/repositories";

type CreateTicketInput = {
  categoryId: string;
  requestTypeId: string;
  subject: string;
  description: string;
  attachments: TicketAttachment[];
};

function repoData() {
  const repository = getRepository();
  const tickets = repository.listTickets();
  const categories = repository.listCategories();
  if (tickets instanceof Promise || categories instanceof Promise) throw new Error("Repositorio asincrono pendiente de integracion");
  return { repository, tickets, categories };
}

function findTicket(ticketId: string) {
  const { tickets } = repoData();
  const ticket = tickets.find((item) => item.id === ticketId);
  if (!ticket) throw new Error("Ticket no encontrado");
  return ticket;
}

function canViewTicket(ticket: Ticket, userId: string) {
  const user = getCurrentUser(userId);
  if (!user) return false;
  if (user.role === "ti_administrativo") return true;
  if (user.role === "ti_operativo") return !ticket.assigneeId || ticket.assigneeId === user.id || ticket.status === "Esperando informacion";
  return ticket.requesterId === user.id;
}

export function listTicketsForUser(userId: string) {
  const user = getCurrentUser(userId);
  if (!user) throw new Error("Sesion invalida");
  const { tickets } = repoData();

  if (user.role === "ti_administrativo") return tickets;
  if (user.role === "ti_operativo") {
    return tickets.filter((ticket) => !ticket.assigneeId || ticket.assigneeId === user.id || ticket.status === "Esperando informacion");
  }

  return tickets.filter((ticket) => ticket.requesterId === user.id);
}

export function getTicketForUser(ticketId: string, userId: string) {
  const ticket = findTicket(ticketId);
  if (!canViewTicket(ticket, userId)) throw new Error("No autorizado");
  return ticket;
}

export function createTicketForUser(userId: string, input: CreateTicketInput) {
  const user = assertRole(userId, ["usuario"]);
  const { repository, tickets, categories } = repoData();
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
    requesterId: user.id,
    contractId: user.contractId,
    createdAt,
    updatedAt: createdAt,
    dueAt: nextDueDate(requestType.priority),
    attachments: input.attachments,
    comments: [{ id: `comment-${Date.now()}`, author: user.name, role: user.role, message: "Ticket creado por el usuario.", createdAt }],
  };
  return repository.createTicket(ticket);
}

export function addTicketComment(ticketId: string, userId: string, message: string, roleOverride?: Role) {
  const user = getCurrentUser(userId);
  if (!user) throw new Error("Sesion invalida");
  const ticket = findTicket(ticketId);
  if (!canViewTicket(ticket, userId)) throw new Error("No autorizado");
  const now = nowLabel();
  return getRepository().updateTicket(ticketId, {
    updatedAt: now,
    comments: [...ticket.comments, { id: `comment-${Date.now()}`, author: user.name, role: roleOverride ?? user.role, message, createdAt: now }],
  });
}

export function takeTicket(ticketId: string, userId: string) {
  const user = assertRole(userId, ["ti_operativo"]);
  const ticket = findTicket(ticketId);
  if (ticket.assigneeId && ticket.assigneeId !== user.id) throw new Error("El ticket ya esta asignado");
  updateTicket(ticketId, { assigneeId: user.id, status: "En proceso" });
  return addTicketComment(ticketId, userId, `Ticket tomado por ${user.name}. Se inicia atencion.`, "ti_operativo");
}

export function requestTicketInfo(ticketId: string, userId: string, message: string) {
  assertRole(userId, ["ti_operativo", "ti_administrativo"]);
  updateTicket(ticketId, { status: "Esperando informacion" });
  return addTicketComment(ticketId, userId, `Solicitud de informacion: ${message}`, getCurrentUser(userId)?.role);
}

export function closeTicket(ticketId: string, userId: string, solution: string) {
  assertRole(userId, ["ti_operativo", "ti_administrativo"]);
  updateTicket(ticketId, { status: "Cerrado", solution });
  return addTicketComment(ticketId, userId, `Ticket resuelto y cerrado: ${solution}`, getCurrentUser(userId)?.role);
}

export function addTicketAttachments(ticketId: string, userId: string, attachments: TicketAttachment[]) {
  const ticket = findTicket(ticketId);
  if (!canViewTicket(ticket, userId)) throw new Error("No autorizado");
  return updateTicket(ticketId, { attachments: [...ticket.attachments, ...attachments] });
}

export function updateTicket(ticketId: string, updates: Partial<Ticket>) {
  return getRepository().updateTicket(ticketId, { ...updates, updatedAt: nowLabel() });
}

