"use client";

import { AppShell } from "@/components/app-shell";
import { MetricCard, TicketTable } from "@/components/tickets";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { useAppState } from "@/context/app-state";

export default function UsuarioPage() {
  const { tickets, currentUser } = useAppState();
  const myTickets = tickets.filter((ticket) => ticket.requesterId === currentUser.id);
  const open = myTickets.filter((ticket) => !["Cerrado", "Cancelado"].includes(ticket.status)).length;
  const inProcess = myTickets.filter((ticket) => ticket.status === "En proceso").length;
  const closed = myTickets.filter((ticket) => ticket.status === "Cerrado").length;

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader
          eyebrow="Panel usuario"
          title={`Hola, ${currentUser.name}`}
          description="Crea solicitudes de soporte y consulta el seguimiento de tus tickets."
          action={<ButtonLink href="/usuario/crear-ticket">Crear ticket</ButtonLink>}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Abiertos" value={String(open)} detail="Tickets pendientes" />
          <MetricCard label="En proceso" value={String(inProcess)} detail="Gestionados por TI" />
          <MetricCard label="Cerrados" value={String(closed)} detail="Historial resuelto" />
        </div>
        <Card>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h2 className="text-[15px] font-semibold">Tickets recientes</h2>
              <p className="text-[12px] text-[var(--brand-secondary)]">Solo se muestran tus solicitudes.</p>
            </div>
            <ButtonLink href="/usuario/tickets" variant="secondary">Ver todos</ButtonLink>
          </div>
          <TicketTable tickets={myTickets.slice(0, 5)} compact />
        </Card>
      </div>
    </AppShell>
  );
}
