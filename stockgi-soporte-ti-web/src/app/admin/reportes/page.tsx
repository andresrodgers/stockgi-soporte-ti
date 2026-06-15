"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/tickets";
import { Badge, Card, PaginationControls, PageHeader, selectClass } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import { formatDateTime, formatPriority, formatRole, formatTicketStatus, t } from "@/i18n";
import type { PaginationMeta, Priority, Ticket, TicketStatus } from "@/lib/types";

type PeriodFilter = "year" | "month" | "week";

type TrendPoint = {
  label: string;
  value: number;
};

const pageSize = 10;
const topLimit = 5;

function parseTicketDate(value: string) {
  return new Date(value.replace(" ", "T"));
}

function startOfToday(now: Date) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startForPeriod(period: PeriodFilter, now: Date) {
  if (period === "year") return new Date(now.getFullYear(), 0, 1);
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  const start = startOfToday(now);
  start.setDate(start.getDate() - 6);
  return start;
}

function sameDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

function buildTrendPoints(tickets: Ticket[], period: PeriodFilter, now: Date): TrendPoint[] {
  if (period === "week") {
    const start = startOfToday(now);
    start.setDate(start.getDate() - 6);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return {
        label: new Intl.DateTimeFormat("es-CO", { weekday: "short" }).format(date),
        value: tickets.filter((ticket) => sameDay(parseTicketDate(ticket.createdAt), date)).length,
      };
    });
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const step = Math.max(1, Math.ceil(daysInMonth / 6));
    return Array.from({ length: 6 }, (_, index) => {
      const from = new Date(start);
      from.setDate(1 + index * step);
      const to = new Date(start);
      to.setDate(Math.min(daysInMonth, 1 + ((index + 1) * step) - 1));
      return {
        label: `${from.getDate()}-${to.getDate()}`,
        value: tickets.filter((ticket) => {
          const createdAt = parseTicketDate(ticket.createdAt);
          return createdAt >= from && createdAt <= new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
        }).length,
      };
    });
  }

  return Array.from({ length: 12 }, (_, index) => {
    const from = new Date(now.getFullYear(), index, 1);
    const to = new Date(now.getFullYear(), index + 1, 0, 23, 59, 59, 999);
    return {
      label: new Intl.DateTimeFormat("es-CO", { month: "short" }).format(from),
      value: tickets.filter((ticket) => {
        const createdAt = parseTicketDate(ticket.createdAt);
        return createdAt >= from && createdAt <= to;
      }).length,
    };
  });
}

function buildPagination(page: number, totalItems: number): PaginationMeta {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
  };
}

function uniqueStatuses(): TicketStatus[] {
  return ["Nuevo", "Asignado", "En proceso", "Esperando informacion", "Resuelto", "Cerrado", "Reabierto", "Cancelado"];
}

function uniquePriorities(): Priority[] {
  return ["Critica", "Alta", "Media", "Baja"];
}

function statusTone(status: TicketStatus): "blue" | "amber" | "green" | "red" | "gray" {
  if (status === "Nuevo" || status === "Asignado") return "blue";
  if (status === "En proceso" || status === "Esperando informacion") return "amber";
  if (status === "Resuelto") return "green";
  if (status === "Cerrado") return "gray";
  if (status === "Cancelado" || status === "Reabierto") return "red";
  return "gray";
}

function priorityTone(priority: Priority): "blue" | "amber" | "green" | "red" | "gray" {
  if (priority === "Baja") return "gray";
  if (priority === "Media") return "blue";
  if (priority === "Alta") return "amber";
  return "red";
}

