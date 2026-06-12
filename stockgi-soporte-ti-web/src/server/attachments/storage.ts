import { randomUUID } from "crypto";
import { mkdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";
import type { TicketAttachment } from "@/lib/types";
import { query } from "@/server/db";
import { validateAttachment } from "@/server/attachments";
import { getTicketForUser } from "@/server/tickets";

function storageRoot() {
  return path.resolve(process.env.UPLOAD_STORAGE_PATH || "storage/uploads");
}

function privatePath(relativePath: string) {
  const root = storageRoot();
  const absolutePath = path.resolve(root, relativePath);
  if (absolutePath !== root && !absolutePath.startsWith(root + path.sep)) {
    throw new Error("Ruta de adjunto invalida");
  }
  return absolutePath;
}

function safeName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "archivo";
}

export async function saveUploadedFile(ticketId: string, file: File): Promise<TicketAttachment> {
  const base = validateAttachment({ name: file.name, type: file.type, size: file.size });
  const id = randomUUID();
  const filename = `${id}-${safeName(file.name)}`;
  const relativePath = path.posix.join("tickets", ticketId, filename);
  const absolutePath = privatePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, bytes, { flag: "wx" });

  return {
    id,
    name: file.name,
    originalFilename: base.originalFilename,
    mimeType: base.mimeType,
    originalSizeBytes: base.originalSizeBytes,
    storedSizeBytes: bytes.length,
    compressionStatus: base.compressionStatus,
    retentionDays: base.retentionDays,
    storagePath: relativePath,
  };
}

export async function getAuthorizedAttachmentFile(ticketId: string, attachmentId: string, userId: string) {
  await getTicketForUser(ticketId, userId);
  const { rows } = await query<{ storage_path: string; original_filename: string; mime_type: string }>(`
    select storage_path, original_filename, mime_type
    from ticket_attachments
    where id=$1 and ticket_id=$2 and deleted_at is null
    limit 1
  `, [attachmentId, ticketId]);
  const row = rows[0];
  if (!row) throw new Error("Adjunto no encontrado");
  const absolutePath = privatePath(row.storage_path);
  await stat(absolutePath);
  return { bytes: await readFile(absolutePath), filename: row.original_filename, mimeType: row.mime_type };
}