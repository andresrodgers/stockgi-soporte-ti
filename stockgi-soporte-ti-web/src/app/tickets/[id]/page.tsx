"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Card, PageHeader, priorityTone, statusTone, textareaClass } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import { getCategoryName, getRequestType } from "@/lib/demo-data";
import { formatBytes } from "@/lib/client-files";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const { tickets, users, contracts, currentUser, addComment, takeTicket: takeTicketAction, requestTicketInfo, closeTicket: closeTicketAction } = useAppState();
  const ticket = tickets.find((item) => item.id === params.id);
  const [comment, setComment] = useState("");

  if (!ticket) {
    return (
      <AppShell>
        <Card className="p-6">
          <h1 className="text-[20px] font-semibold">Ticket no encontrado</h1>
          <Link href="/usuario" className="mt-4 inline-flex text-[var(--brand-primary)]">Volver</Link>
        </Card>
      </AppShell>
    );
  }

  const activeTicket = ticket;
  const requester = users.find((user) => user.id === activeTicket.requesterId);
  const assignee = users.find((user) => user.id === activeTicket.assigneeId);
  const contract = contracts.find((item) => item.id === activeTicket.contractId);
  const requestType = getRequestType(activeTicket.categoryId, activeTicket.requestTypeId);
  const isUser = currentUser.role === "usuario";
  const isTi = currentUser.role !== "usuario";
  const canTakeTicket = currentUser.role === "ti_operativo" && !activeTicket.assigneeId;
  const canActOnTicket = isTi && Boolean(activeTicket.assigneeId) && activeTicket.status !== "Cerrado";

  async function submitComment() {
    if (!comment.trim()) return;
    await addComment(activeTicket.id, comment);
    setComment("");
  }

  async function takeTicket() {
    if (!canTakeTicket) return;
    await takeTicketAction(activeTicket.id);
  }

  async function requestInfo() {
    if (!canActOnTicket || !comment.trim()) return;
    await requestTicketInfo(activeTicket.id, comment.trim());
    setComment("");
  }

  async function closeTicket() {
    if (!canActOnTicket || !comment.trim()) return;
    await closeTicketAction(activeTicket.id, comment.trim());
    setComment("");
  }

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader
          eyebrow={activeTicket.number}
          title={activeTicket.subject}
          description={`${getCategoryName(activeTicket.categoryId)} / ${requestType?.name ?? "Sin tipo"}`}
          action={<Badge tone={statusTone(activeTicket.status)}>{activeTicket.status}</Badge>}
        />
        <div className="grid gap-[18px] xl:grid-cols-[1fr_360px]">
          <div className="grid gap-[18px]">
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold">Descripcion</h2>
              <p className="mt-3 text-[14px] leading-6 text-[var(--brand-secondary)]">{activeTicket.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {activeTicket.attachments.length ? activeTicket.attachments.map((file) => <span key={file.id} className="rounded-full bg-[var(--app-muted)] px-3 py-1 text-[12px] text-[var(--brand-secondary)]">{file.name} · {formatBytes(file.storedSizeBytes)}</span>) : <span className="text-[12px] text-[var(--brand-secondary)]">Sin adjuntos</span>}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold">Historial y comentarios</h2>
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
                <textarea className={textareaClass} value={comment} onChange={(event) => setComment(event.target.value)} placeholder={isUser ? "Responder a TI..." : "Escribe el comentario, solicitud de informacion o solucion..."} />
                {isUser ? (
                  <button onClick={submitComment} className="h-11 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)]">Agregar comentario</button>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button onClick={requestInfo} disabled={!canActOnTicket || !comment.trim()} className="h-11 rounded-[14px] bg-[var(--app-muted)] px-4 text-[12px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)] disabled:cursor-not-allowed disabled:opacity-45">Solicitar informacion</button>
                    <button onClick={closeTicket} disabled={!canActOnTicket || !comment.trim()} className="h-11 rounded-[14px] bg-[var(--brand-primary)] px-4 text-[12px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-45">Cerrar ticket</button>
                  </div>
                )}
                {isTi ? <p className="text-[12px] text-[var(--brand-secondary)]">Para solicitar informacion o cerrar el ticket debes escribir primero el mensaje correspondiente.</p> : null}
              </div>
            </Card>
          </div>
          <aside className="grid gap-[18px] content-start">
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold">Datos del ticket</h2>
              <dl className="mt-4 grid gap-3 text-[13px]">
                <div><dt className="text-[var(--brand-secondary)]">Solicitante</dt><dd className="font-semibold">{requester?.name}</dd></div>
                <div><dt className="text-[var(--brand-secondary)]">Contrato</dt><dd className="font-semibold">{contract?.name}</dd></div>
                <div><dt className="text-[var(--brand-secondary)]">Responsable</dt><dd className="font-semibold">{assignee?.name ?? "Sin asignar"}</dd></div>
                <div><dt className="text-[var(--brand-secondary)]">Prioridad</dt><dd><Badge tone={priorityTone(activeTicket.priority)}>{activeTicket.priority}</Badge></dd></div>
                <div><dt className="text-[var(--brand-secondary)]">Vencimiento SLA</dt><dd className="font-semibold">{activeTicket.dueAt}</dd></div>
              </dl>
              {canTakeTicket ? <button onClick={takeTicket} className="mt-4 h-11 w-full rounded-[14px] bg-[var(--brand-primary)] text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)]">Tomar ticket</button> : null}
              {activeTicket.assigneeId ? <p className="mt-4 rounded-[13px] bg-[var(--brand-primary-soft)] p-3 text-[12px] font-semibold text-[var(--brand-primary)]">Este ticket ya esta asignado a {assignee?.name ?? "un tecnico"}.</p> : null}
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}



