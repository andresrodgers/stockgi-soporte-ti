import type { Contract, CreateUserInput, CreatedUserResult, PaginatedResult, Role, Ticket, TicketAttachment, TicketCategory, TicketComment, TicketStatus, User } from "@/lib/types";

export type CreateTicketRecord = Ticket;
export type CreateUserRecord = CreateUserInput;
export type CreateContractRecord = Omit<Contract, "id">;

export type UserPageOptions = {
  page: number;
  pageSize: number;
};

export type TicketPageOptions = {
  page: number;
  pageSize: number;
  role: Role;
  userId: string;
  status?: TicketStatus;
  scope?: "all" | "assigned" | "waiting";
};

export type UpdateTicketRecord = Partial<Ticket> & {
  actorUserId?: string;
  commentType?: "comment" | "request_info" | "resolution" | "system";
  attachmentCommentId?: string | null;
  closedById?: string | null;
  comments?: TicketComment[];
  attachments?: TicketAttachment[];
};

export interface DataRepository {
  readonly source: "postgres";
  listContracts(): Promise<Contract[]>;
  createContract(input: CreateContractRecord): Promise<Contract>;
  updateContract(contractId: string, updates: Partial<Contract>): Promise<Contract>;
  listUsers(): Promise<User[]>;
  listUsersPage(options: UserPageOptions): Promise<PaginatedResult<User>>;
  createUser(input: CreateUserRecord): Promise<CreatedUserResult>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  listCategories(): Promise<TicketCategory[]>;
  listTickets(): Promise<Ticket[]>;
  listTicketsPage(options: TicketPageOptions): Promise<PaginatedResult<Ticket>>;
  createTicket(ticket: CreateTicketRecord): Promise<Ticket>;
  updateTicket(ticketId: string, updates: UpdateTicketRecord): Promise<Ticket>;
}

