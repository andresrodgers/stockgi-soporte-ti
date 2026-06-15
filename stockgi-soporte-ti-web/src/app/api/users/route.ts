import { getCurrentUser } from "@/server/auth";
import { fail, ok, publicError } from "@/server/http";
import { getSession, withSessionContext } from "@/server/session";
import { listTicketsForUser } from "@/server/tickets";
import { listUsers } from "@/server/users";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return fail("No autenticado", 401);
    return withSessionContext(session, async () => {
      const currentUser = await getCurrentUser(session.userId);
      if (!currentUser) return fail("No autenticado", 401);
      const users = await listUsers();
      if (currentUser.role === "ti_administrativo") return ok({ users });

      const tickets = await listTicketsForUser(session.userId);
      const visibleUserIds = new Set<string>([currentUser.id]);
      for (const ticket of tickets) {
        visibleUserIds.add(ticket.requesterId);
        if (ticket.assigneeId) visibleUserIds.add(ticket.assigneeId);
      }
      return ok({ users: users.filter((user) => visibleUserIds.has(user.id)) });
    });
  } catch (error) {
    return publicError(error, "No fue posible consultar usuarios", 400);
  }
}