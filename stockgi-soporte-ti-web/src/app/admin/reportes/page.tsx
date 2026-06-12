"use client";

import { AppShell } from "@/components/app-shell";
import { MetricCard } from "@/components/tickets";
import { Card, PageHeader } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import { getCategoryName } from "@/lib/demo-data";

export default function ReportesPage() {
  const { tickets, contracts, users } = useAppState();
  const categories = Array.from(new Set(tickets.map((ticket) => ticket.categoryId)));
  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader eyebrow="Analitica" title="Reportes" description="Indicadores demo por contrato, categoria, tecnico, estado y prioridad." />
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard label="Tickets creados" value={String(tickets.length)} detail="Rango actual demo" />
          <MetricCard label="Tiempo respuesta" value="2h 15m" detail="Promedio simulado" />
          <MetricCard label="Tiempo solucion" value="1.4 d" detail="Promedio simulado" />
          <MetricCard label="SLA" value="91%" detail="Cumplimiento demo" />
        </div>
        <div className="grid gap-[18px] lg:grid-cols-3">
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold">Por contrato</h2>
            <div className="mt-4 grid gap-3">
              {contracts.map((contract) => <Bar key={contract.id} label={contract.name} value={tickets.filter((ticket) => ticket.contractId === contract.id).length} max={tickets.length} />)}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold">Por categoria</h2>
            <div className="mt-4 grid gap-3">
              {categories.map((categoryId) => <Bar key={categoryId} label={getCategoryName(categoryId)} value={tickets.filter((ticket) => ticket.categoryId === categoryId).length} max={tickets.length} />)}
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-[15px] font-semibold">Por tecnico</h2>
            <div className="mt-4 grid gap-3">
              {users.filter((user) => user.role === "ti_operativo").map((user) => <Bar key={user.id} label={user.name} value={tickets.filter((ticket) => ticket.assigneeId === user.id).length} max={tickets.length} />)}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max ? Math.max(8, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-[12px]">
        <span className="truncate text-[var(--brand-secondary)]">{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="h-2 rounded-full bg-[var(--app-muted)]">
        <div className="h-2 rounded-full bg-[var(--brand-primary)]" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
