"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TicketTable } from "@/components/tickets";
import { ButtonLink, Card, PageHeader, PaginationControls } from "@/components/ui";
import { apiFetch } from "@/lib/api-client";
import type { PaginationMeta, Ticket, TicketStatus } from "@/lib/types";

const PAGE_SIZE = 10;
const filterOptions: Array<"Todos" | TicketStatus> = ["Todos", "Nuevo", "En proceso", "Esperando informacion", "Cerrado"];
const initialPagination: PaginationMeta = { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 };

export default function MisTicketsPage() {
  const [filter, setFilter] = useState<"Todos" | TicketStatus>("Todos");
  const [page, setPage] = useState(1);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async (pageNumber: number, currentFilter: "Todos" | TicketStatus) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(pageNumber), pageSize: String(PAGE_SIZE) });
      if (currentFilter !== "Todos") params.set("status", currentFilter);
      const payload = await apiFetch<{ tickets: Ticket[]; pagination: PaginationMeta }>(`/api/tickets?${params.toString()}`);
      setTickets(payload.tickets);
      setPagination(payload.pagination);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible consultar tickets");
      setTickets([]);
      setPagination({ ...initialPagination, page: pageNumber });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => {
      void loadTickets(page, filter);
    }, 0);
    return () => window.clearTimeout(task);
  }, [filter, loadTickets, page]);

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader eyebrow="Historial" title="Mis tickets" description="Consulta el estado y seguimiento de tus solicitudes." action={<ButtonLink href="/usuario/crear-ticket">Crear ticket</ButtonLink>} />
        <Card>
          <div className="flex flex-wrap gap-2 px-5 py-4">
            {filterOptions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setFilter(item);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${filter === item ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--app-muted)] text-[var(--brand-primary)]"}`}
              >
                {item}
              </button>
            ))}
          </div>
          {loading && tickets.length === 0 ? <p className="px-5 py-8 text-center text-[13px] text-[var(--brand-secondary)]">Cargando tickets...</p> : null}
          {error ? <p className="px-5 py-8 text-center text-[13px] font-semibold text-[#b63c2a]">{error}</p> : null}
          {!error && (!loading || tickets.length > 0) ? <TicketTable tickets={tickets} compact /> : null}
          {!error && (!loading || tickets.length > 0) ? <PaginationControls pagination={pagination} onPageChange={setPage} /> : null}
        </Card>
      </div>
    </AppShell>
  );
}
