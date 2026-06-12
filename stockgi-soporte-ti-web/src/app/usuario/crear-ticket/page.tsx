"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, Field, PageHeader, inputClass, selectClass, textareaClass } from "@/components/ui";
import { formatBytes, prepareTicketAttachments } from "@/lib/client-files";
import type { TicketAttachment } from "@/lib/types";
import { useAppState } from "@/context/app-state";

export default function CrearTicketPage() {
  const router = useRouter();
  const { categories, createTicket, currentUser, contracts } = useAppState();
  const [categoryId, setCategoryId] = useState(categories[0].id);
  const selectedCategory = categories.find((category) => category.id === categoryId) ?? categories[0];
  const [requestTypeId, setRequestTypeId] = useState(selectedCategory.requestTypes[0].id);
  const selectedType = selectedCategory.requestTypes.find((type) => type.id === requestTypeId) ?? selectedCategory.requestTypes[0];
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [fileError, setFileError] = useState("");
  const contract = contracts.find((item) => item.id === currentUser.contractId);


  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subject.trim() || !description.trim() || fileError) return;
    const ticket = await createTicket({ categoryId, requestTypeId, subject, description, attachments });
    router.push(`/tickets/${ticket.id}`);
  }

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader eyebrow="Nueva solicitud" title="Crear ticket" description="Describe el problema de forma clara. La prioridad se asigna automaticamente segun la categoria y el tipo." />
        <form onSubmit={submit} className="grid gap-[18px] lg:grid-cols-[1fr_320px]">
          <Card className="p-5">
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre">
                  <input className={inputClass} value={currentUser.name} readOnly />
                </Field>
                <Field label="Contrato">
                  <input className={inputClass} value={contract?.name ?? ""} readOnly />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Categoria">
                  <select className={selectClass} value={categoryId} onChange={(event) => {
                    const nextCategoryId = event.target.value;
                    const nextCategory = categories.find((category) => category.id === nextCategoryId) ?? categories[0];
                    setCategoryId(nextCategoryId);
                    setRequestTypeId(nextCategory.requestTypes[0].id);
                  }}>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </Field>
                <Field label="Tipo de solicitud">
                  <select className={selectClass} value={requestTypeId} onChange={(event) => setRequestTypeId(event.target.value)}>
                    {selectedCategory.requestTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Asunto">
                <input className={inputClass} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Ej. No puedo acceder al sistema" />
              </Field>
              <Field label="Descripcion">
                <textarea className={textareaClass} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Cuenta que ocurre, desde cuando y que mensaje aparece." />
              </Field>
              <Field label="Adjuntos">
                <input
                  className={`${inputClass} pt-2`}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf,.pdf"
                  multiple
                  onChange={async (event) => {
                    try {
                      setFileError("");
                      const files = Array.from(event.target.files ?? []);
                      setAttachments(await prepareTicketAttachments(files));
                    } catch (error) {
                      setAttachments([]);
                      setFileError(error instanceof Error ? error.message : "No fue posible procesar los adjuntos");
                    }
                  }}
                />
                {fileError ? <p className="mt-2 text-[12px] font-semibold text-[#b63c2a]">{fileError}</p> : null}
                {attachments.length ? (
                  <div className="mt-3 grid gap-2">
                    {attachments.map((file) => (
                      <div key={file.id} className="rounded-[12px] bg-[var(--app-muted)] px-3 py-2 text-[12px] text-[var(--brand-secondary)]">
                        <span className="font-semibold text-[var(--foreground)]">{file.name}</span> · {formatBytes(file.storedSizeBytes)} · {file.compressionStatus === "compressed" ? "comprimido" : "sin compresion"}
                      </div>
                    ))}
                  </div>
                ) : null}
              </Field>
              <button className="h-12 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[14px] font-semibold text-white btn-shadow transition hover:bg-[var(--brand-primary-dark)]">Enviar ticket</button>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)]">Asignacion automatica</p>
            <h2 className="mt-2 text-[18px] font-semibold">{selectedType.priority}</h2>
            <div className="mt-4 grid gap-3 text-[13px]">
              <p><span className="font-semibold">Primera respuesta:</span> {selectedType.firstResponseSla}</p>
              <p><span className="font-semibold">Solucion objetivo:</span> {selectedType.resolutionSla}</p>
              <p><span className="font-semibold">Adjunto:</span> {selectedType.attachmentRule}</p>
            </div>
            <p className="mt-5 rounded-[13px] bg-[var(--brand-primary-soft)] p-3 text-[12px] leading-5 text-[var(--brand-primary)]">
              TI puede corregir la categoria o prioridad si el caso real lo requiere.
            </p>
          </Card>
        </form>
      </div>
    </AppShell>
  );
}




