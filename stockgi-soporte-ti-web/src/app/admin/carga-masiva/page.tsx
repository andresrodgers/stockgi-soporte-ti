"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, PageHeader, inputClass } from "@/components/ui";
import type { BulkImportResult } from "@/lib/types";

const columns = [
  "contrato",
  "cedula",
  "nombre_completo",
  "rol",
  "contrasena_temporal",
  "correo",
  "telefono",
  "area",
  "cargo",
  "sede",
  "estado",
];

export default function CargaMasivaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitImport() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/admin/import-users", { method: "POST", body: formData });
      const payload = await response.json() as { data?: { result: BulkImportResult }; error?: string };
      if (!response.ok || !payload.data) throw new Error(payload.error || "No fue posible validar el archivo");
      setResult(payload.data.result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No fue posible cargar el archivo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader eyebrow="Usuarios" title="Carga masiva por CSV" description="Descarga la plantilla CSV, diligencia los usuarios y carga el archivo para validacion." />
        <div className="grid gap-[18px] lg:grid-cols-[1fr_380px]">
          <div className="grid gap-[18px]">
            <Card className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)]">Paso 1</p>
                  <h2 className="mt-1 text-[15px] font-semibold">Descargar plantilla</h2>
                  <p className="mt-1 text-[12px] text-[var(--brand-secondary)]">Usa este archivo para evitar errores de columnas y formato.</p>
                </div>
                <a
                  href="/plantilla-usuarios-stockgi.csv"
                  download
                  className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[var(--brand-primary)] px-5 text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)]"
                >
                  Descargar CSV
                </a>
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--brand-secondary)]">Paso 2</p>
              <h2 className="mt-1 text-[15px] font-semibold">Cargar archivo diligenciado</h2>
              <p className="mt-1 text-[12px] text-[var(--brand-secondary)]">Solo se acepta archivo `.csv` basado en la plantilla oficial.</p>
              <input
                className={`${inputClass} mt-5 w-full pt-2`}
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setResult(null);
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
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-[13px] bg-[var(--app-muted)] p-3"><p className="text-[20px] font-semibold">{result.totalRows}</p><p className="text-[12px] text-[var(--brand-secondary)]">Filas</p></div>
                  <div className="rounded-[13px] bg-[var(--brand-primary-soft)] p-3"><p className="text-[20px] font-semibold text-[var(--brand-primary)]">{result.createdUsers}</p><p className="text-[12px] text-[var(--brand-secondary)]">Creados</p></div>
                  <div className="rounded-[13px] bg-[var(--app-muted)] p-3"><p className="text-[20px] font-semibold">{result.validRows}</p><p className="text-[12px] text-[var(--brand-secondary)]">Validas</p></div>
                  <div className="rounded-[13px] bg-[#fae4df] p-3"><p className="text-[20px] font-semibold text-[#b63c2a]">{result.errorRows}</p><p className="text-[12px] text-[#b63c2a]">Errores</p></div>
                </div>
                <div className="mt-4 max-h-[360px] overflow-auto rounded-[14px] border border-[var(--app-border-soft)]">
                  <table className="w-full min-w-[680px] text-left text-[12px]">
                    <thead className="bg-[var(--app-muted)] text-[10px] uppercase tracking-[0.08em] text-[var(--brand-secondary)]"><tr><th className="px-3 py-2">Fila</th><th className="px-3 py-2">Cedula</th><th className="px-3 py-2">Nombre</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Detalle</th></tr></thead>
                    <tbody>
                      {result.rows.map((row) => (
                        <tr key={row.rowNumber}>
                          <td className="border-t border-[var(--app-border-soft)] px-3 py-2">{row.rowNumber}</td>
                          <td className="border-t border-[var(--app-border-soft)] px-3 py-2">{row.cedula}</td>
                          <td className="border-t border-[var(--app-border-soft)] px-3 py-2 font-semibold">{row.name}</td>
                          <td className="border-t border-[var(--app-border-soft)] px-3 py-2">{row.status}</td>
                          <td className="border-t border-[var(--app-border-soft)] px-3 py-2 text-[var(--brand-secondary)]">{row.errorMessage ?? "Importado"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : null}
          </div>

          <Card className="p-5">
            <h2 className="text-[15px] font-semibold">Columnas de la plantilla</h2>
            <p className="mt-1 text-[12px] text-[var(--brand-secondary)]">No cambies los nombres de las columnas.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {columns.map((column) => (
                <span key={column} className="rounded-full bg-[var(--app-muted)] px-3 py-1 text-[12px] font-semibold text-[var(--brand-secondary)]">{column}</span>
              ))}
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[13px] bg-[var(--brand-primary-soft)] p-3 text-[13px] text-[var(--brand-primary)]">Se crean las filas validas directamente en el repositorio demo.</div>
              <div className="rounded-[13px] bg-[#fae4df] p-3 text-[13px] text-[#b63c2a]">Errores esperados: cedula repetida en contrato, contrato inexistente, rol invalido o columnas faltantes.</div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

