"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { MetricCard, TicketTable } from "@/components/tickets";
import { Card, PageHeader, PaginationControls } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import { apiFetch } from "@/lib/api-client";
import type { PaginationMeta, Ticket, TicketStatus } from "@/lib/types";

type TiBoardMode = "all" | "assigned" | "waiting";
type StatusFilter = "activos" | Extract<TicketStatus, "Nuevo" | "En proceso" | "Esperando informacion">;

const PAGE_SIZE = 10;
const initialPagination: PaginationMeta = { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 };

const copyByMode: Record<TiBoardMode, { title: string; description: string; tableTitle: string }> = {
  all: {
    title: "Bandeja de tickets",
    description: "Toma casos nuevos, actualiza estados y registra avances del soporte.",
    tableTitle: "Tickets operativos",
  },
  assigned: {
    title: "Mis asignaciones",
    description: "Casos que ya tomaste o que estan bajo tu responsabilidad.",
    tableTitle: "Tickets asignados a mi",
  },
  waiting: {
    title: "Tickets en espera",
    description: "Casos que requieren informacion del usuario para continuar.",
    tableTitle: "Tickets esperando informacion",
  },
};

export function TiBoard({ mode }: { mode: TiBoardMode }) {
  const { tickets, currentUser } = useAppState();
  const [page, setPage] = useState(1);
  const [tableTickets, setTableTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("activos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async (pageNumber: number, currentMode: TiBoardMode, currentStatusFilter: StatusFilter) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(pageNumber), pageSize: String(PAGE_SIZE), scope: currentMode });
      if (currentMode === "all" && currentStatusFilter !== "activos") params.set("status", currentStatusFilter);
      const payload = await apiFetch<{ tickets: Ticket[]; pagination: PaginationMeta }>(`/api/tickets?${params.toString()}`);
      setTableTickets(payload.tickets);
      setPagination(payload.pagination);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible consultar tickets");
      setTableTickets([]);
      setPagination({ ...initialPagination, page: pageNumber });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => {
      setPage(1);
      setStatusFilter("activos");
    }, 0);
    return () => window.clearTimeout(task);
  }, [mode]);

  useEffect(() => {
    const task = window.setTimeout(() => {
      void loadTickets(page, mode, statusFilter);
    }, 0);
    return () => window.clearTimeout(task);
  }, [loadTickets, mode, page, statusFilter]);

  const visibleMetrics = tickets.filter((ticket) => {
    if (mode === "assigned") return ticket.assigneeId === currentUser.id && ticket.status !== "Cerrado";
    if (mode === "waiting") return ticket.assigneeId === currentUser.id && ticket.status === "Esperando informacion";
    if (currentUser.role === "ti_administrativo") return ticket.status !== "Cerrado" && ticket.status !== "Cancelado";
    return (!ticket.assigneeId || ticket.assigneeId === currentUser.id) && ticket.status !== "Cerrado" && ticket.status !== "Cancelado";
  });

  const activeCount = visibleMetrics.length;
  const newCount = visibleMetrics.filter((ticket) => ticket.status === "Nuevo").length;
  const inProcessCount = visibleMetrics.filter((ticket) => ticket.status === "En proceso").length;
  const waitingCount = visibleMetrics.filter((ticket) => ticket.status === "Esperando informacion").length;
  const assigned = tickets.filter((ticket) => ticket.assigneeId === currentUser.id && ticket.status !== "Cerrado").length;
  const copy = copyByMode[mode];
  const statusCards: Array<{ key: StatusFilter; label: string; value: number; detail: string }> = [
    { key: "activos", label: "Activos", value: activeCount, detail: "Sin cerrados" },
    { key: "Nuevo", label: "Nuevos", value: newCount, detail: "Pendientes" },
    { key: "En proceso", label: "En proceso", value: inProcessCount, detail: "En atencion" },
    { key: "Esperando informacion", label: "En espera", value: waitingCount, detail: "Requieren respuesta" },
  ];

  function applyStatusFilter(nextFilter: StatusFilter) {
    setStatusFilter(nextFilter);
    setPage(1);
  }

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader eyebrow="Operacion TI" title={copy.title} description={copy.description} />
        {mode === "all" ? (
          <div className="grid gap-4 md:grid-cols-4">
            {statusCards.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => applyStatusFilter(item.key)}
                className={`rounded-[14px] bg-white p-5 text-left card-shadow transition ${statusFilter === item.key ? "ring-2 ring-[var(--brand-primary)]" : "hover:bg-[var(--app-muted)]"}`}
              >
                <p className="text-[12px] font-semibold text-[var(--brand-secondary)]">{item.label}</p>
                <p className="mt-2 text-[28px] font-semibold text-[var(--foreground)]">{item.value}</p>
                <p className="mt-1 text-[12px] text-[var(--brand-secondary)]">{item.detail}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Nuevos" value={String(newCount)} detail="Pendientes de tomar" />
            <MetricCard label="Mis asignados" value={String(assigned)} detail="Responsabilidad actual" />
            <MetricCard label="En espera" value={String(waitingCount)} detail="Requieren respuesta" />
          </div>
        )}
        <Card>
          <div className="px-5 py-4">
            <h2 className="text-[15px] font-semibold">{copy.tableTitle}</h2>
            <p className="text-[12px] text-[var(--brand-secondary)]">Usa el boton Abrir para ver el detalle y tomar tickets disponibles.</p>
          </div>
          {loading && tableTickets.length === 0 ? <p className="px-5 py-8 text-center text-[13px] text-[var(--brand-secondary)]">Cargando tickets...</p> : null}
          {error ? <p className="px-5 py-8 text-center text-[13px] font-semibold text-[#b63c2a]">{error}</p> : null}
          {!error && (!loading || tableTickets.length > 0) ? <TicketTable tickets={tableTickets} /> : null}
          {!error && (!loading || tableTickets.length > 0) ? <PaginationControls pagination={pagination} onPageChange={setPage} /> : null}
        </Card>
      </div>
    </AppShell>
  );
}