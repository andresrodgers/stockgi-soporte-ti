import { redirect } from "next/navigation";
import type { Role, User } from "@/lib/types";
import { getCurrentUser } from "@/server/auth";
import { getSession } from "@/server/session";

export const roleHome: Record<Role, string> = {
  usuario: "/usuario",
  ti_operativo: "/ti",
  ti_administrativo: "/admin",
};

type PageSessionOptions = {
  allowPasswordChangeRequired?: boolean;
};

function homeForUser(user: User) {
  return user.mustChangePassword ? "/cambiar-contrasena" : roleHome[user.role];
}

export async function getAuthenticatedPageUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  return getCurrentUser(session.userId);
}

export async function requirePageSession(allowedRoles?: Role[], options: PageSessionOptions = {}) {
  const user = await getAuthenticatedPageUser();

  if (!user) {
    redirect("/");
  }

  if (user.mustChangePassword && !options.allowPasswordChangeRequired) {
    redirect("/cambiar-contrasena");
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    redirect(homeForUser(user));
  }

  return user;
}

export async function redirectIfAuthenticated() {
  const user = await getAuthenticatedPageUser();

  if (user) {
    redirect(homeForUser(user));
  }
}