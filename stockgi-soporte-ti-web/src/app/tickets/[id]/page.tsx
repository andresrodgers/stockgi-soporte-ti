"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader, priorityTone, statusTone, textareaClass } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import { formatFileSize, formatPriority, formatTicketStatus, t } from "@/i18n";
import { prepareTicketUpload } from "@/lib/client-files";
import type { Ticket } from "@/lib/types";

type PreviewState = {
  name: string;
  loading: boolean;
  url?: string;
  error?: string;
};

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const { tickets, users, contracts, categories, currentUser, addComment, uploadTicketAttachments, takeTicket: takeTicketAction, requestTicketInfo, closeTicket: closeTicketAction } = useAppState();
  const ticket = tickets.find((item) => item.id === params.id);
  const [comment, setComment] = useState("");
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function releasePreviewUrl() {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  }

  function closePreview() {
    releasePreviewUrl();
    setPreview(null);
  }

  async function openImagePreview(viewUrl: string, name: string) {
    releasePreviewUrl();
    setPreview({ name, loading: true });

    try {
      const response = await fetch(viewUrl, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        let message = "No fue posible cargar la vista previa";
        try {
          const body = await response.json();
          if (body && typeof body.error === "string" && body.error.trim()) {
            message = body.error;
          }
        } catch {
          // The response may be non-JSON. Keep the generic message.
        }
        setPreview({ name, loading: false, error: message });
        return;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      previewObjectUrlRef.current = objectUrl;
      setPreview({ name, loading: false, url: objectUrl });
    } catch {
      setPreview({ name, loading: false, error: "No fue posible cargar la vista previa" });
    }
  }

  async function onFilesSelected(list: FileList | null) {
    if (!list?.length) return;
    try {
      const prepared = await prepareTicketUpload(Array.from(list));
      setQueuedFiles((current) => [...current, ...prepared.files]);
      setAttachmentsError(null);
    } catch (error) {
      setAttachmentsError(error instanceof Error ? error.message : "No fue posible preparar los adjuntos");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeQueuedFile(index: number) {
    setQueuedFiles((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function runTicketAction(action: () => Promise<Ticket | void>) {
    if (submitting) return;
    setSubmitting(true);
    setAttachmentsError(null);
    try {
      const result = await action();
      const commentId = result?.comments?.at(-1)?.id ?? null;
      if (queuedFiles.length) {
        await uploadTicketAttachments(activeTicket.id, queuedFiles, commentId);
      }
      setComment("");
      setQueuedFiles([]);
    } catch (error) {
      setAttachmentsError(error instanceof Error ? error.message : "No fue posible completar la accion");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ticket) {
    return (
      <AppShell>
        <Card className="p-6">
          <h1 className="text-[20px] font-semibold">{t("tickets.notFound")}</h1>
          <Link href="/usuario" className="mt-4 inline-flex text-[var(--brand-primary)]">{t("common.back")}</Link>
        </Card>
      </AppShell>
    );
  }

  const activeTicket = ticket;
  const requester = users.find((user) => user.id === activeTicket.requesterId);
  const assignee = users.find((user) => user.id === activeTicket.assigneeId);
  const contract = contracts.find((item) => item.id === activeTicket.contractId);
  const category = categories.find((item) => item.id === activeTicket.categoryId);
  const requestType = category?.requestTypes.find((item) => item.id === activeTicket.requestTypeId);
  const isUser = currentUser.role === "usuario";
  const isTi = currentUser.role !== "usuario";
  const canTakeTicket = ["ti_operativo", "ti_administrativo"].includes(currentUser.role) && !activeTicket.assigneeId;
  const canActOnTicket = isTi && Boolean(activeTicket.assigneeId) && activeTicket.assigneeId === currentUser.id && activeTicket.status !== "Cerrado" || currentUser.role === "ti_administrativo" && activeTicket.status !== "Cerrado";
  const title = requestType?.name ?? activeTicket.subject;

  async function submitComment() {
    if (!comment.trim() && !queuedFiles.length) return;
    await runTicketAction(async () => {
      if (comment.trim()) {
        return addComment(activeTicket.id, comment.trim());
      }
    });
  }

  async function takeTicket() {
    if (!canTakeTicket) return;
    await takeTicketAction(activeTicket.id);
  }

  async function requestInfo() {
    if (!canActOnTicket || !comment.trim()) return;
    await runTicketAction(() => requestTicketInfo(activeTicket.id, comment.trim()));
  }

  async function closeTicket() {
    if (!canActOnTicket || !comment.trim()) return;
    await runTicketAction(() => closeTicketAction(activeTicket.id, comment.trim()));
  }

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader
          eyebrow={activeTicket.number}
          title={title}
          description={category?.name ?? t("tickets.typeFallback")}
          action={<Badge tone={statusTone(activeTicket.status)}>{formatTicketStatus(activeTicket.status)}</Badge>}
        />
        <div className="grid gap-[18px] xl:grid-cols-[1fr_360px]">
          <div className="grid gap-[18px]">
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold">{t("tickets.description")}</h2>
              <p className="mt-3 text-[14px] leading-6 text-[var(--brand-secondary)]">{activeTicket.description}</p>
              <div className="mt-5 grid gap-2">
                <h3 className="text-[13px] font-semibold">Adjuntos</h3>
                {activeTicket.attachments.length ? activeTicket.attachments.map((file) => {
                  const viewUrl = `/api/tickets/${activeTicket.id}/attachments/${file.id}`;
                  const downloadUrl = `${viewUrl}?download=1`;
                  const isImage = file.mimeType.startsWith("image/");
                  return (
                    <div key={file.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-[var(--app-muted)] px-3 py-2 text-[12px]">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--foreground)]">{file.name}</p>
                        <p className="text-[var(--brand-secondary)]">{formatFileSize(file.storedSizeBytes)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isImage ? (
                          <button type="button" onClick={() => openImagePreview(viewUrl, file.name)} className="h-8 rounded-[10px] bg-white px-3 text-[12px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]">Ver</button>
                        ) : (
                          <a href={viewUrl} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center rounded-[10px] bg-white px-3 text-[12px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]">Ver</a>
                        )}
                        <a href={downloadUrl} className="inline-flex h-8 items-center rounded-[10px] bg-[var(--brand-primary)] px-3 text-[12px] font-semibold text-white hover:bg-[var(--brand-primary-dark)]">Descargar</a>
                      </div>
                    </div>
                  );
                }) : <span className="text-[12px] text-[var(--brand-secondary)]">{t("common.noAttachments")}</span>}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold">{t("tickets.history")}</h2>
              <div className="mt-4 grid gap-3">
                {activeTicket.comments.map((item) => (
                  <div key={item.id} className="rounded-[13px] bg-[var(--app-muted)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold">{item.author}</p>
                      <p className="text-[12px] text-[var(--brand-secondary)]">{item.createdAt}</p>
                    </div>
                    <p className="mt-2 text-[13px] leading-5 text-[var(--brand-secondary)]">{item.message}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3">
                <textarea className={textareaClass} value={comment} onChange={(event) => setComment(event.target.value)} placeholder={isUser ? t("tickets.commentUserPlaceholder") : t("tickets.commentTiPlaceholder")} />
                <div className="grid gap-2 rounded-[13px] border border-[var(--app-border-soft)] bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold text-[var(--foreground)]">Adjuntar archivos a esta respuesta</p>
                    <label className="inline-flex h-9 cursor-pointer items-center rounded-[10px] bg-[var(--app-muted)] px-3 text-[12px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]">
                      Seleccionar archivos
                      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" multiple className="hidden" onChange={(event) => void onFilesSelected(event.target.files)} />
                    </label>
                  </div>
                  {queuedFiles.length ? (
                    <div className="grid gap-2">
                      {queuedFiles.map((file, index) => (
                        <div key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between gap-3 rounded-[10px] bg-[var(--app-muted)] px-3 py-2 text-[12px]">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[var(--foreground)]">{file.name}</p>
                            <p className="text-[var(--brand-secondary)]">{formatFileSize(file.size)}</p>
                          </div>
                          <button type="button" onClick={() => removeQueuedFile(index)} className="h-8 rounded-[10px] px-3 text-[12px] font-semibold text-[var(--brand-primary)] hover:bg-white">Quitar</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[12px] text-[var(--brand-secondary)]">Puedes anexar imagenes o PDF de hasta 10 MB por archivo.</p>
                  )}
                  {attachmentsError ? <p className="text-[12px] text-[#b63c2a]">{attachmentsError}</p> : null}
                </div>
                {isUser ? (
                  <button onClick={submitComment} disabled={submitting || (!comment.trim() && !queuedFiles.length)} className="h-11 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-45">{submitting ? t("common.saving") : t("tickets.addComment")}</button>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button onClick={requestInfo} disabled={submitting || !canActOnTicket || !comment.trim()} className="h-11 rounded-[14px] bg-[var(--app-muted)] px-4 text-[12px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)] disabled:cursor-not-allowed disabled:opacity-45">{submitting ? t("common.saving") : t("tickets.requestInfo")}</button>
                    <button onClick={closeTicket} disabled={submitting || !canActOnTicket || !comment.trim()} className="h-11 rounded-[14px] bg-[var(--brand-primary)] px-4 text-[12px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-45">{submitting ? t("common.saving") : t("tickets.closeTicket")}</button>
                  </div>
                )}
                {isTi ? <p className="text-[12px] text-[var(--brand-secondary)]">{t("tickets.tiCommentHelp")}</p> : null}
              </div>
            </Card>
          </div>
          <aside className="grid gap-[18px] content-start">
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold">{t("tickets.data")}</h2>
              <dl className="mt-4 grid gap-3 text-[13px]">
                <div><dt className="text-[var(--brand-secondary)]">{t("tickets.requester")}</dt><dd className="font-semibold">{requester?.name}</dd></div>
                <div><dt className="text-[var(--brand-secondary)]">{t("tickets.contract")}</dt><dd className="font-semibold">{contract?.name}</dd></div>
                <div><dt className="text-[var(--brand-secondary)]">{t("tickets.assignee")}</dt><dd className="font-semibold">{assignee?.name ?? t("common.notAssigned")}</dd></div>
                <div><dt className="text-[var(--brand-secondary)]">{t("tickets.priority")}</dt><dd><Badge tone={priorityTone(activeTicket.priority)}>{formatPriority(activeTicket.priority)}</Badge></dd></div>
                <div><dt className="text-[var(--brand-secondary)]">{t("tickets.slaDue")}</dt><dd className="font-semibold">{activeTicket.dueAt}</dd></div>
              </dl>
              {canTakeTicket ? <button onClick={takeTicket} className="mt-4 h-11 w-full rounded-[14px] bg-[var(--brand-primary)] text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)]">{t("tickets.take")}</button> : null}
              {activeTicket.assigneeId ? <p className="mt-4 rounded-[13px] bg-[var(--brand-primary-soft)] p-3 text-[12px] font-semibold text-[var(--brand-primary)]">{t("tickets.alreadyAssigned", { name: assignee?.name ?? "un tecnico" })}</p> : null}
            </Card>
          </aside>
        </div>
      </div>

      {preview ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4 py-6" role="dialog" aria-modal="true">
          <div className="max-h-full w-full max-w-4xl overflow-hidden rounded-[14px] bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--app-border-soft)] px-4 py-3">
              <p className="truncate text-[13px] font-semibold">{preview.name}</p>
              <button type="button" onClick={closePreview} className="h-8 rounded-[10px] px-3 text-[12px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]">Cerrar</button>
            </div>
            <div className="grid min-h-[240px] max-h-[78vh] place-items-center overflow-auto bg-[var(--app-muted)] p-4">
              {preview.loading ? <p className="text-[13px] text-[var(--brand-secondary)]">Cargando vista previa...</p> : null}
              {!preview.loading && preview.error ? <p className="max-w-lg text-center text-[13px] text-[var(--brand-secondary)]">{preview.error}</p> : null}
              {!preview.loading && !preview.error && preview.url ? <Image src={preview.url} alt={preview.name} width={1600} height={1200} unoptimized className="max-h-[72vh] max-w-full rounded-[8px] object-contain" /> : null}
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}


