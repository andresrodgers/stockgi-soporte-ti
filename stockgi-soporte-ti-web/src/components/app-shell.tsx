"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAppState } from "@/context/app-state";
import { formatRole, t } from "@/i18n";
import type { Role } from "@/lib/types";
import { csrfFetch, resetCsrfToken } from "@/lib/api-client";

const roleHome: Record<Role, string> = {
  usuario: "/usuario",
  ti_operativo: "/ti",
  ti_administrativo: "/admin",
};

type NavItem = { href: string; label: string; icon: IconName };
type NavSection = { title?: string; items: NavItem[] };
type IconName = "home" | "plus" | "tickets" | "inbox" | "assigned" | "wait" | "dashboard" | "users" | "upload" | "contracts" | "catalog" | "reports";

const usuarioNav: NavItem[] = [
  { href: "/usuario", label: t("nav.items.home"), icon: "home" },
  { href: "/usuario/crear-ticket", label: t("nav.items.createTicket"), icon: "plus" },
  { href: "/usuario/tickets", label: t("nav.items.myTickets"), icon: "tickets" },
];

const tiOperationNav: NavItem[] = [
  { href: "/ti", label: t("nav.items.inbox"), icon: "inbox" },
  { href: "/ti/asignados", label: t("nav.items.assigned"), icon: "assigned" },
  { href: "/ti/espera", label: t("nav.items.waiting"), icon: "wait" },
];

const adminManagementNav: NavItem[] = [
  { href: "/admin", label: t("nav.items.dashboard"), icon: "dashboard" },
  { href: "/admin/usuarios", label: t("nav.items.users"), icon: "users" },
  { href: "/admin/carga-masiva", label: t("nav.items.bulkUpload"), icon: "upload" },
  { href: "/admin/contratos", label: t("nav.items.contracts"), icon: "contracts" },
  { href: "/admin/catalogo", label: t("nav.items.catalog"), icon: "catalog" },
  { href: "/admin/reportes", label: t("nav.items.reports"), icon: "reports" },
];

function navSectionsForRole(role: Role): NavSection[] {
  if (role === "ti_administrativo") {
    return [
      { title: t("nav.groups.operation"), items: tiOperationNav },
      { title: t("nav.groups.administration"), items: adminManagementNav },
    ];
  }

  if (role === "ti_operativo") {
    return [{ title: t("nav.sections.ti_operativo"), items: tiOperationNav }];
  }

  return [{ title: t("nav.sections.usuario"), items: usuarioNav }];
}

