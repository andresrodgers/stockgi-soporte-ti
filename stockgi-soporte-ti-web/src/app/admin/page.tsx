"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, TicketTable } from "@/components/tickets";
import { Card, PageHeader, PaginationControls } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import { t } from "@/i18n";
import type { PaginationMeta, Ticket, TicketStatus, User } from "@/lib/types";

type PeriodFilter = "year" | "month" | "week";

type StatusCount = {
  status: TicketStatus;
  count: number;
};

type OperationalStatusItem = {
  id: string;
  name: string;
  role: string;
  today: number;
  week: number;
  month: number;
  totalPeriod: number;
  statusCounts: StatusCount[];
};

type ContractSummary = {
  id: string;
  name: string;
  tickets: Ticket[];
};

const statusOrder: TicketStatus[] = ["Nuevo", "En proceso", "Esperando informacion", "Cerrado", "Cancelado", "Reabierto", "Asignado", "Resuelto"];
const dashboardPageSize = 10;
const summaryLimit = 5;
const periodOptions: Array<{ key: PeriodFilter; label: string }> = [
  { key: "year", label: "Año actual" },
  { key: "month", label: "Mes actual" },
  { key: "week", label: "Últimos 7 días" },
];

function parseTicketDate(value: string) {
  return new Date(value.replace(" ", "T"));
}

