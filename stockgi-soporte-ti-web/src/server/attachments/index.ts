const allowedMimeTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
const maxBytes = Number(process.env.MAX_ATTACHMENT_MB || 10) * 1024 * 1024;

export function validateAttachment(file: { name: string; type?: string; size?: number }) {
  if (file.type && !allowedMimeTypes.includes(file.type)) {
    throw new Error("Solo se permiten imagenes PNG/JPG/WebP o PDF");
  }

  if (typeof file.size === "number" && file.size > maxBytes) {
    throw new Error("El archivo supera el peso maximo permitido");
  }

  return {
    originalFilename: file.name,
    mimeType: file.type || "application/octet-stream",
    originalSizeBytes: file.size ?? 0,
    storedSizeBytes: file.size ?? 0,
    compressionStatus: file.type?.startsWith("image/") ? "pending" : "not_applicable",
    retentionDays: Number(process.env.ATTACHMENT_RETENTION_DAYS || 30),
  };
}