function routeFallbackRole(pathname: string): Role | null {
  if (pathname.startsWith("/admin")) return "ti_administrativo";
  if (pathname.startsWith("/ti")) return "ti_operativo";
  if (pathname.startsWith("/usuario")) return "usuario";
  return null;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/ti" || href === "/usuario" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavIcon({ name, active }: { name: IconName; active: boolean }) {
  const color = active ? "#69b0d3" : "currentColor";
  const common = { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[19px] shrink-0">
      {name === "home" ? <><path {...common} d="M3 10.8 12 3l9 7.8" /><path {...common} d="M5.5 10.5V21h13V10.5" /><path {...common} d="M9.5 21v-6h5v6" /></> : null}
      {name === "plus" ? <><path {...common} d="M12 5v14" /><path {...common} d="M5 12h14" /><rect {...common} x="4" y="4" width="16" height="16" rx="3" /></> : null}
      {name === "tickets" ? <><path {...common} d="M7 3h7l4 4v14H7z" /><path {...common} d="M14 3v5h5" /><path {...common} d="M9.5 12h5" /><path {...common} d="M9.5 16h5" /></> : null}
      {name === "inbox" ? <><rect {...common} x="3.5" y="5" width="17" height="14" rx="2" /><path {...common} d="M8 5v5l2-1.4L12 10V5" /><path {...common} d="M7 14h10" /></> : null}
      {name === "assigned" ? <><rect {...common} x="5" y="3" width="14" height="18" rx="2" /><path {...common} d="M9 7h6" /><path {...common} d="m9 12 2 2 4-5" /><path {...common} d="M9 17h5" /></> : null}
      {name === "wait" ? <><circle {...common} cx="12" cy="12" r="8" /><path {...common} d="M12 7v5l3 2" /></> : null}
      {name === "dashboard" ? <><rect {...common} x="4" y="4" width="7" height="7" rx="1.5" /><rect {...common} x="13" y="4" width="7" height="7" rx="1.5" /><rect {...common} x="4" y="13" width="7" height="7" rx="1.5" /><rect {...common} x="13" y="13" width="7" height="7" rx="1.5" /></> : null}
      {name === "users" ? <><circle {...common} cx="9" cy="8" r="3" /><path {...common} d="M3.5 19c.8-3.2 3-5 5.5-5s4.7 1.8 5.5 5" /><circle {...common} cx="17" cy="9" r="2.3" /><path {...common} d="M15.5 14.5c2.2.3 3.8 1.8 4.5 4.5" /></> : null}
      {name === "upload" ? <><path {...common} d="M12 15V4" /><path {...common} d="m8 8 4-4 4 4" /><path {...common} d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></> : null}
      {name === "contracts" ? <><path {...common} d="M4 21V7l8-4 8 4v14" /><path {...common} d="M8 21v-8h8v8" /><path {...common} d="M8 9h.01" /><path {...common} d="M12 9h.01" /><path {...common} d="M16 9h.01" /></> : null}
      {name === "catalog" ? <><path {...common} d="M5 4h11l3 3v13H5z" /><path {...common} d="M16 4v4h4" /><path {...common} d="M8 12h8" /><path {...common} d="M8 16h8" /></> : null}
      {name === "reports" ? <><path {...common} d="M5 20V10" /><path {...common} d="M12 20V4" /><path {...common} d="M19 20v-7" /><path {...common} d="M3 20h18" /></> : null}
    </svg>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await csrfFetch("/api/auth/logout", { method: "POST" });
    resetCsrfToken();
    router.push("/");
    router.refresh();
  }

  const { currentUser, contracts } = useAppState();
  const effectiveRole = currentUser.id ? currentUser.role : routeFallbackRole(pathname) ?? currentUser.role;
  const contract = contracts.find((item) => item.id === currentUser.contractId);
  const navSections = navSectionsForRole(effectiveRole);
  const flatNav = navSections.flatMap((section) => section.items);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] lg:pl-[252px]">
      <aside className="sidebar-gradient fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col text-white lg:flex">
        <div className="border-b border-white/10 px-[30px] py-6">
          <Image src="/stockgi-logo.png" alt="StockGI" width={158} height={54} className="h-auto w-[158px]" priority />
        </div>
        <nav className="sidebar-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
          {navSections.map((section) => (
            <div key={section.title ?? section.items[0]?.href}>
              {section.title ? <p className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-[0.17em] text-white/38">{section.title}</p> : null}
              <div className="grid gap-1">
                {section.items.map((item) => {
                  const active = isActivePath(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex h-[39px] items-center gap-2.5 rounded-[13px] px-3 text-[15px] font-medium transition-all duration-200 ${active ? "bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" : "text-white/64 hover:bg-white/8 hover:text-white/88"}`}
                    >
                      <NavIcon name={item.icon} active={active} />
                      <span className={active ? "font-semibold" : "font-medium"}>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-[13px] font-semibold">{currentUser.name}</p>
          <p className="text-[12px] text-white/62">{formatRole(effectiveRole)}</p>
          <button onClick={logout} className="mt-2 text-[12px] font-semibold text-white/78 hover:text-white">{t("common.logout")}</button>
        </div>
      </aside>

      <header className="topbar-glass sticky top-0 z-20 border-b border-[var(--app-border-soft)] px-4 py-3 lg:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link href={roleHome[effectiveRole]} className="flex items-center gap-3 lg:hidden">
            <Image src="/stockgi-logo.png" alt="StockGI" width={104} height={36} className="h-auto w-[104px]" priority />
          </Link>
          <div className="hidden lg:block">
            <p className="text-[12px] font-semibold text-[var(--brand-secondary)]">{contract?.name ?? "StockGI"}</p>
            <p className="text-[15px] font-semibold">{t("app.name")}</p>
          </div>
          <div className="flex items-center gap-2">
            
            <button onClick={logout} className="rounded-[10px] px-3 py-2 text-[12px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)] lg:hidden">{t("common.exit")}</button>
          </div>
        </div>
        <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {flatNav.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-semibold ${active ? "bg-[var(--brand-primary)] text-white" : "bg-white text-[var(--brand-primary)]"}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="p-4 lg:p-[26px]">{children}</main>
    </div>
  );
}