"use client";

import Link from "next/link";
import { useAppState } from "@/context/app-state";
import { formatPriority, formatTicketStatus, t } from "@/i18n";
import type { Ticket } from "@/lib/types";
import { Badge, priorityTone, statusTone } from "./ui";

export function TicketTable({ tickets, compact = false }: { tickets: Ticket[]; compact?: boolean }) {
  const { users, contracts, categories } = useAppState();
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="min-w-[860px] w-full border-separate border-spacing-0 text-left text-[13px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.08em] text-[var(--brand-secondary)]">
            <th className="px-5 py-3 font-bold">{t("tickets.ticket")}</th>
            <th className="px-5 py-3 font-bold">{t("tickets.request")}</th>
            {!compact ? <th className="px-5 py-3 font-bold">{t("tickets.contract")}</th> : null}
            <th className="px-5 py-3 font-bold">{t("tickets.status")}</th>
            <th className="px-5 py-3 font-bold">{t("tickets.priority")}</th>
            <th className="px-5 py-3 font-bold">{t("tickets.due")}</th>
            <th className="px-5 py-3 font-bold">{t("tickets.action")}</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const requester = users.find((user) => user.id === ticket.requesterId);
            const contract = contracts.find((item) => item.id === ticket.contractId);
            const category = categories.find((item) => item.id === ticket.categoryId);
            const requestType = category?.requestTypes.find((item) => item.id === ticket.requestTypeId);
            const title = requestType?.name ?? ticket.subject;
            return (
              <tr key={ticket.id} className="border-t border-[var(--app-border-soft)] hover:bg-[var(--app-muted)]">
                <td className="border-t border-[var(--app-border-soft)] px-5 py-3">
                  <Link href={`/tickets/${ticket.id}`} className="font-semibold text-[var(--brand-primary)] hover:underline">{ticket.number}</Link>
                  <p className="text-[12px] text-[var(--brand-secondary)]">{requester?.name ?? ticket.requesterName ?? "Solicitante no disponible"}</p>
                </td>
                <td className="border-t border-[var(--app-border-soft)] px-5 py-3">
                  <Link href={`/tickets/${ticket.id}`} className="font-semibold text-[var(--foreground)] hover:text-[var(--brand-primary)]">{title}</Link>
                  <p className="text-[12px] text-[var(--brand-secondary)]">{category?.name ?? t("tickets.typeFallback")}</p>
                </td>
                {!compact ? <td className="border-t border-[var(--app-border-soft)] px-5 py-3">{contract?.name}</td> : null}
                <td className="border-t border-[var(--app-border-soft)] px-5 py-3"><Badge tone={statusTone(ticket.status)}>{formatTicketStatus(ticket.status)}</Badge></td>
                <td className="border-t border-[var(--app-border-soft)] px-5 py-3"><Badge tone={priorityTone(ticket.priority)}>{formatPriority(ticket.priority)}</Badge></td>
                <td className="border-t border-[var(--app-border-soft)] px-5 py-3 text-[12px] text-[var(--brand-secondary)]">{ticket.dueAt}</td>
                <td className="border-t border-[var(--app-border-soft)] px-5 py-3">
                  <Link href={`/tickets/${ticket.id}`} className="inline-flex h-8 items-center rounded-[10px] bg-[var(--brand-primary)] px-3 text-[12px] font-semibold text-white hover:bg-[var(--brand-primary-dark)]">
                    {t("common.open")}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {tickets.length === 0 ? <p className="px-5 py-8 text-center text-[13px] text-[var(--brand-secondary)]">{t("tickets.empty")}</p> : null}
    </div>
  );
}

export function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-[14px] bg-white p-5 card-shadow">
      <p className="text-[12px] font-semibold text-[var(--brand-secondary)]">{label}</p>
      <p className="mt-2 text-[28px] font-semibold text-[var(--foreground)]">{value}</p>
      <p className="mt-1 text-[12px] text-[var(--brand-secondary)]">{detail}</p>
    </div>
  );
}