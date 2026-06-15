"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, PageHeader, inputClass, selectClass } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import { csrfFetch, readApiResponse } from "@/lib/api-client";
import type { BulkImportEditableRow, BulkImportResult, BulkImportRowResult } from "@/lib/types";

type ResultFilter = "all" | "imported" | "error";

type EditableErrorRow = BulkImportRowResult & {
  values: BulkImportEditableRow;
};

const columns = ["contrato", "cedula", "nombre_completo", "rol", "correo", "telefono", "area", "cargo", "sede", "estado"];

const roleOptions = [
  { value: "usuario", label: "Usuario" },
  { value: "ti_operativo", label: "TI operativo" },
  { value: "ti_administrativo", label: "TI administrativo" },
];

const statusOptions = ["Activo", "Inactivo"];

function buildSummary(rows: BulkImportRowResult[]): BulkImportResult {
  const errorRows = rows.filter((row) => row.status === "error").length;
  const createdUsers = rows.filter((row) => row.status === "imported").length;
  return { totalRows: rows.length, validRows: rows.length - errorRows, errorRows, createdUsers, rows };
}

function mergeImportResults(previous: BulkImportResult, retried: BulkImportResult) {
  const retriedMap = new Map(retried.rows.map((row) => [row.rowNumber, row]));
  const mergedRows = previous.rows.map((row) => retriedMap.get(row.rowNumber) ?? row);
  return buildSummary(mergedRows);
}

function emptyValues(): BulkImportEditableRow {
  return {
    contractName: "",
    cedula: "",
    name: "",
    role: "usuario",
    email: "",
    phone: "",
    area: "",
    position: "",
    location: "",
    status: "Activo",
  };
}

function shortError(message?: string) {
  if (!message) return "-";
  return message.split(";")[0]?.trim() || message;
}

