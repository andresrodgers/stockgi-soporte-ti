"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
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

type ImportState = {
  result: BulkImportResult | null;
  editingRow: EditableErrorRow | null;
  draftValues: BulkImportEditableRow;
  resultFilter: ResultFilter;
  error: string;
  modalError: string;
  loading: boolean;
  savingRow: boolean;
};

const initialImportState: ImportState = {
  result: null,
  editingRow: null,
  draftValues: emptyValues(),
  resultFilter: "all",
  error: "",
  modalError: "",
  loading: false,
  savingRow: false,
};

type ImportAction =
  | { type: "reset_for_new_file" }
  | { type: "import_start" }
  | { type: "import_success"; result: BulkImportResult }
  | { type: "import_error"; message: string }
  | { type: "open_edit_row"; row: EditableErrorRow }
  | { type: "close_edit_row" }
  | { type: "update_draft"; field: keyof BulkImportEditableRow; value: string }
  | { type: "set_result_filter"; filter: ResultFilter }
  | { type: "save_row_start" }
  | { type: "save_row_success_resolved"; result: BulkImportResult; filter: ResultFilter }
  | { type: "save_row_success_still_error"; result: BulkImportResult; filter: ResultFilter; row: EditableErrorRow; message: string }
  | { type: "save_row_error"; message: string };

function importReducer(state: ImportState, action: ImportAction): ImportState {
  switch (action.type) {
    case "reset_for_new_file":
      return { ...state, result: null, editingRow: null, resultFilter: "all", error: "" };
    case "import_start":
      return { ...state, loading: true, error: "", modalError: "", result: null, editingRow: null, resultFilter: "all" };
    case "import_success":
      return { ...state, loading: false, result: action.result };
    case "import_error":
      return { ...state, loading: false, error: action.message };
    case "open_edit_row":
      return { ...state, editingRow: action.row, draftValues: action.row.values, modalError: "" };
    case "close_edit_row":
      return { ...state, editingRow: null, draftValues: emptyValues() };
    case "update_draft":
      return { ...state, draftValues: { ...state.draftValues, [action.field]: action.value } };
    case "set_result_filter":
      return { ...state, resultFilter: action.filter };
    case "save_row_start":
      return { ...state, savingRow: true, modalError: "" };
    case "save_row_success_resolved":
      return { ...state, savingRow: false, result: action.result, resultFilter: action.filter, editingRow: null, draftValues: emptyValues() };
    case "save_row_success_still_error":
      return { ...state, savingRow: false, result: action.result, resultFilter: action.filter, editingRow: action.row, draftValues: action.row.values, modalError: action.message };
    case "save_row_error":
      return { ...state, savingRow: false, modalError: action.message };
    default:
      return state;
  }
}

function SummaryCard({ filter, label, value, active, onSelect }: { filter: ResultFilter; label: string; value: number; active: boolean; onSelect: (filter: ResultFilter) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(filter)}
      className={`rounded-[13px] p-3 text-left transition ${active ? "bg-[var(--brand-primary)] text-white" : "bg-[var(--app-muted)] text-[var(--foreground)]"}`}
    >
      <p className={`text-[20px] font-semibold ${active ? "text-white" : "text-[var(--foreground)]"}`}>{value}</p>
      <p className={`text-[12px] ${active ? "text-white/85" : "text-[var(--brand-secondary)]"}`}>{label}</p>
    </button>
  );
}

