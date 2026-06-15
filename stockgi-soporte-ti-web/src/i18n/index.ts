import { esCO } from "./dictionaries/es-CO";
import { defaultLocale } from "./config";
import type { Contract, Priority, Role, TicketAttachment, TicketStatus } from "@/lib/types";

const dictionaries = {
  [defaultLocale]: esCO,
};

type Dictionary = typeof esCO;
type Join<K, P> = K extends string | number ? P extends string | number ? `${K}.${P}` : never : never;
type Leaves<T> = T extends object
  ? { [K in keyof T]: T[K] extends string ? K : Join<K, Leaves<T[K]>> }[keyof T]
  : never;

export type TranslationKey = Leaves<Dictionary>;

function readPath(source: unknown, path: string): string | undefined {
  return path.split(".").reduce<unknown>((current, part) => {
    if (current && typeof current === "object" && part in current) return (current as Record<string, unknown>)[part];
    return undefined;
  }, source) as string | undefined;
}

export function t(key: TranslationKey, values?: Record<string, string | number>) {
  const template = readPath(dictionaries[defaultLocale], key) ?? key;
  if (!values) return template;
  return Object.entries(values).reduce((text, [name, value]) => text.replaceAll(`{${name}}`, String(value)), template);
}

export function formatRole(role: Role) {
  return esCO.roles[role];
}

export function formatTicketStatus(status: TicketStatus) {
  return esCO.ticketStatus[status];
}

export function formatPriority(priority: Priority) {
  return esCO.priority[priority];
}

export function formatContractStatus(status: Contract["status"]) {
  return esCO.contractStatus[status];
}

export function formatAttachmentRule(rule: "No obligatorio" | "Recomendado") {
  return esCO.attachmentRule[rule];
}

export function formatDateTime(value?: string) {
  if (!value) return "";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(defaultLocale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function formatCompressionStatus(status: TicketAttachment["compressionStatus"]) {
  return status === "compressed" ? esCO.createTicket.compressed : esCO.createTicket.uncompressed;
}