function startOfToday(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfWeek(now: Date) {
  const today = startOfToday(now);
  const day = today.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(today);
  start.setDate(today.getDate() - diff);
  return start;
}

function startForPeriod(period: PeriodFilter, now: Date) {
  if (period === "year") return new Date(now.getFullYear(), 0, 1);
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  const start = startOfToday(now);
  start.setDate(start.getDate() - 6);
  return start;
}

function isOperationalUser(user: User) {
  return user.role === "ti_operativo" || user.role === "ti_administrativo";
}

function countResolvedSince(tickets: Ticket[], userId: string, from: Date) {
  return tickets.filter((ticket) => ticket.status === "Cerrado" && ticket.assigneeId === userId && parseTicketDate(ticket.updatedAt) >= from).length;
}

function countByStatus(tickets: Ticket[]): StatusCount[] {
  return statusOrder
    .map((status) => ({ status, count: tickets.filter((ticket) => ticket.status === status).length }))
    .filter((item) => item.count > 0);
}

function buildPagination(page: number, pageSize: number, totalItems: number): PaginationMeta {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}

export default function AdminPage() {
  const { tickets, contracts, users } = useAppState();
  const [period, setPeriod] = useState<PeriodFilter>("year");
  const [generalTicketsPage, setGeneralTicketsPage] = useState(1);

  const now = new Date();
  const todayStart = startOfToday(now);
  const weekStart = startOfWeek(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodStart = startForPeriod(period, now);
  const periodTickets = tickets.filter((ticket) => parseTicketDate(ticket.createdAt) >= periodStart);

  const open = periodTickets.filter((ticket) => !["Cerrado", "Cancelado"].includes(ticket.status)).length;
  const closed = periodTickets.filter((ticket) => ticket.status === "Cerrado").length;
  const high = periodTickets.filter((ticket) => ["Alta", "Critica"].includes(ticket.priority)).length;
  const activeOperationalUsers = users.filter((user) => user.status === "Activo" && isOperationalUser(user));
  const statusSummary = countByStatus(periodTickets);
  const maxStatusCount = Math.max(1, ...statusSummary.map((item) => item.count));
  const maxUsers = Math.max(1, ...contracts.map((contract) => users.filter((user) => user.contractId === contract.id).length));
  const maxTickets = Math.max(1, ...contracts.map((contract) => periodTickets.filter((ticket) => ticket.contractId === contract.id).length));

  const contractSummaries: ContractSummary[] = contracts
    .map((contract) => ({
      id: contract.id,
      name: contract.name,
      tickets: periodTickets.filter((ticket) => ticket.contractId === contract.id),
    }))
    .sort((a, b) => b.tickets.length - a.tickets.length || a.name.localeCompare(b.name));
  const visibleContractSummaries = contractSummaries.slice(0, summaryLimit);
  const hiddenContractCount = Math.max(0, contractSummaries.length - visibleContractSummaries.length);

  const resolvedTickets = tickets.filter((ticket) => ticket.status === "Cerrado" && ticket.assigneeId);
  const operationalSummary: OperationalStatusItem[] = activeOperationalUsers
    .map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role === "ti_administrativo" ? "Admin / operativo" : "TI operativo",
      today: countResolvedSince(resolvedTickets, user.id, todayStart),
      week: countResolvedSince(resolvedTickets, user.id, weekStart),
      month: countResolvedSince(resolvedTickets, user.id, monthStart),
      totalPeriod: periodTickets.filter((ticket) => ticket.assigneeId === user.id).length,
      statusCounts: countByStatus(periodTickets.filter((ticket) => ticket.assigneeId === user.id)),
    }))
    .sort((a, b) => b.totalPeriod - a.totalPeriod || b.week - a.week || b.month - a.month || a.name.localeCompare(b.name));
  const visibleOperationalSummary = operationalSummary.slice(0, summaryLimit);
  const hiddenOperationalCount = Math.max(0, operationalSummary.length - visibleOperationalSummary.length);
  const maxResolvedWeek = Math.max(1, ...operationalSummary.map((item) => item.week));

  const generalTicketsPagination = buildPagination(Math.min(generalTicketsPage, Math.max(1, Math.ceil(tickets.length / dashboardPageSize))), dashboardPageSize, tickets.length);
  const generalTicketsStart = (generalTicketsPagination.page - 1) * dashboardPageSize;
  const visibleGeneralTickets = tickets.slice(generalTicketsStart, generalTicketsStart + dashboardPageSize);

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader eyebrow={t("admin.dashboardEyebrow")} title={t("admin.dashboardTitle")} description={t("admin.dashboardDescription")} />

        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Tickets del periodo" value={String(periodTickets.length)} detail="Según filtro activo" />
          <MetricCard label={t("admin.openTickets")} value={String(open)} detail={t("admin.activeNow")} />
          <MetricCard label={t("admin.closed")} value={String(closed)} detail={t("admin.closedHistory")} />
          <MetricCard label="Operativos activos" value={String(activeOperationalUsers.length)} detail="TI operativo y admin" />
        </div>

        <Card className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">Monitoreo de tickets</h2>
              <p className="text-[12px] text-[var(--brand-secondary)]">Totales por periodo, estado, operativo y contrato.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {periodOptions.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setPeriod(item.key)}
                  className={`h-9 rounded-[11px] px-3 text-[12px] font-semibold ${period === item.key ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--app-muted)] text-[var(--brand-primary)]"}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-[12px] bg-[var(--app-muted)] p-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-[var(--brand-secondary)]">Total tickets</p>
                  <p className="mt-1 text-[30px] font-semibold">{periodTickets.length}</p>
                </div>
                <div className="text-right text-[12px] text-[var(--brand-secondary)]">
                  <p>Prioridad alta/crítica</p>
                  <strong className="text-[15px] text-[var(--foreground)]">{high}</strong>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {statusSummary.map((item) => <StatusBar key={item.status} label={item.status} value={item.count} max={maxStatusCount} />)}
              </div>
            </div>

            <div className="grid min-w-0 gap-5">
              <SummaryTableSection title="Top contratos por tickets" hiddenCount={hiddenContractCount}>
                <table className="w-full min-w-[560px] border-collapse text-left text-[12px]">
                  <thead className="bg-[var(--app-muted)] text-[11px] uppercase tracking-[0.08em] text-[var(--brand-secondary)]">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Contrato</th>
                      <th className="w-20 px-3 py-2 text-right font-semibold">Total</th>
                      <th className="px-3 py-2 font-semibold">Estados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(11,142,54,0.1)]">
                    {visibleContractSummaries.map((contract) => <ContractBreakdownRow key={contract.id} label={contract.name} tickets={contract.tickets} />)}
                  </tbody>
                </table>
              </SummaryTableSection>

              <SummaryTableSection title="Top carga operativa" hiddenCount={hiddenOperationalCount}>
                <table className="w-full min-w-[460px] border-collapse text-left text-[12px]">
                  <thead className="bg-[var(--app-muted)] text-[11px] uppercase tracking-[0.08em] text-[var(--brand-secondary)]">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Operativo</th>
                                            <th className="w-20 px-3 py-2 text-right font-semibold">Total</th>
                      <th className="px-3 py-2 font-semibold">Estados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(11,142,54,0.1)]">
                    {visibleOperationalSummary.length ? visibleOperationalSummary.map((item) => <OperationalStatusRow key={item.id} item={item} />) : (
                      <tr>
                        <td colSpan={3} className="px-3 py-5 text-center text-[var(--brand-secondary)]">Sin operativos activos.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </SummaryTableSection>

              <div className="flex justify-end">
                <Link href="/admin/reportes" className="text-[12px] font-semibold text-[var(--brand-primary)] hover:underline">
                  Ver reportes completos
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-[18px] xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="p-4">
            <h2 className="text-[14px] font-semibold">Rendimiento</h2>
            <div className="mt-3 grid gap-2.5">
              {[
                [t("admin.response"), "2h 15m"],
                [t("admin.solution"), "1.4 días"],
                ["SLA", "91%"],
                [t("admin.users"), String(users.filter((user) => user.status === "Activo").length)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-[12px] bg-[var(--app-muted)] px-3 py-2.5">
                  <span className="truncate text-[12px] text-[var(--brand-secondary)]">{label}</span>
                  <strong className="shrink-0 text-[13px]">{value}</strong>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-[18px]">
            <Card className="p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold">Usuarios y tickets por contrato</h2>
                  <p className="text-[12px] text-[var(--brand-secondary)]">Tickets según el periodo activo.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-5 lg:grid-cols-2">
                <div>
                  <h3 className="text-[12px] font-semibold text-[var(--brand-secondary)]">Usuarios por contrato</h3>
                  <div className="mt-3 grid gap-3">
                    {contracts.map((contract) => {
                      const value = users.filter((user) => user.contractId === contract.id).length;
                      return <ContractBar key={contract.id} label={contract.name} value={value} max={maxUsers} tone="green" />;
                    })}
                  </div>
                </div>
                <div>
                  <h3 className="text-[12px] font-semibold text-[var(--brand-secondary)]">Tickets por contrato</h3>
                  <div className="mt-3 grid gap-3">
                    {contracts.map((contract) => {
                      const value = periodTickets.filter((ticket) => ticket.contractId === contract.id).length;
                      return <ContractBar key={contract.id} label={contract.name} value={value} max={maxTickets} tone="blue" />;
                    })}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-[14px] font-semibold">Operativos que resuelven tickets</h2>
                  <p className="text-[12px] text-[var(--brand-secondary)]">Cierres registrados hoy, esta semana y en el mes actual.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3">
                {operationalSummary.length ? operationalSummary.map((item) => (
                  <div key={item.id} className="rounded-[12px] bg-[var(--app-muted)] p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[var(--foreground)]">{item.name}</p>
                        <p className="text-[12px] text-[var(--brand-secondary)]">{item.role}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-right text-[12px]">
                        <div><p className="text-[var(--brand-secondary)]">Hoy</p><strong className="text-[13px]">{item.today}</strong></div>
                        <div><p className="text-[var(--brand-secondary)]">Semana</p><strong className="text-[13px]">{item.week}</strong></div>
                        <div><p className="text-[var(--brand-secondary)]">Mes</p><strong className="text-[13px]">{item.month}</strong></div>
                      </div>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/80">
                      <div className="h-2 rounded-full bg-[#69b0d3]" style={{ width: `${Math.max(6, Math.round((item.week / maxResolvedWeek) * 100))}%` }} />
                    </div>
                  </div>
                )) : <p className="text-[12px] text-[var(--brand-secondary)]">Aún no hay cierres asignados a usuarios operativos.</p>}
              </div>
            </Card>
          </div>
        </div>

        <Card className="min-w-0">
          <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">Gestión general de tickets</h2>
              <p className="text-[12px] text-[var(--brand-secondary)]">Listado completo visible para administración.</p>
            </div>
            <p className="text-[12px] text-[var(--brand-secondary)]">{tickets.length} tickets</p>
          </div>
          <TicketTable tickets={visibleGeneralTickets} />
          <PaginationControls pagination={generalTicketsPagination} onPageChange={setGeneralTicketsPage} />
        </Card>
      </div>
    </AppShell>
  );
}

function SummaryTableSection({ title, hiddenCount, children }: { title: string; hiddenCount: number; children: React.ReactNode }) {
  return (
    <section className="min-w-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-semibold">{title}</h3>
        {hiddenCount > 0 ? <span className="text-[11px] font-semibold text-[var(--brand-secondary)]">+{hiddenCount} más</span> : null}
      </div>
      <div className="mt-2 overflow-x-auto rounded-[10px] border border-[rgba(11,142,54,0.12)]">
        {children}
      </div>
    </section>
  );
}

function StatusBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.max(6, Math.round((value / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-[12px]">
        <span className="truncate text-[var(--brand-secondary)]">{label}</span>
        <strong className="shrink-0 text-[12px]">{value}</strong>
      </div>
      <div className="h-2 rounded-full bg-white/80">
        <div className="h-2 rounded-full bg-[var(--brand-primary)]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ContractBreakdownRow({ label, tickets }: { label: string; tickets: Ticket[] }) {
  const statusCounts = countByStatus(tickets);
  return (
    <tr className="bg-[var(--card-bg)] align-top">
      <td className="max-w-[260px] px-3 py-2.5 font-semibold text-[var(--foreground)]">
        <span className="block truncate">{label}</span>
      </td>
      <td className="px-3 py-2.5 text-right font-semibold text-[var(--foreground)]">{tickets.length}</td>
      <td className="px-3 py-2.5 text-[var(--brand-secondary)]">
        <StatusInlineList items={statusCounts} empty="Sin tickets" />
      </td>
    </tr>
  );
}

function OperationalStatusRow({ item }: { item: OperationalStatusItem }) {
  return (
    <tr className="bg-[var(--card-bg)] align-top">
      <td className="max-w-[220px] px-3 py-2.5 font-semibold text-[var(--foreground)]">
        <span className="block truncate">{item.name}</span>
      </td>
            <td className="px-3 py-2.5 text-right font-semibold text-[var(--foreground)]">{item.totalPeriod}</td>
      <td className="px-3 py-2.5 text-[var(--brand-secondary)]">
        <StatusInlineList items={item.statusCounts} empty="Sin tickets en periodo" />
      </td>
    </tr>
  );
}

function StatusInlineList({ items, empty }: { items: StatusCount[]; empty: string }) {
  if (!items.length) return <span>{empty}</span>;
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {items.map((item) => <span key={item.status}><strong className="text-[var(--foreground)]">{item.count}</strong> {item.status}</span>)}
    </div>
  );
}

function ContractBar({ label, value, max, tone }: { label: string; value: number; max: number; tone: "green" | "blue" }) {
  const width = Math.max(6, Math.round((value / max) * 100));
  const color = tone === "green" ? "bg-[var(--brand-primary)]" : "bg-[#69b0d3]";

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-[12px]">
        <span className="truncate text-[var(--brand-secondary)]">{label}</span>
        <strong className="shrink-0 text-[12px]">{value}</strong>
      </div>
      <div className="h-2 rounded-full bg-[var(--app-muted)]">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}