export default function CargaMasivaPage() {
  const { contracts } = useAppState();
  const [file, setFile] = useState<File | null>(null);
  const [state, dispatch] = useReducer(importReducer, initialImportState);
  const { result, editingRow, draftValues, resultFilter, error, modalError, loading, savingRow } = state;
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;
    if (editingRow && !dialogEl.open) dialogEl.showModal();
    if (!editingRow && dialogEl.open) dialogEl.close();
  }, [editingRow]);

  const editableContracts = useMemo(() => contracts.filter((contract) => contract.status === "Activo"), [contracts]);

  const filteredRows = useMemo(() => {
    if (!result) return [];
    if (resultFilter === "imported") return result.rows.filter((row) => row.status === "imported");
    if (resultFilter === "error") return result.rows.filter((row) => row.status === "error");
    return result.rows;
  }, [result, resultFilter]);

  async function submitImport() {
    if (!file) return;
    dispatch({ type: "import_start" });

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await csrfFetch("/api/admin/import-users", { method: "POST", body: formData });
      const payload = await readApiResponse<{ result: BulkImportResult }>(response);
      if (!response.ok || !payload?.data?.result) throw new Error(payload?.error || "No fue posible validar el archivo");
      dispatch({ type: "import_success", result: payload.data.result });
    } catch (caught) {
      dispatch({ type: "import_error", message: caught instanceof Error ? caught.message : "No fue posible cargar el archivo" });
    }
  }

  function openEditRow(row: BulkImportRowResult) {
    if (row.status !== "error") return;
    dispatch({ type: "open_edit_row", row: row as EditableErrorRow });
  }

  function updateDraft(field: keyof BulkImportEditableRow, value: string) {
    dispatch({ type: "update_draft", field, value });
  }

  async function saveEditedRow() {
    if (!result || !editingRow) return;
    dispatch({ type: "save_row_start" });

    try {
      const response = await csrfFetch("/api/admin/import-users", {
        method: "POST",
        body: JSON.stringify({ rows: [{ rowNumber: editingRow.rowNumber, values: draftValues }] }),
      });
      const payload = await readApiResponse<{ result: BulkImportResult }>(response);
      if (!response.ok || !payload?.data?.result) throw new Error(payload?.error || "No fue posible crear la fila corregida");

      const retriedRow = payload.data.result.rows[0];
      const merged = mergeImportResults(result, payload.data.result);
      const filter: ResultFilter = retriedRow?.status === "error" ? "error" : "imported";

      if (retriedRow?.status === "error") {
        const nextRow = retriedRow as EditableErrorRow;
        dispatch({ type: "save_row_success_still_error", result: merged, filter, row: nextRow, message: nextRow.errorMessage || "La fila todavía tiene errores" });
        return;
      }

      dispatch({ type: "save_row_success_resolved", result: merged, filter });
    } catch (caught) {
      dispatch({ type: "save_row_error", message: caught instanceof Error ? caught.message : "No fue posible crear la fila corregida" });
    }
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
              aria-label="Seleccionar archivo CSV"
              className={`${inputClass} mt-5 w-full pt-2`}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                dispatch({ type: "reset_for_new_file" });
              }}
            />
            <button type="button" onClick={submitImport} disabled={!file || loading} className="mt-4 h-11 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? "Validando..." : "Validar archivo"}
            </button>
            {error ? <p className="mt-3 rounded-[13px] bg-[#fae4df] p-3 text-[13px] font-semibold text-[#b63c2a]">{error}</p> : null}
          </Card>

          {result ? (
            <Card className="p-5">
              <h2 className="text-[15px] font-semibold">Resultado de carga</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <SummaryCard filter="all" label="Filas" value={result.totalRows} active={resultFilter === "all"} onSelect={(filter) => dispatch({ type: "set_result_filter", filter })} />
                <SummaryCard filter="imported" label="Creados" value={result.createdUsers} active={resultFilter === "imported"} onSelect={(filter) => dispatch({ type: "set_result_filter", filter })} />
                <SummaryCard filter="error" label="Errores" value={result.errorRows} active={resultFilter === "error"} onSelect={(filter) => dispatch({ type: "set_result_filter", filter })} />
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
                          {row.status === "error" ? <button type="button" onClick={() => openEditRow(row)} className="h-8 rounded-[10px] bg-[var(--app-muted)] px-3 text-[12px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]">Editar</button> : <span className="text-[12px] text-[var(--brand-secondary)]">-</span>}
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
        <dialog
          ref={dialogRef}
          onClose={() => dispatch({ type: "close_edit_row" })}
          aria-labelledby="edit-import-row-title"
          className="fixed inset-0 m-auto max-h-[92vh] w-full max-w-[760px] overflow-y-auto rounded-[20px] bg-white p-0 card-shadow backdrop:bg-black/20 backdrop:backdrop-blur-[2px]"
        >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--app-border-soft)] px-6 py-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)]">Fila {editingRow.rowNumber}</p>
                <h2 id="edit-import-row-title" className="mt-1 text-[20px] font-semibold">Corregir usuario</h2>
                <p className="mt-1 text-[13px] font-semibold text-[#b63c2a]">{shortError(editingRow.errorMessage)}</p>
              </div>
              <button type="button" aria-label="Cerrar" onClick={() => dispatch({ type: "close_edit_row" })} className="grid size-9 place-items-center rounded-[11px] bg-[var(--app-muted)] text-[18px] font-semibold text-[var(--brand-secondary)] hover:bg-[var(--brand-primary-soft)]">x</button>
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
                <button type="button" onClick={() => dispatch({ type: "close_edit_row" })} className="h-11 rounded-[14px] bg-white px-5 text-[13px] font-semibold text-[var(--brand-primary)] shadow-sm ring-1 ring-[var(--app-border)]">Cancelar</button>
                <button type="button" onClick={saveEditedRow} disabled={savingRow} className="h-11 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-50">{savingRow ? "Creando..." : "Guardar y crear usuario"}</button>
              </div>
            </div>
        </dialog>
      ) : null}
    </AppShell>
  );
}