export default function CargaMasivaPage() {
  const { contracts } = useAppState();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [editingRow, setEditingRow] = useState<EditableErrorRow | null>(null);
  const [draftValues, setDraftValues] = useState<BulkImportEditableRow>(emptyValues());
  const [resultFilter, setResultFilter] = useState<ResultFilter>("all");
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [savingRow, setSavingRow] = useState(false);

  const editableContracts = useMemo(() => contracts.filter((contract) => contract.status === "Activo"), [contracts]);

  const filteredRows = useMemo(() => {
    if (!result) return [];
    if (resultFilter === "imported") return result.rows.filter((row) => row.status === "imported");
    if (resultFilter === "error") return result.rows.filter((row) => row.status === "error");
    return result.rows;
  }, [result, resultFilter]);

  async function submitImport() {
    if (!file) return;
    setLoading(true);
    setError("");
    setModalError("");
    setResult(null);
    setEditingRow(null);
    setResultFilter("all");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await csrfFetch("/api/admin/import-users", { method: "POST", body: formData });
      const payload = await readApiResponse<{ result: BulkImportResult }>(response);
      if (!response.ok || !payload?.data?.result) throw new Error(payload?.error || "No fue posible validar el archivo");
      setResult(payload.data.result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible cargar el archivo");
    } finally {
      setLoading(false);
    }
  }

  function openEditRow(row: BulkImportRowResult) {
    if (row.status !== "error") return;
    const editableRow = row as EditableErrorRow;
    setEditingRow(editableRow);
    setDraftValues(editableRow.values);
    setModalError("");
  }

  function updateDraft(field: keyof BulkImportEditableRow, value: string) {
    setDraftValues((current) => ({ ...current, [field]: value }));
  }

  async function saveEditedRow() {
    if (!result || !editingRow) return;
    setSavingRow(true);
    setModalError("");

    try {
      const response = await csrfFetch("/api/admin/import-users", {
        method: "POST",
        body: JSON.stringify({ rows: [{ rowNumber: editingRow.rowNumber, values: draftValues }] }),
      });
      const payload = await readApiResponse<{ result: BulkImportResult }>(response);
      if (!response.ok || !payload?.data?.result) throw new Error(payload?.error || "No fue posible crear la fila corregida");

      const retriedRow = payload.data.result.rows[0];
      const merged = mergeImportResults(result, payload.data.result);
      setResult(merged);
      setResultFilter(retriedRow?.status === "error" ? "error" : "imported");

      if (retriedRow?.status === "error") {
        const nextRow = retriedRow as EditableErrorRow;
        setEditingRow(nextRow);
        setDraftValues(nextRow.values);
        setModalError(nextRow.errorMessage || "La fila todavía tiene errores");
        return;
      }

      setEditingRow(null);
      setDraftValues(emptyValues());
    } catch (caught) {
      setModalError(caught instanceof Error ? caught.message : "No fue posible crear la fila corregida");
    } finally {
      setSavingRow(false);
    }
  }

  function renderSummaryCard(filter: ResultFilter, label: string, value: number) {
    const active = resultFilter === filter;
    return (
      <button
        type="button"
        onClick={() => setResultFilter(filter)}
        className={`rounded-[13px] p-3 text-left transition ${active ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--app-muted)] text-[var(--foreground)]"}`}
      >
        <p className={`text-[20px] font-semibold ${active ? "text-white" : "text-[var(--foreground)]"}`}>{value}</p>
        <p className={`text-[12px] ${active ? "text-white/85" : "text-[var(--brand-secondary)]"}`}>{label}</p>
      </button>
    );
  }

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader eyebrow="Usuarios" title="Carga masiva por CSV" description="Descarga la plantilla CSV, diligencia los usuarios y carga el archivo para validación." />
        <div className="grid gap-[18px]">
          <Card className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)]">Paso 1</p>
                <h2 className="mt-1 text-[15px] font-semibold">Descargar plantilla</h2>
                <p className="mt-1 text-[12px] text-[var(--brand-secondary)]">Usa este archivo para evitar errores de columnas y formato.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {columns.map((column) => (
                    <span key={column} className="rounded-full bg-[var(--app-muted)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-secondary)]">{column}</span>
                  ))}
                </div>
              </div>
              <a href="/plantilla-usuarios-stockgi.csv" download className="inline-flex h-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--brand-primary)] px-5 text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)]">
                Descargar CSV
              </a>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)]">Paso 2</p>
            <h2 className="mt-1 text-[15px] font-semibold">Cargar archivo diligenciado</h2>
            <p className="mt-1 text-[12px] text-[var(--brand-secondary)]">Se acepta CSV separado por coma o punto y coma, basado en la plantilla oficial.</p>
            <input
              className={`${inputClass} mt-5 w-full pt-2`}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setResult(null);
                setEditingRow(null);
                setResultFilter("all");
                setError("");
              }}
            />
            <button onClick={submitImport} disabled={!file || loading} className="mt-4 h-11 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "Validando..." : "Validar archivo"}
            </button>
            {error ? <p className="mt-3 rounded-[13px] bg-[#fae4df] p-3 text-[13px] font-semibold text-[#b63c2a]">{error}</p> : null}
          </Card>

          {result ? (
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold">Resultado de carga</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {renderSummaryCard("all", "Filas", result.totalRows)}
                {renderSummaryCard("imported", "Creados", result.createdUsers)}
                {renderSummaryCard("error", "Errores", result.errorRows)}
              </div>
              <div className="mt-4 overflow-hidden rounded-[14px] border border-[var(--app-border-soft)]">
                <table className="w-full table-fixed text-left text-[12px]">
                  <thead className="bg-[var(--app-muted)] text-[10px] uppercase tracking-[0.08em] text-[var(--brand-secondary)]">
                    <tr>
                      <th className="w-[70px] px-3 py-2">Fila</th>
                      <th className="px-3 py-2">Cédula</th>
                      <th className="px-3 py-2">Nombre</th>
                      <th className="hidden px-3 py-2 md:table-cell">Contrato</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Error</th>
                      <th className="w-[110px] px-3 py-2">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td className="border-t border-[var(--app-border-soft)] px-3 py-2">{row.rowNumber}</td>
                        <td className="truncate border-t border-[var(--app-border-soft)] px-3 py-2">{row.cedula}</td>
                        <td className="truncate border-t border-[var(--app-border-soft)] px-3 py-2 font-semibold">{row.name}</td>
                        <td className="hidden truncate border-t border-[var(--app-border-soft)] px-3 py-2 md:table-cell">{row.contractName}</td>
                        <td className="border-t border-[var(--app-border-soft)] px-3 py-2">{row.status === "error" ? "Error" : "Creado"}</td>
                        <td className="truncate border-t border-[var(--app-border-soft)] px-3 py-2 text-[#b63c2a]" title={row.errorMessage}>{row.status === "error" ? shortError(row.errorMessage) : "-"}</td>
                        <td className="border-t border-[var(--app-border-soft)] px-3 py-2">
                          {row.status === "error" ? <button onClick={() => openEditRow(row)} className="h-8 rounded-[10px] bg-[var(--app-muted)] px-3 text-[12px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]">Editar</button> : <span className="text-[12px] text-[var(--brand-secondary)]">-</span>}
                        </td>
                      </tr>
                    ))}
                    {!filteredRows.length ? (
                      <tr>
                        <td colSpan={7} className="border-t border-[var(--app-border-soft)] px-3 py-6 text-center text-[12px] text-[var(--brand-secondary)]">No hay filas para este filtro.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      {editingRow ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/20 px-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-labelledby="edit-import-row-title">
          <div className="max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-[20px] bg-white card-shadow">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--app-border-soft)] px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)]">Fila {editingRow.rowNumber}</p>
                <h2 id="edit-import-row-title" className="mt-1 text-[20px] font-semibold">Corregir usuario</h2>
                <p className="mt-1 text-[13px] font-semibold text-[#b63c2a]">{shortError(editingRow.errorMessage)}</p>
              </div>
              <button onClick={() => setEditingRow(null)} className="grid size-9 place-items-center rounded-[11px] bg-[var(--app-muted)] text-[18px] font-semibold text-[var(--brand-secondary)] hover:bg-[var(--brand-primary-soft)]">x</button>
            </div>

            <div className="grid gap-4 px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-[12px] font-semibold text-[var(--brand-secondary)]">
                  Contrato
                  <select value={draftValues.contractName} onChange={(event) => updateDraft("contractName", event.target.value)} className={selectClass}>
                    <option value="">Selecciona contrato</option>
                    {editableContracts.map((contract) => <option key={contract.id} value={contract.name}>{contract.name}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-[12px] font-semibold text-[var(--brand-secondary)]">
                  Rol
                  <select value={draftValues.role} onChange={(event) => updateDraft("role", event.target.value)} className={selectClass}>
                    <option value="">Selecciona rol</option>
                    {roleOptions.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-[12px] font-semibold text-[var(--brand-secondary)]">Cédula<input value={draftValues.cedula} onChange={(event) => updateDraft("cedula", event.target.value)} className={inputClass} /></label>
                <label className="grid gap-1 text-[12px] font-semibold text-[var(--brand-secondary)]">Nombre completo<input value={draftValues.name} onChange={(event) => updateDraft("name", event.target.value)} className={inputClass} /></label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1 text-[12px] font-semibold text-[var(--brand-secondary)]">Correo<input value={draftValues.email} onChange={(event) => updateDraft("email", event.target.value)} className={inputClass} /></label>
                <label className="grid gap-1 text-[12px] font-semibold text-[var(--brand-secondary)]">Celular<input value={draftValues.phone} onChange={(event) => updateDraft("phone", event.target.value)} className={inputClass} /></label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="grid gap-1 text-[12px] font-semibold text-[var(--brand-secondary)]">Área<input value={draftValues.area} onChange={(event) => updateDraft("area", event.target.value)} className={inputClass} /></label>
                <label className="grid gap-1 text-[12px] font-semibold text-[var(--brand-secondary)]">Cargo<input value={draftValues.position} onChange={(event) => updateDraft("position", event.target.value)} className={inputClass} /></label>
                <label className="grid gap-1 text-[12px] font-semibold text-[var(--brand-secondary)]">Sede<input value={draftValues.location} onChange={(event) => updateDraft("location", event.target.value)} className={inputClass} /></label>
              </div>

              <label className="grid gap-1 text-[12px] font-semibold text-[var(--brand-secondary)] sm:max-w-[240px]">
                Estado
                <select value={draftValues.status} onChange={(event) => updateDraft("status", event.target.value)} className={selectClass}>
                  {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>

              {modalError ? <p className="rounded-[13px] bg-[#fae4df] p-3 text-[13px] font-semibold text-[#b63c2a]">{modalError}</p> : null}

              <div className="flex flex-col-reverse gap-2 border-t border-[var(--app-border-soft)] pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setEditingRow(null)} className="h-11 rounded-[14px] bg-white px-5 text-[13px] font-semibold text-[var(--brand-primary)] shadow-sm ring-1 ring-[var(--app-border)]">Cancelar</button>
                <button onClick={saveEditedRow} disabled={savingRow} className="h-11 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50">{savingRow ? "Creando..." : "Guardar y crear usuario"}</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
