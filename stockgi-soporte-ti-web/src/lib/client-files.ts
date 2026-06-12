import type { TicketAttachment } from "@/lib/types";

const maxBytes = 10 * 1024 * 1024;
const imageTypes = ["image/png", "image/jpeg", "image/webp"];
const allowedTypes = [...imageTypes, "application/pdf"];

function formatExtension(mimeType: string) {
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  return "pdf";
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality = 0.78) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("No fue posible comprimir la imagen"));
    }, type, quality);
  });
}

async function compressImage(file: File) {
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();
  image.src = imageUrl;
  await image.decode();
  URL.revokeObjectURL(imageUrl);

  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No fue posible procesar la imagen");
  context.drawImage(image, 0, 0, width, height);

  const outputType = "image/webp";
  const blob = await canvasToBlob(canvas, outputType);
  return {
    blob,
    mimeType: outputType,
    name: `${file.name.replace(/\.[^.]+$/, "")}.${formatExtension(outputType)}`,
  };
}

export async function prepareTicketAttachments(files: File[]) {
  const attachments: TicketAttachment[] = [];

  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Archivo no permitido: ${file.name}`);
    }

    if (file.size > maxBytes) {
      throw new Error(`El archivo supera 10 MB: ${file.name}`);
    }

    if (imageTypes.includes(file.type)) {
      const compressed = await compressImage(file);
      attachments.push({
        id: `att-${crypto.randomUUID()}`,
        name: compressed.name,
        originalFilename: file.name,
        mimeType: compressed.mimeType,
        originalSizeBytes: file.size,
        storedSizeBytes: compressed.blob.size,
        compressionStatus: compressed.blob.size < file.size ? "compressed" : "not_applicable",
        retentionDays: 30,
      });
    } else {
      attachments.push({
        id: `att-${crypto.randomUUID()}`,
        name: file.name,
        originalFilename: file.name,
        mimeType: file.type,
        originalSizeBytes: file.size,
        storedSizeBytes: file.size,
        compressionStatus: "not_applicable",
        retentionDays: 30,
      });
    }
  }

  return attachments;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
