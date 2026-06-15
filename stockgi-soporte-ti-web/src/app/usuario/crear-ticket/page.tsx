"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, Field, PageHeader, inputClass, selectClass, textareaClass } from "@/components/ui";
import { formatAttachmentRule, formatCompressionStatus, formatFileSize, formatPriority, t } from "@/i18n";
import { prepareTicketUpload } from "@/lib/client-files";
import { csrfFetch } from "@/lib/api-client";
import type { TicketAttachment } from "@/lib/types";
import { useAppState } from "@/context/app-state";

export default function CrearTicketPage() {
  const router = useRouter();
  const fileInputId = useId();
  const { categories, createTicket, currentUser, contracts, refreshData } = useAppState();
  const [categoryId, setCategoryId] = useState("");
  const selectedCategoryId = categoryId || categories[0]?.id || "";
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? categories[0];
  const [requestTypeId, setRequestTypeId] = useState("");
  const selectedTypeId = requestTypeId || selectedCategory?.requestTypes[0]?.id || "";
  const selectedType = selectedCategory?.requestTypes.find((type) => type.id === selectedTypeId) ?? selectedCategory?.requestTypes[0];
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const contract = contracts.find((item) => item.id === currentUser.contractId);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!selectedCategory || !selectedType) {
      setFormError("Selecciona una categoria y un tipo de solicitud validos.");
      return;
    }

    if (!description.trim()) {
      setFormError("Describe la solicitud antes de enviarla.");
      return;
    }

    if (fileError) {
      setFormError(fileError);
      return;
    }

    try {
      setSubmitting(true);
      const ticket = await createTicket({ categoryId: selectedCategory.id, requestTypeId: selectedType.id, description: description.trim(), attachments: [] });

      if (uploadFiles.length) {
        const formData = new FormData();
        for (const file of uploadFiles) formData.append("files", file);
        const response = await csrfFetch(`/api/tickets/${ticket.id}/attachments`, { method: "POST", body: formData });
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        if (!response.ok) throw new Error(payload?.error || "No fue posible subir los adjuntos.");
      }

      await refreshData();
      router.push(`/tickets/${ticket.id}`);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "No fue posible crear el ticket.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader eyebrow={t("createTicket.eyebrow")} title={t("createTicket.title")} description={t("createTicket.description")} />
        <form onSubmit={submit} className="grid gap-[18px] lg:grid-cols-[1fr_320px]">
          <Card className="p-5">
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("createTicket.name")}>
                  <input className={inputClass} value={currentUser.name} readOnly />
                </Field>
                <Field label={t("tickets.contract")}>
                  <input className={inputClass} value={contract?.name ?? ""} readOnly />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("createTicket.category")}>
                  <select className={selectClass} value={selectedCategoryId} onChange={(event) => {
                    const nextCategoryId = event.target.value;
                    const nextCategory = categories.find((category) => category.id === nextCategoryId);
                    setCategoryId(nextCategoryId);
                    setRequestTypeId(nextCategory?.requestTypes[0]?.id || "");
                  }}>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </Field>
                <Field label={t("createTicket.requestType")}>
                  <select className={selectClass} value={selectedTypeId} onChange={(event) => setRequestTypeId(event.target.value)} disabled={!selectedCategory}>
                    {selectedCategory?.requestTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                  </select>
                </Field>
              </div>
              <Field label={t("createTicket.details")}>
                <textarea className={textareaClass} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t("createTicket.detailsPlaceholder")} />
              </Field>
              <Field label={t("createTicket.attachments")}>
                <div className="grid gap-3">
                  <input
                    id={fileInputId}
                    className="hidden"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf,.pdf"
                    multiple
                    onChange={async (event) => {
                      try {
                        setFileError("");
                        setFormError("");
                        const files = Array.from(event.target.files ?? []);
                        const prepared = await prepareTicketUpload(files);
                        setAttachments(prepared.attachments);
                        setUploadFiles(prepared.files);
                      } catch (error) {
                        setAttachments([]);
                        setUploadFiles([]);
                        setFileError(error instanceof Error ? error.message : "No fue posible procesar los adjuntos");
                      }
                    }}
                  />
                  <label htmlFor={fileInputId} className="inline-flex h-11 cursor-pointer items-center justify-center rounded-[14px] border border-[var(--app-border)] bg-white px-4 text-[13px] font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary-soft)]">
                    Anexar documento o imagen
                  </label>
                  <p className="text-[12px] text-[var(--brand-secondary)]">PNG, JPG, WebP o PDF. Maximo 10 MB por archivo.</p>
                </div>
                {fileError ? <p className="mt-2 text-[12px] font-semibold text-[#b63c2a]">{fileError}</p> : null}
                {attachments.length ? (
                  <div className="mt-3 grid gap-2">
                    {attachments.map((file) => (
                      <div key={file.id} className="rounded-[12px] bg-[var(--app-muted)] px-3 py-2 text-[12px] text-[var(--brand-secondary)]">
                        <span className="font-semibold text-[var(--foreground)]">{file.name}</span> - {formatFileSize(file.storedSizeBytes)} - {formatCompressionStatus(file.compressionStatus)}
                      </div>
                    ))}
                  </div>
                ) : null}
              </Field>
              {formError ? <p className="rounded-[12px] bg-[#fae4df] px-3 py-2 text-[12px] font-semibold text-[#b63c2a]">{formError}</p> : null}
              <button disabled={submitting} className="h-12 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[14px] font-semibold text-white btn-shadow transition hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60">{submitting ? t("common.saving") : t("createTicket.submit")}</button>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)]">{t("createTicket.automaticAssignment")}</p>
            <h2 className="mt-2 text-[18px] font-semibold">{selectedType ? formatPriority(selectedType.priority) : ""}</h2>
            <div className="mt-4 grid gap-3 text-[13px]">
              <p><span className="font-semibold">{t("createTicket.firstResponse")}</span> {selectedType?.firstResponseSla}</p>
              <p><span className="font-semibold">{t("createTicket.targetSolution")}</span> {selectedType?.resolutionSla}</p>
              <p><span className="font-semibold">{t("createTicket.attachment")}</span> {selectedType ? formatAttachmentRule(selectedType.attachmentRule) : ""}</p>
            </div>
            <p className="mt-5 rounded-[13px] bg-[var(--brand-primary-soft)] p-3 text-[12px] leading-5 text-[var(--brand-primary)]">
              {t("createTicket.note")}
            </p>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}