export default function ReportesPage() {
  const { tickets, contracts, users, categories } = useAppState();
  const [period, setPeriod] = useState<PeriodFilter>("month");
  const [contractId, setContractId] = useState("all");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [responsibleRole, setResponsibleRole] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const now = new Date();
  const periodStart = startForPeriod(period, now);
  const searchTerm = search.trim().toLowerCase();

  const visibleTickets = tickets.filter((ticket) => {
    if (parseTicketDate(ticket.createdAt) < periodStart) return false;
    if (contractId !== "all" && ticket.contractId !== contractId) return false;
    if (status !== "all" && ticket.status !== status) return false;
    if (priority !== "all" && ticket.priority !== priority) return false;

    if (responsibleRole !== "all") {
      const assignee = users.find((user) => user.id === ticket.assigneeId);
      if (!assignee || assignee.role !== responsibleRole) return false;
    }

    if (!searchTerm) return true;

    const requester = users.find((user) => user.id === ticket.requesterId);
    const assignee = users.find((user) => user.id === ticket.assigneeId);
    const contract = contracts.find((item) => item.id === ticket.contractId);
    const category = categories.find((item) => item.id === ticket.categoryId);
    const requestType = category?.requestTypes.find((item) => item.id === ticket.requestTypeId);
    const haystack = [
      ticket.number,
      ticket.subject,
      ticket.description,
      requester?.name,
      requester?.cedula,
      assignee?.name,
      contract?.name,
      category?.name,
      requestType?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchTerm);
  });

  const totals = {
    total: visibleTickets.length,
    open: visibleTickets.filter((ticket) => !["Cerrado", "Cancelado"].includes(ticket.status)).length,
    closed: visibleTickets.filter((ticket) => ticket.status === "Cerrado").length,
    waiting: visibleTickets.filter((ticket) => ticket.status === "Esperando informacion").length,
    slaBreached: visibleTickets.filter((ticket) => parseTicketDate(ticket.dueAt) < now && !["Cerrado", "Cancelado"].includes(ticket.status)).length,
  };

  const trendPoints = buildTrendPoints(visibleTickets, period, now);
  const trendMax = Math.max(1, ...trendPoints.map((item) => item.value));
  const statusCounts = uniqueStatuses().map((item) => ({ status: item, count: visibleTickets.filter((ticket) => ticket.status === item).length })).filter((item) => item.count > 0);
  const priorityCounts = uniquePriorities().map((item) => ({ priority: item, count: visibleTickets.filter((ticket) => ticket.priority === item).length })).filter((item) => item.count > 0);

  const contractRows = contracts
    .map((contract) => ({
      label: contract.name,
      value: visibleTickets.filter((ticket) => ticket.contractId === contract.id).length,
      detail: `${visibleTickets.filter((ticket) => ticket.contractId === contract.id && ticket.status === "Cerrado").length} cerrados · ${visibleTickets.filter((ticket) => ticket.contractId === contract.id && ticket.status === "Esperando informacion").length} en espera`,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, topLimit);

  const technicianRows = users
    .filter((user) => user.role === "ti_operativo" || user.role === "ti_administrativo")
    .map((user) => ({
      label: user.name,
      value: visibleTickets.filter((ticket) => ticket.assigneeId === user.id).length,
      detail: `${visibleTickets.filter((ticket) => ticket.assigneeId === user.id && ticket.status === "Cerrado").length} cerrados · ${visibleTickets.filter((ticket) => ticket.assigneeId === user.id && ticket.status === "Esperando informacion").length} en espera · ${visibleTickets.filter((ticket) => ticket.assigneeId === user.id && ticket.status === "En proceso").length} en proceso`,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, topLimit);

  const categoryRows = categories
    .map((category) => ({
      label: category.name,
      value: visibleTickets.filter((ticket) => ticket.categoryId === category.id).length,
      detail: "Tickets del rango filtrado",
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label))
    .slice(0, topLimit);

  const summaryMetrics = [
    { label: "Tickets filtrados", value: String(totals.total), detail: "Rango y filtros activos" },
    { label: "Abiertos", value: String(totals.open), detail: "Sin cerrar o cancelar" },
    { label: "Cerrados", value: String(totals.closed), detail: "Resueltos y cerrados" },
    { label: "En espera", value: String(totals.waiting), detail: "Solicitan información" },
    { label: "SLA vencidos", value: String(totals.slaBreached), detail: "Fuera de fecha objetivo" },
    { label: "Resp. promedio", value: visibleTickets.length ? "2h 15m" : "0h 00m", detail: visibleTickets.length ? "Cierre promedio 1.4 días" : "Sin datos" },
  ];

  const pagination = buildPagination(page, visibleTickets.length);
  const currentPage = Math.min(pagination.page, pagination.totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pagedTickets = visibleTickets.slice(pageStart, pageStart + pageSize);

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader
          eyebrow={t("reports.eyebrow")}
          title={t("reports.title")}
          description={t("reports.description")}
        />

        <Card className="p-4">
          <div className="grid gap-4 xl:grid-cols-[1fr] xl:items-end">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <FilterSelect label="Periodo" value={period} onChange={(value) => { setPage(1); setPeriod(value as PeriodFilter); }} options={[{ value: "year", label: "Año actual" }, { value: "month", label: "Mes actual" }, { value: "week", label: "Últimos 7 días" }]} />
              <FilterSelect label="Contrato" value={contractId} onChange={(value) => { setPage(1); setContractId(value); }} options={[{ value: "all", label: "Todos los contratos" }, ...contracts.map((contract) => ({ value: contract.id, label: contract.name }))]} />
              <FilterSelect label="Estado" value={status} onChange={(value) => { setPage(1); setStatus(value); }} options={[{ value: "all", label: "Todos los estados" }, ...uniqueStatuses().map((item) => ({ value: item, label: formatTicketStatus(item) }))]} />
              <FilterSelect label="Prioridad" value={priority} onChange={(value) => { setPage(1); setPriority(value); }} options={[{ value: "all", label: "Todas las prioridades" }, ...uniquePriorities().map((item) => ({ value: item, label: formatPriority(item) }))]} />
              <FilterSelect label="Responsable" value={responsibleRole} onChange={(value) => { setPage(1); setResponsibleRole(value); }} options={[{ value: "all", label: "Todos los roles" }, { value: "ti_operativo", label: formatRole("ti_operativo") }, { value: "ti_administrativo", label: formatRole("ti_administrativo") }]} />
              <label className="grid gap-1.5 text-[12px] font-semibold text-[var(--foreground)]">
                Buscar
                <input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Ticket, cédula, contrato, texto..." className="h-[42px] rounded-[13px] border border-transparent bg-[var(--app-input)] px-[14px] text-[13px] text-[var(--foreground)] outline-none transition focus:border-[var(--brand-primary)] focus:shadow-[0_0_0_4px_rgba(11,142,54,0.10)]" />
              </label>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {summaryMetrics.map((metric) => <MetricCard key={metric.label} label={metric.label} value={metric.value} detail={metric.detail} />)}
        </div>

        <div className="grid gap-[18px] xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold">Tendencia del periodo</h2>
                <p className="text-[12px] text-[var(--brand-secondary)]">Tickets creados por segmento del rango activo.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {trendPoints.map((point) => <TrendCard key={point.label} label={point.label} value={point.value} max={trendMax} />)}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-[14px] font-semibold">Distribución</h2>
            <div className="mt-4 grid gap-4">
              <StatStack title="Estados" items={statusCounts.map((item) => ({ label: formatTicketStatus(item.status), value: item.count }))} />
              <StatStack title="Prioridades" items={priorityCounts.map((item) => ({ label: formatPriority(item.priority), value: item.count }))} />
            </div>
          </Card>
        </div>

        <div className="grid gap-[18px] lg:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold">Contratos</h2>
                <p className="text-[12px] text-[var(--brand-secondary)]">Top contratos por volumen del filtro activo.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {contractRows.length ? contractRows.map((row) => <CompactRankRow key={row.label} label={row.label} value={row.value} detail={row.detail} max={Math.max(1, ...contractRows.map((item) => item.value))} />) : <EmptyHint text="Sin datos para el filtro actual." />}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold">Operativos</h2>
                <p className="text-[12px] text-[var(--brand-secondary)]">Carga y cierres por responsable.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {technicianRows.length ? technicianRows.map((row) => <CompactRankRow key={row.label} label={row.label} value={row.value} detail={row.detail} max={Math.max(1, ...technicianRows.map((item) => item.value))} />) : <EmptyHint text="Sin responsables en el periodo." />}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-semibold">Categorías</h2>
                <p className="text-[12px] text-[var(--brand-secondary)]">Top categorías del periodo filtrado.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {categoryRows.length ? categoryRows.map((row) => <CompactRankRow key={row.label} label={row.label} value={row.value} detail={row.detail} max={Math.max(1, ...categoryRows.map((item) => item.value))} />) : <EmptyHint text="Sin datos para el filtro actual." />}
            </div>
          </Card>
        </div>

        <Card className="min-w-0">
          <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">Detalle paginado</h2>
              <p className="text-[12px] text-[var(--brand-secondary)]">Lista filtrada para auditoría y seguimiento.</p>
            </div>
            <p className="text-[12px] text-[var(--brand-secondary)]">{visibleTickets.length} registros</p>
          </div>
          <TicketDetailTable tickets={pagedTickets} />
          <PaginationControls pagination={pagination} onPageChange={setPage} />
        </Card>
      </div>
    </AppShell>
  );
}

function TicketDetailTable({ tickets }: { tickets: Ticket[] }) {
  const { contracts, users, categories } = useAppState();
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="min-w-[1080px] w-full border-separate border-spacing-0 text-left text-[13px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.08em] text-[var(--brand-secondary)]">
            <th className="px-5 py-3 font-bold">Ticket</th>
            <th className="px-5 py-3 font-bold">Contrato</th>
            <th className="px-5 py-3 font-bold">Solicitante</th>
            <th className="px-5 py-3 font-bold">Estado</th>
            <th className="px-5 py-3 font-bold">Prioridad</th>
            <th className="px-5 py-3 font-bold">Responsable</th>
            <th className="px-5 py-3 font-bold">Creado</th>
            <th className="px-5 py-3 font-bold">Vence SLA</th>
            <th className="px-5 py-3 font-bold">Categoría</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const requester = users.find((user) => user.id === ticket.requesterId);
            const assignee = users.find((user) => user.id === ticket.assigneeId);
            const contract = contracts.find((item) => item.id === ticket.contractId);
            const category = categories.find((item) => item.id === ticket.categoryId);
            return (
              <tr key={ticket.id} className="border-t border-[var(--app-border-soft)] hover:bg-[var(--app-muted)]">
                <td className="border-t border-[var(--app-border-soft)] px-5 py-3">
                  <div className="font-semibold text-[var(--brand-primary)]">{ticket.number}</div>
                  <p className="text-[12px] text-[var(--brand-secondary)]">{ticket.subject}</p>
                </td>
                <td className="border-t border-[var(--app-border-soft)] px-5 py-3">{contract?.name ?? "Sin contrato"}</td>
                <td className="border-t border-[var(--app-border-soft)] px-5 py-3">
                  <div className="font-semibold text-[var(--foreground)]">{requester?.name ?? "Desconocido"}</div>
                  <p className="text-[12px] text-[var(--brand-secondary)]">{requester?.cedula ?? ""}</p>
                </td>
                <td className="border-t border-[var(--app-border-soft)] px-5 py-3">
                  <Badge tone={statusTone(ticket.status)}>{formatTicketStatus(ticket.status)}</Badge>
                </td>
                <td className="border-t border-[var(--app-border-soft)] px-5 py-3">
                  <Badge tone={priorityTone(ticket.priority)}>{formatPriority(ticket.priority)}</Badge>
                </td>
                <td className="border-t border-[var(--app-border-soft)] px-5 py-3">{assignee?.name ?? "Sin asignar"}</td>
                <td className="border-t border-[var(--app-border-soft)] px-5 py-3 text-[12px] text-[var(--brand-secondary)]">{formatDateTime(ticket.createdAt)}</td>
                <td className="border-t border-[var(--app-border-soft)] px-5 py-3 text-[12px] text-[var(--brand-secondary)]">{formatDateTime(ticket.dueAt)}</td>
                <td className="border-t border-[var(--app-border-soft)] px-5 py-3 text-[12px] text-[var(--brand-secondary)]">{category?.name ?? "Sin categoría"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {tickets.length === 0 ? <p className="px-5 py-8 text-center text-[13px] text-[var(--brand-secondary)]">No hay información para mostrar.</p> : null}
    </div>
  );
}

function TrendCard({ label, value, max }: { label: string; value: number; max: number }) {
  const width = Math.max(8, Math.round((value / max) * 100));
  return (
    <div className="rounded-[12px] bg-[var(--app-muted)] p-3">
      <div className="flex items-center justify-between gap-2 text-[12px]">
        <span className="truncate font-semibold text-[var(--foreground)]">{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white/80">
        <div className="h-2 rounded-full bg-[var(--brand-primary)]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function StatStack({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <div>
      <h3 className="text-[12px] font-semibold text-[var(--brand-secondary)]">{title}</h3>
      <div className="mt-3 grid gap-2.5">
        {items.length ? items.map((item) => <TrendCard key={item.label} label={item.label} value={item.value} max={max} />) : <EmptyHint text="Sin datos para el filtro actual." />}
      </div>
    </div>
  );
}

function CompactRankRow({ label, value, detail, max }: { label: string; value: number; detail: string; max: number }) {
  const width = Math.max(8, Math.round((value / max) * 100));
  return (
    <div className="rounded-[12px] bg-[var(--app-muted)] p-3">
      <div className="flex items-center justify-between gap-3 text-[12px]">
        <span className="min-w-0 truncate font-semibold text-[var(--foreground)]">{label}</span>
        <strong className="shrink-0">{value}</strong>
      </div>
      <p className="mt-1 text-[11px] text-[var(--brand-secondary)]">{detail}</p>
      <div className="mt-2 h-2 rounded-full bg-white/80">
        <div className="h-2 rounded-full bg-[#69b0d3]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="rounded-[12px] bg-[var(--app-muted)] px-3 py-4 text-[12px] text-[var(--brand-secondary)]">{text}</p>;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label className="grid gap-1.5 text-[12px] font-semibold text-[var(--foreground)]">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}