import type { Contract, CreateUserInput, Priority, Role, Ticket, TicketAttachment, TicketCategory, TicketComment, TicketStatus, User } from "@/lib/types";
import { query } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import type { CreateContractRecord, CreateTicketRecord, DataRepository } from "./types";

type DbContract = { id: string; name: string; client_name: string | null; status: "active" | "inactive" };
type DbUser = { id: string; contract_id: string; document_id: string; full_name: string; role: Role; email: string | null; phone: string | null; area: string | null; position: string | null; location: string | null; status: "active" | "inactive"; must_change_password: boolean };
type DbCategory = { id: string; name: string; description: string | null };
type DbRequestType = { id: string; category_id: string; name: string; default_priority: "baja" | "media" | "alta" | "critica"; response_sla_minutes: number; resolution_sla_minutes: number; attachment_rule: "not_required" | "recommended" | "required" };
type DbTicket = { id: string; ticket_number: string; contract_id: string; requester_id: string; category_id: string; request_type_id: string; subject: string; description: string; status: string; priority: string; resolution_due_at: Date | string; assigned_to_id: string | null; solution: string | null; internal_notes: string | null; created_at: Date | string; updated_at: Date | string };
type DbComment = { id: string; ticket_id: string; author_id: string; author_name: string; author_role: Role; body: string; comment_type: string; created_at: Date | string };
type DbAttachment = { id: string; ticket_id: string; storage_path: string; original_filename: string; mime_type: string; original_size_bytes: string | number; stored_size_bytes: string | number; compression_status: TicketAttachment["compressionStatus"]; retention_days: number; delete_after_at: Date | string | null; deleted_at: Date | string | null };

const priorityFromDb: Record<string, Priority> = { baja: "Baja", media: "Media", alta: "Alta", critica: "Critica" };
const statusToDb: Record<TicketStatus, string> = { Nuevo: "nuevo", Asignado: "asignado", "En proceso": "en_proceso", "Esperando informacion": "esperando_informacion", Resuelto: "resuelto", Cerrado: "cerrado", Reabierto: "reabierto", Cancelado: "cancelado" };
const statusFromDb: Record<string, TicketStatus> = { nuevo: "Nuevo", asignado: "Asignado", en_proceso: "En proceso", esperando_informacion: "Esperando informacion", resuelto: "Resuelto", cerrado: "Cerrado", reabierto: "Reabierto", cancelado: "Cancelado" };

function toIsoLabel(value: Date | string | null | undefined) {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 16).replace("T", " ");
}

function contractFromDb(row: DbContract): Contract {
  return { id: row.id, name: row.name, client: row.client_name || row.name, status: row.status === "active" ? "Activo" : "Inactivo" };
}

function userFromDb(row: DbUser): User {
  return {
    id: row.id,
    contractId: row.contract_id,
    cedula: row.document_id,
    name: row.full_name,
    role: row.role,
    email: row.email || undefined,
    phone: row.phone || undefined,
    area: row.area || undefined,
    position: row.position || undefined,
    location: row.location || undefined,
    status: row.status === "active" ? "Activo" : "Inactivo",
    mustChangePassword: row.must_change_password,
  };
}

function requestTypeFromDb(row: DbRequestType) {
  return {
    id: row.id,
    name: row.name,
    priority: priorityFromDb[row.default_priority],
    firstResponseSla: `${row.response_sla_minutes} min`,
    resolutionSla: row.resolution_sla_minutes >= 1440 ? `${Math.round(row.resolution_sla_minutes / 1440)} dias` : `${Math.round(row.resolution_sla_minutes / 60)} h`,
    attachmentRule: row.attachment_rule === "not_required" ? "No obligatorio" as const : "Recomendado" as const,
  };
}

async function listComments(ticketIds: string[]) {
  if (!ticketIds.length) return new Map<string, TicketComment[]>();
  const { rows } = await query<DbComment>(`
    select c.*, u.full_name as author_name, u.role as author_role
    from ticket_comments c
    join app_users u on u.id = c.author_id
    where c.ticket_id = any($1::uuid[])
    order by c.created_at asc
  `, [ticketIds]);
  const map = new Map<string, TicketComment[]>();
  for (const row of rows) {
    const list = map.get(row.ticket_id) || [];
    list.push({ id: row.id, author: row.author_name, role: row.author_role, message: row.body, createdAt: toIsoLabel(row.created_at) || "" });
    map.set(row.ticket_id, list);
  }
  return map;
}

