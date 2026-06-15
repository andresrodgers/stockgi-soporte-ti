"use client";

import Link from "next/link";
import { useRef } from "react";
import type { PaginationMeta, Priority, TicketStatus } from "@/lib/types";

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
    blue: "text-[#2468a2]",
    amber: "text-[#996207]",
    green: "text-[#08752d]",
    red: "text-[#b63c2a]",
    gray: "text-[#69756e]",
  };
  const dotTones = {
    blue: "bg-[#69b0d3]",
    amber: "bg-[#e0a51a]",
    green: "bg-[#0b8e36]",
    red: "bg-[#d2553d]",
    gray: "bg-[#8a958f]",
  };

  return (
    <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${tones[tone]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotTones[tone]}`} aria-hidden="true" />
      <span>{children}</span>
    </span>
  );
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

function buildPageNumbers(currentPage: number, totalPages: number) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);
  return Array.from({ length: end - adjustedStart + 1 }, (_, index) => adjustedStart + index);
}

export function PaginationControls({
  pagination,
  onPageChange,
  className = "",
}: {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const scrollPositionRef = useRef(0);

  if (pagination.totalPages <= 1) return null;

  const pageNumbers = buildPageNumbers(pagination.page, pagination.totalPages);

  function handlePageChange(page: number) {
    if (page === pagination.page || page < 1 || page > pagination.totalPages) return;
    scrollPositionRef.current = window.scrollY;
    onPageChange(page);
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: scrollPositionRef.current, left: 0, behavior: "auto" });
      window.setTimeout(() => {
        window.scrollTo({ top: scrollPositionRef.current, left: 0, behavior: "auto" });
      }, 80);
    });
  }

  return (
    <div className={`flex flex-col gap-3 border-t border-[var(--app-border-soft)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <p className="text-[12px] text-[var(--brand-secondary)]">
        Página {pagination.page} de {pagination.totalPages} · {pagination.totalItems} registros
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page <= 1}
          className="h-9 rounded-[11px] bg-white px-3 text-[12px] font-semibold text-[var(--brand-primary)] shadow-sm ring-1 ring-[var(--app-border)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Anterior
        </button>
        {pageNumbers.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => handlePageChange(pageNumber)}
            className={`h-9 min-w-9 rounded-[11px] px-3 text-[12px] font-semibold ${pageNumber === pagination.page ? "bg-[var(--brand-primary)] text-white" : "bg-white text-[var(--brand-primary)] shadow-sm ring-1 ring-[var(--app-border)]"}`}
          >
            {pageNumber}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page >= pagination.totalPages}
          className="h-9 rounded-[11px] bg-white px-3 text-[12px] font-semibold text-[var(--brand-primary)] shadow-sm ring-1 ring-[var(--app-border)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

export const inputClass = "h-[42px] rounded-[13px] border border-transparent bg-[var(--app-input)] px-[14px] text-[13px] text-[var(--foreground)] outline-none transition focus:border-[var(--brand-primary)] focus:shadow-[0_0_0_4px_rgba(11,142,54,0.10)]";
export const selectClass = "select-field";
export const textareaClass = "min-h-[112px] resize-none rounded-[13px] border border-transparent bg-[var(--app-input)] px-4 py-3 text-[13px] text-[var(--foreground)] outline-none transition focus:border-[var(--brand-primary)] focus:shadow-[0_0_0_4px_rgba(11,142,54,0.10)]";
