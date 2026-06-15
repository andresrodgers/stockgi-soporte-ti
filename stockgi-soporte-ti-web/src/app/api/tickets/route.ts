import type { TicketStatus } from "@/lib/types";
import { validateCsrfToken } from "@/server/csrf";
import { fail, ok, parsePositiveInt, publicError, requireString } from "@/server/http";
import { runIdempotent } from "@/server/idempotency";
import { getSession, withSessionContext } from "@/server/session";
import { createTicketForUser, listTicketsForUser, listTicketsPageForUser } from "@/server/tickets";

const allowedStatuses = new Set<TicketStatus>(["Nuevo", "Asignado", "En proceso", "Esperando informacion", "Resuelto", "Cerrado", "Reabierto", "Cancelado"]);
const allowedScopes = new Set(["all", "assigned", "waiting"]);

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      const url = new URL(request.url);
      if (url.searchParams.get("all") === "true") {
        return ok({ tickets: await listTicketsForUser(session.userId) });
      }

      const page = parsePositiveInt(url.searchParams.get("page"), 1, { min: 1, max: 1000 });
      const pageSize = parsePositiveInt(url.searchParams.get("pageSize"), 10, { min: 1, max: 50 });
      const statusParam = url.searchParams.get("status");
      const scopeParam = url.searchParams.get("scope");
      const status = statusParam && allowedStatuses.has(statusParam as TicketStatus) ? statusParam as TicketStatus : undefined;
      const scope = scopeParam && allowedScopes.has(scopeParam) ? scopeParam as "all" | "assigned" | "waiting" : undefined;
      const result = await listTicketsPageForUser(session.userId, { page, pageSize, status, scope });
      return ok({ tickets: result.items, pagination: result.pagination });
    });
  } catch (error) {
    return publicError(error, "No fue posible consultar tickets", 400);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      await validateCsrfToken(request, session);
      return runIdempotent(session, request, "tickets.create", async () => {
        const body = await request.json();
        const ticket = await createTicketForUser(session.userId, {
          categoryId: requireString(body.categoryId, "categoryId"),
          requestTypeId: requireString(body.requestTypeId, "requestTypeId"),
          description: requireString(body.description, "description"),
          attachments: Array.isArray(body.attachments) ? body.attachments : [],
        });
        return { data: { ticket }, status: 201 };
      });
    });
  } catch (error) {
    return publicError(error, "No fue posible crear el ticket", 400);
  }
}