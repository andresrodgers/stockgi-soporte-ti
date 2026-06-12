export type Role = "usuario" | "ti_operativo" | "ti_administrativo";

export type TicketStatus =
  | "Nuevo"
  | "Asignado"
  | "En proceso"
  | "Esperando informacion"
  | "Resuelto"
  | "Cerrado"
  | "Reabierto"
  | "Cancelado";

export type Priority = "Baja" | "Media" | "Alta" | "Critica";

export type Contract = {
  id: string;
  name: string;
  client: string;
  status: "Activo" | "Inactivo";
};

export type User = {
  id: string;
  contractId: string;
  cedula: string;
  name: string;
  role: Role;
  email?: string;
  phone?: string;
  area?: string;
  position?: string;
  location?: string;
  status: "Activo" | "Inactivo";
  mustChangePassword?: boolean;
};

export type TicketRequestType = {
  id: string;
  name: string;
  priority: Priority;
  firstResponseSla: string;
  resolutionSla: string;
  attachmentRule: "No obligatorio" | "Recomendado";
};

export type TicketCategory = {
  id: string;
  name: string;
  description: string;
  requestTypes: TicketRequestType[];
};

export type TicketComment = {
  id: string;
  author: string;
  role: Role;
  message: string;
  createdAt: string;
};

export type TicketAttachment = {
  id: string;
  name: string;
  originalFilename: string;
  mimeType: string;
  originalSizeBytes: number;
  storedSizeBytes: number;
  compressionStatus: "not_applicable" | "pending" | "compressed" | "failed";
  retentionDays: number;
  deleteAfterAt?: string;
  deletedAt?: string;
  storagePath?: string;
};

export type Ticket = {
  id: string;
  number: string;
  subject: string;
  description: string;
  categoryId: string;
  requestTypeId: string;
  priority: Priority;
  status: TicketStatus;
  requesterId: string;
  contractId: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
  dueAt: string;
  attachments: TicketAttachment[];
  diagnosis?: string;
  solution?: string;
  comments: TicketComment[];
};

export type BulkImportRowResult = {
  rowNumber: number;
  status: "valid" | "error" | "imported";
  cedula?: string;
  name?: string;
  contractName?: string;
  errorMessage?: string;
};

export type BulkImportResult = {
  totalRows: number;
  validRows: number;
  errorRows: number;
  createdUsers: number;
  rows: BulkImportRowResult[];
};

export type CreateUserInput = Omit<User, "id"> & {
  temporaryPassword?: string;
  mustChangePassword?: boolean;
};



