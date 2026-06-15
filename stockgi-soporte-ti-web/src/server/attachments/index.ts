import path from "path";
import type { TicketAttachment } from "@/lib/types";

const allowedMimeTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const allowedExtensionsByMime: Record<string, string[]> = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
};
const maxBytes = Number(process.env.MAX_ATTACHMENT_MB || 10) * 1024 * 1024;

type AttachmentCompressionStatus = NonNullable<TicketAttachment["compressionStatus"]>;

function hasValidSignature(mimeType: string, bytes: Buffer) {
  if (mimeType === "image/png") return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/webp") return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (mimeType === "application/pdf") return bytes.length >= 5 && bytes.subarray(0, 5).toString("ascii") === "%PDF-";
  return false;
}

export function validateAttachment(file: { name: string; type?: string; size?: number }) {
  const mimeType = file.type || "";
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error("Solo se permiten imagenes PNG/JPG/WebP o PDF");
  }

  const extension = path.extname(file.name || "").toLowerCase();
  if (!allowedExtensionsByMime[mimeType]?.includes(extension)) {
    throw new Error("La extension del archivo no coincide con el tipo permitido");
  }

  if (typeof file.size === "number" && file.size > maxBytes) {
    throw new Error("El archivo supera el peso maximo permitido");
  }

  const compressionStatus: AttachmentCompressionStatus = mimeType.startsWith("image/") ? "pending" : "not_applicable";

  return {
    originalFilename: file.name,
    mimeType,
    originalSizeBytes: file.size ?? 0,
    storedSizeBytes: file.size ?? 0,
    compressionStatus,
    retentionDays: Number(process.env.ATTACHMENT_RETENTION_DAYS || 30),
  };
}

export function validateAttachmentBuffer(file: { name: string; type?: string; size?: number }, bytes: Buffer) {
  const metadata = validateAttachment(file);
  if (!hasValidSignature(metadata.mimeType, bytes)) {
    throw new Error("El contenido del archivo no coincide con un formato permitido");
  }
  return metadata;
}