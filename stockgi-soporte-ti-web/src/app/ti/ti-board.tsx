"use client";

import { AppShell } from "@/components/app-shell";
import { MetricCard, TicketTable } from "@/components/tickets";
import { Card, PageHeader } from "@/components/ui";
import { useAppState } from "@/context/app-state";

type TiBoardMode = "all" | "assigned" | "waiting";

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
  const visible = tickets.filter((ticket) => {
    if (mode === "assigned") return ticket.assigneeId === currentUser.id;
    if (mode === "waiting") return ticket.status === "Esperando informacion";
    return ticket.status !== "Cerrado" && ticket.status !== "Cancelado";
  });
  const newCount = tickets.filter((ticket) => ticket.status === "Nuevo").length;
  const assigned = tickets.filter((ticket) => ticket.assigneeId === currentUser.id && ticket.status !== "Cerrado").length;
  const waiting = tickets.filter((ticket) => ticket.status === "Esperando informacion").length;
  const copy = copyByMode[mode];

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader eyebrow="Operacion TI" title={copy.title} description={copy.description} />
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Nuevos" value={String(newCount)} detail="Pendientes de tomar" />
          <MetricCard label="Mis asignados" value={String(assigned)} detail="Responsabilidad actual" />
          <MetricCard label="En espera" value={String(waiting)} detail="Requieren respuesta" />
        </div>
        <Card>
          <div className="px-5 py-4">
            <h2 className="text-[15px] font-semibold">{copy.tableTitle}</h2>
            <p className="text-[12px] text-[var(--brand-secondary)]">Usa el boton Abrir para ver el detalle y tomar tickets disponibles.</p>
          </div>
          <TicketTable tickets={visible} />
        </Card>
      </div>
    </AppShell>
  );
}
