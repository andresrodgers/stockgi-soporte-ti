import Link from "next/link";
import type { Priority, TicketStatus } from "@/lib/types";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[14px] bg-white card-shadow ${className}`}>{children}</section>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)]">{eyebrow}</p>
        <h1 className="mt-1 text-[20px] font-semibold text-[var(--foreground)]">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-[13px] text-[var(--brand-secondary)]">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" | "ghost" }) {
  const classes = {
    primary: "bg-[var(--brand-primary)] text-white btn-shadow hover:bg-[var(--brand-primary-dark)]",
    secondary: "bg-white text-[var(--brand-primary)] shadow-sm ring-1 ring-[var(--app-border)] hover:bg-[var(--brand-primary-soft)]",
    ghost: "text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]",
  };
  return <Link href={href} className={`inline-flex h-11 items-center justify-center rounded-[14px] px-5 text-[13px] font-semibold transition ${classes[variant]}`}>{children}</Link>;
}

export function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: "blue" | "amber" | "green" | "red" | "gray" }) {
  const tones = {
    blue: "bg-[#e2eff8] text-[#2468a2]",
    amber: "bg-[#fbecd1] text-[#996207]",
    green: "bg-[#dff2e6] text-[#08752d]",
    red: "bg-[#fae4df] text-[#b63c2a]",
    gray: "bg-[#e9efeb] text-[#69756e]",
  };
  return <span className={`inline-flex h-5 items-center rounded-full px-2 text-[12px] font-medium ${tones[tone]}`}>{children}</span>;
}

export function statusTone(status: TicketStatus): "blue" | "amber" | "green" | "red" | "gray" {
  if (status === "Nuevo" || status === "Asignado") return "blue";
  if (status === "En proceso" || status === "Esperando informacion") return "amber";
  if (status === "Resuelto") return "green";
  if (status === "Cerrado") return "gray";
  if (status === "Cancelado" || status === "Reabierto") return "red";
  return "gray";
}

export function priorityTone(priority: Priority): "blue" | "amber" | "green" | "red" | "gray" {
  if (priority === "Baja") return "gray";
  if (priority === "Media") return "blue";
  if (priority === "Alta") return "amber";
  return "red";
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-[12px] font-semibold text-[var(--foreground)]">
      {label}
      {children}
    </label>
  );
}

export const inputClass = "h-[42px] rounded-[13px] border border-transparent bg-[var(--app-input)] px-[14px] text-[13px] text-[var(--foreground)] outline-none transition focus:border-[var(--brand-primary)] focus:shadow-[0_0_0_4px_rgba(11,142,54,0.10)]";
export const selectClass = "select-field";
export const textareaClass = "min-h-[112px] resize-none rounded-[13px] border border-transparent bg-[var(--app-input)] px-4 py-3 text-[13px] text-[var(--foreground)] outline-none transition focus:border-[var(--brand-primary)] focus:shadow-[0_0_0_4px_rgba(11,142,54,0.10)]";
