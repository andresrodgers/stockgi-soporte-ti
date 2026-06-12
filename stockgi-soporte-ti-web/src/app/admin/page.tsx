"use client";

import { AppShell } from "@/components/app-shell";
import { MetricCard, TicketTable } from "@/components/tickets";
import { Card, PageHeader } from "@/components/ui";
import { useAppState } from "@/context/app-state";

export default function AdminPage() {
  const { tickets, contracts, users } = useAppState();
  const open = tickets.filter((ticket) => !["Cerrado", "Cancelado"].includes(ticket.status)).length;
  const closed = tickets.filter((ticket) => ticket.status === "Cerrado").length;
  const high = tickets.filter((ticket) => ["Alta", "Critica"].includes(ticket.priority)).length;
  const maxUsers = Math.max(1, ...contracts.map((contract) => users.filter((user) => user.contractId === contract.id).length));
  const maxTickets = Math.max(1, ...contracts.map((contract) => tickets.filter((ticket) => ticket.contractId === contract.id).length));

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader eyebrow="Administracion TI" title="Dashboard" description="Vista ejecutiva de tickets, contratos y rendimiento del soporte." />
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Tickets abiertos" value={String(open)} detail="Activos actualmente" />
          <MetricCard label="Cerrados" value={String(closed)} detail="Historial demo" />
          <MetricCard label="Alta prioridad" value={String(high)} detail="Requieren seguimiento" />
          <MetricCard label="Contratos" value={String(contracts.length)} detail="Activos e internos" />
        </div>

        <Card className="min-w-0">
          <div className="px-5 py-4">
            <h2 className="text-[15px] font-semibold">Gestion general de tickets</h2>
            <p className="text-[12px] text-[var(--brand-secondary)]">Todos los contratos y estados.</p>
          </div>
          <TicketTable tickets={tickets} />
        </Card>

        <div className="grid gap-[18px] xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="p-4">
            <h2 className="text-[14px] font-semibold">Rendimiento demo</h2>
            <div className="mt-3 grid gap-2.5">
              {[
                ["Respuesta", "2h 15m"],
                ["Solucion", "1.4 dias"],
                ["SLA", "91%"],
                ["Usuarios", String(users.filter((user) => user.status === "Activo").length)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-[12px] bg-[var(--app-muted)] px-3 py-2.5">
                  <span className="truncate text-[12px] text-[var(--brand-secondary)]">{label}</span>
                  <strong className="shrink-0 text-[13px]">{value}</strong>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-[14px] font-semibold">Graficas por contrato</h2>
                <p className="text-[12px] text-[var(--brand-secondary)]">Usuarios y tickets asociados a cada contrato.</p>
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
                    const value = tickets.filter((ticket) => ticket.contractId === contract.id).length;
                    return <ContractBar key={contract.id} label={contract.name} value={value} max={maxTickets} tone="blue" />;
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
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