async function listAttachments(ticketIds: string[]) {
  if (!ticketIds.length) return new Map<string, TicketAttachment[]>();
  const { rows } = await query<DbAttachment>(`select * from ticket_attachments where ticket_id = any($1::uuid[]) order by created_at asc`, [ticketIds]);
  const map = new Map<string, TicketAttachment[]>();
  for (const row of rows) {
    const list = map.get(row.ticket_id) || [];
    list.push({
      id: row.id,
      name: row.original_filename,
      originalFilename: row.original_filename,
      mimeType: row.mime_type,
      originalSizeBytes: Number(row.original_size_bytes),
      storedSizeBytes: Number(row.stored_size_bytes),
      compressionStatus: row.compression_status,
      retentionDays: row.retention_days,
      deleteAfterAt: toIsoLabel(row.delete_after_at),
      deletedAt: toIsoLabel(row.deleted_at),
    });
    map.set(row.ticket_id, list);
  }
  return map;
}

async function ticketFromDb(row: DbTicket, comments?: TicketComment[], attachments?: TicketAttachment[]): Promise<Ticket> {
  return {
    id: row.id,
    number: row.ticket_number,
    subject: row.subject,
    description: row.description,
    categoryId: row.category_id,
    requestTypeId: row.request_type_id,
    priority: priorityFromDb[row.priority],
    status: statusFromDb[row.status],
    requesterId: row.requester_id,
    contractId: row.contract_id,
    assigneeId: row.assigned_to_id || undefined,
    createdAt: toIsoLabel(row.created_at) || "",
    updatedAt: toIsoLabel(row.updated_at) || "",
    dueAt: toIsoLabel(row.resolution_due_at) || "",
    attachments: attachments || [],
    diagnosis: row.internal_notes || undefined,
    solution: row.solution || undefined,
    comments: comments || [],
  };
}

async function getTicket(ticketId: string) {
  const { rows } = await query<DbTicket>(`select * from tickets where id = $1`, [ticketId]);
  if (!rows[0]) throw new Error("Ticket no encontrado");
  const comments = await listComments([ticketId]);
  const attachments = await listAttachments([ticketId]);
  return ticketFromDb(rows[0], comments.get(ticketId) || [], attachments.get(ticketId) || []);
}

