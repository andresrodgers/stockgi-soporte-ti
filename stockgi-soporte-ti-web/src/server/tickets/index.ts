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

async function canViewTicket(ticket: Ticket, userId: string) {
  const user = await getCurrentUser(userId);
  if (!user || user.mustChangePassword) return false;
  if (user.role === "ti_administrativo") return true;
  if (user.role === "ti_operativo") return !ticket.assigneeId || ticket.assigneeId === user.id || ticket.status === "Esperando informacion";
  return ticket.requesterId === user.id;
}

export async function listTicketsForUser(userId: string) {
  const user = await getCurrentUser(userId);
  if (!user) throw new Error("Sesion invalida");
  if (user.mustChangePassword) throw new Error("Debe cambiar la contrasena temporal antes de continuar");
  const { tickets } = await repoData();

  if (user.role === "ti_administrativo") return tickets;
  if (user.role === "ti_operativo") {
    return tickets.filter((ticket) => !ticket.assigneeId || ticket.assigneeId === user.id || ticket.status === "Esperando informacion");
  }

  return tickets.filter((ticket) => ticket.requesterId === user.id);
}

export async function getTicketForUser(ticketId: string, userId: string) {
  const ticket = await findTicket(ticketId);
  if (!(await canViewTicket(ticket, userId))) throw new Error("No autorizado");
  return ticket;
}

export async function createTicketForUser(userId: string, input: CreateTicketInput) {
  const user = await assertRole(userId, ["usuario"]);
  const { repository, tickets, categories } = await repoData();
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

export async function addTicketComment(ticketId: string, userId: string, message: string, roleOverride?: Role) {
  const user = await getCurrentUser(userId);
  if (!user) throw new Error("Sesion invalida");
  if (user.mustChangePassword) throw new Error("Debe cambiar la contrasena temporal antes de continuar");
  const ticket = await findTicket(ticketId);
  if (!(await canViewTicket(ticket, userId))) throw new Error("No autorizado");
  const now = nowLabel();
  return getRepository().updateTicket(ticketId, {
    updatedAt: now,
    comments: [...ticket.comments, { id: `comment-${Date.now()}`, author: user.name, role: roleOverride ?? user.role, message, createdAt: now }],
  });
}

export async function takeTicket(ticketId: string, userId: string) {
  const user = await assertRole(userId, ["ti_operativo"]);
  const ticket = await findTicket(ticketId);
  if (ticket.assigneeId && ticket.assigneeId !== user.id) throw new Error("El ticket ya esta asignado");
  await updateTicket(ticketId, { assigneeId: user.id, status: "En proceso" });
  return addTicketComment(ticketId, userId, `Ticket tomado por ${user.name}. Se inicia atencion.`, "ti_operativo");
}

export async function requestTicketInfo(ticketId: string, userId: string, message: string) {
  const user = await assertRole(userId, ["ti_operativo", "ti_administrativo"]);
  await updateTicket(ticketId, { status: "Esperando informacion" });
  return addTicketComment(ticketId, userId, `Solicitud de informacion: ${message}`, user.role);
}

export async function closeTicket(ticketId: string, userId: string, solution: string) {
  const user = await assertRole(userId, ["ti_operativo", "ti_administrativo"]);
  await updateTicket(ticketId, { status: "Cerrado", solution });
  return addTicketComment(ticketId, userId, `Ticket resuelto y cerrado: ${solution}`, user.role);
}

export async function addTicketAttachments(ticketId: string, userId: string, attachments: TicketAttachment[]) {
  const ticket = await findTicket(ticketId);
  if (!(await canViewTicket(ticket, userId))) throw new Error("No autorizado");
  return updateTicket(ticketId, { attachments: [...ticket.attachments, ...attachments] });
}

export async function updateTicket(ticketId: string, updates: Partial<Ticket>) {
  return getRepository().updateTicket(ticketId, { ...updates, updatedAt: nowLabel() });
}

