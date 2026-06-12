"use client";

import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader, priorityTone } from "@/components/ui";
import { useAppState } from "@/context/app-state";

export default function CatalogoPage() {
  const { categories } = useAppState();
  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader eyebrow="Catalogo fijo" title="Categorias de tickets" description="Catalogo funcional definido para mantener reportes, prioridad y SLA consistentes." />
        <div className="grid gap-4">
          {categories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <div className="px-5 py-4">
                <h2 className="text-[15px] font-semibold">{category.name}</h2>
                <p className="text-[12px] text-[var(--brand-secondary)]">{category.description}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[720px] w-full text-left text-[13px]">
                  <thead className="text-[11px] uppercase tracking-[0.08em] text-[var(--brand-secondary)]">
                    <tr><th className="px-5 py-3">Tipo</th><th className="px-5 py-3">Prioridad</th><th className="px-5 py-3">Primera respuesta</th><th className="px-5 py-3">Solucion</th><th className="px-5 py-3">Adjunto</th></tr>
                  </thead>
                  <tbody>
                    {category.requestTypes.map((type) => (
                      <tr key={type.id} className="hover:bg-[var(--app-muted)]">
                        <td className="border-t border-[var(--app-border-soft)] px-5 py-3 font-semibold">{type.name}</td>
                        <td className="border-t border-[var(--app-border-soft)] px-5 py-3"><Badge tone={priorityTone(type.priority)}>{type.priority}</Badge></td>
                        <td className="border-t border-[var(--app-border-soft)] px-5 py-3">{type.firstResponseSla}</td>
                        <td className="border-t border-[var(--app-border-soft)] px-5 py-3">{type.resolutionSla}</td>
                        <td className="border-t border-[var(--app-border-soft)] px-5 py-3">{type.attachmentRule}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