export const postgresRepository: DataRepository = {
  source: "postgres",
  async listContracts() {
    const { rows } = await query<DbContract>(`select id, name, client_name, status from contracts order by name asc`);
    return rows.map(contractFromDb);
  },
  async createContract(input: CreateContractRecord) {
    const { rows } = await query<DbContract>(`insert into contracts(name, client_name, status) values ($1, $2, $3) returning id, name, client_name, status`, [input.name, input.client || input.name, input.status === "Activo" ? "active" : "inactive"]);
    return contractFromDb(rows[0]);
  },
  async updateContract(contractId, updates) {
    const current = (await this.listContracts()).find((item) => item.id === contractId);
    if (!current) throw new Error("Contrato no encontrado");
    const next = { ...current, ...updates };
    const { rows } = await query<DbContract>(`update contracts set name=$2, client_name=$3, status=$4 where id=$1 returning id, name, client_name, status`, [contractId, next.name, next.client, next.status === "Activo" ? "active" : "inactive"]);
    return contractFromDb(rows[0]);
  },
  async listUsers() {
    const { rows } = await query<DbUser>(`select id, contract_id, document_id, full_name, role, email, phone, area, position, location, status, must_change_password from app_users order by full_name asc`);
    return rows.map(userFromDb);
  },
  async createUser(input: CreateUserInput) {
    const password = input.temporaryPassword || "Stockgi2026!";
    const passwordHash = await hashPassword(password);
    const { rows } = await query<DbUser>(`
      insert into app_users(contract_id, document_id, full_name, role, password_hash, email, phone, area, position, location, status, must_change_password)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      returning id, contract_id, document_id, full_name, role, email, phone, area, position, location, status, must_change_password
    `, [input.contractId, input.cedula, input.name, input.role, passwordHash, input.email || null, input.phone || null, input.area || null, input.position || null, input.location || null, input.status === "Activo" ? "active" : "inactive", input.mustChangePassword ?? true]);
    return userFromDb(rows[0]);
  },
  async updateUser(userId, updates) {
    const current = (await this.listUsers()).find((item) => item.id === userId);
    if (!current) throw new Error("Usuario no encontrado");
    const next = { ...current, ...updates };
    const { rows } = await query<DbUser>(`
      update app_users set contract_id=$2, document_id=$3, full_name=$4, role=$5, email=$6, phone=$7, area=$8, position=$9, location=$10, status=$11, must_change_password=$12
      where id=$1 returning id, contract_id, document_id, full_name, role, email, phone, area, position, location, status, must_change_password
    `, [userId, next.contractId, next.cedula, next.name, next.role, next.email || null, next.phone || null, next.area || null, next.position || null, next.location || null, next.status === "Activo" ? "active" : "inactive", next.mustChangePassword ?? false]);
    return userFromDb(rows[0]);
  },
  async listCategories() {
    const categories = await query<DbCategory>(`select id, name, description from ticket_categories where status='active' order by sort_order asc, name asc`);
    const requestTypes = await query<DbRequestType>(`select * from ticket_request_types where status='active' order by sort_order asc, name asc`);
    return categories.rows.map<TicketCategory>((category) => ({
      id: category.id,
      name: category.name,
      description: category.description || "",
      requestTypes: requestTypes.rows.filter((item) => item.category_id === category.id).map(requestTypeFromDb),
    }));
  },
  async listTickets() {
    const { rows } = await query<DbTicket>(`select * from tickets order by created_at desc`);
    const ids = rows.map((row) => row.id);
    const comments = await listComments(ids);
    const attachments = await listAttachments(ids);
    return Promise.all(rows.map((row) => ticketFromDb(row, comments.get(row.id) || [], attachments.get(row.id) || [])));
  },
  async createTicket(ticket: CreateTicketRecord) {
    const category = await query<DbRequestType>(`select * from ticket_request_types where id=$1`, [ticket.requestTypeId]);
    const requestType = category.rows[0];
    if (!requestType) throw new Error("Tipo de solicitud no encontrado");
    const { rows } = await query<DbTicket>(`
      insert into tickets(contract_id, requester_id, category_id, request_type_id, subject, description, status, priority, response_sla_minutes, resolution_sla_minutes, first_response_due_at, resolution_due_at)
      values ($1,$2,$3,$4,$5,$6,'nuevo',$7,$8,$9, now() + ($8 || ' minutes')::interval, now() + ($9 || ' minutes')::interval)
      returning *
    `, [ticket.contractId, ticket.requesterId, ticket.categoryId, ticket.requestTypeId, ticket.subject, ticket.description, requestType.default_priority, requestType.response_sla_minutes, requestType.resolution_sla_minutes]);
    const created = rows[0];
    await Promise.all(ticket.comments.map((comment) => query(`insert into ticket_comments(ticket_id, author_id, comment_type, body) values ($1,$2,'system',$3)`, [created.id, ticket.requesterId, comment.message])));
    await Promise.all(ticket.attachments.map((attachment) => query(`insert into ticket_attachments(ticket_id, uploaded_by_id, storage_path, original_filename, mime_type, original_size_bytes, stored_size_bytes, compression_status, retention_days) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [created.id, ticket.requesterId, attachment.storagePath || `tickets/${created.id}/${attachment.id}-${attachment.originalFilename}`, attachment.originalFilename, attachment.mimeType, attachment.originalSizeBytes, attachment.storedSizeBytes, attachment.compressionStatus, attachment.retentionDays])));
    return getTicket(created.id);
  },
  async updateTicket(ticketId, updates) {
    const current = await getTicket(ticketId);
    const nextStatus = updates.status ? statusToDb[updates.status] : statusToDb[current.status];
    const closedAt = updates.status === "Cerrado" ? new Date() : null;
    await query(`
      update tickets set status=$2, assigned_to_id=$3, solution=$4, internal_notes=$5, closed_at=coalesce($6, closed_at)
      where id=$1
    `, [ticketId, nextStatus, updates.assigneeId ?? current.assigneeId ?? null, updates.solution ?? current.solution ?? null, updates.diagnosis ?? current.diagnosis ?? null, closedAt]);

    if (updates.comments && updates.comments.length > current.comments.length) {
      for (const comment of updates.comments.slice(current.comments.length)) {
        const users = await query<{ id: string }>(`select id from app_users where full_name=$1 limit 1`, [comment.author]);
        const authorId = users.rows[0]?.id || current.requesterId;
        await query(`insert into ticket_comments(ticket_id, author_id, comment_type, body) values ($1,$2,'comment',$3)`, [ticketId, authorId, comment.message]);
      }
    }

    if (updates.attachments && updates.attachments.length > current.attachments.length) {
      for (const attachment of updates.attachments.slice(current.attachments.length)) {
        await query(`insert into ticket_attachments(ticket_id, uploaded_by_id, storage_path, original_filename, mime_type, original_size_bytes, stored_size_bytes, compression_status, retention_days) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [ticketId, current.requesterId, attachment.storagePath || `tickets/${ticketId}/${attachment.id}-${attachment.originalFilename}`, attachment.originalFilename, attachment.mimeType, attachment.originalSizeBytes, attachment.storedSizeBytes, attachment.compressionStatus, attachment.retentionDays]);
      }
    }

    return getTicket(ticketId);
  },
};

