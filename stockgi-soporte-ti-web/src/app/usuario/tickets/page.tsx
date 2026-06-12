"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TicketTable } from "@/components/tickets";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { useAppState } from "@/context/app-state";

export default function MisTicketsPage() {
  const { tickets, currentUser } = useAppState();
  const [filter, setFilter] = useState("Todos");
  const myTickets = tickets.filter((ticket) => ticket.requesterId === currentUser.id);
  const visible = filter === "Todos" ? myTickets : myTickets.filter((ticket) => ticket.status === filter);

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader eyebrow="Historial" title="Mis tickets" description="Consulta el estado y seguimiento de tus solicitudes." action={<ButtonLink href="/usuario/crear-ticket">Crear ticket</ButtonLink>} />
        <Card>
          <div className="flex flex-wrap gap-2 px-5 py-4">
            {["Todos", "Nuevo", "En proceso", "Esperando informacion", "Cerrado"].map((item) => (
              <button key={item} onClick={() => setFilter(item)} className={`rounded-full px-3 py-1.5 text-[12px] font-semibold ${filter === item ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--app-muted)] text-[var(--brand-primary)]"}`}>{item}</button>
            ))}
          </div>
          <TicketTable tickets={visible} compact />
        </Card>
      </div>
    </AppShell>
  );
}
