"use client";

import { Card, PaginationControls } from "@/components/ui";
import type { Contract, PaginationMeta, User } from "@/lib/types";

export function UserTable({
  contracts,
  tableUsers,
  pagination,
  loading,
  error,
  onPageChange,
  onCreate,
  onEdit,
  onReset,
  onDelete,
}: {
  contracts: Contract[];
  tableUsers: User[];
  pagination: PaginationMeta;
  loading: boolean;
  error: string | null;
  onPageChange: (page: number) => void;
  onCreate: () => void;
  onEdit: (user: User) => void;
  onReset: (user: User) => void;
  onDelete: (user: User) => void;
}) {
  return (
    <Card>
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold">Usuarios</h2>
          <p className="text-[12px] text-[var(--brand-secondary)]">Los cambios quedan registrados en la base de datos del portal.</p>
        </div>
        <button type="button" onClick={onCreate} className="h-10 rounded-[13px] bg-[var(--brand-primary)] px-4 text-[13px] font-semibold text-white btn-shadow hover:bg-[var(--brand-primary-dark)]">Nuevo usuario</button>
      </div>
      {loading && tableUsers.length === 0 ? <p className="px-5 py-8 text-center text-[13px] text-[var(--brand-secondary)]">Cargando usuarios...</p> : null}
      {error ? <p className="px-5 py-8 text-center text-[13px] font-semibold text-[#b63c2a]">{error}</p> : null}
      {!error && (!loading || tableUsers.length > 0) ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-[880px] w-full text-left text-[13px]">
              <thead className="text-[11px] uppercase tracking-[0.08em] text-[var(--brand-secondary)]">
                <tr><th className="px-5 py-3">Nombre</th><th className="px-5 py-3">Cédula</th><th className="px-5 py-3">Contrato</th><th className="px-5 py-3">Rol</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3">Acción</th></tr>
              </thead>
              <tbody>
                {tableUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[var(--app-muted)]">
                    <td className="border-t border-[var(--app-border-soft)] px-5 py-3 font-semibold">{user.name}</td>
                    <td className="border-t border-[var(--app-border-soft)] px-5 py-3">{user.cedula}</td>
                    <td className="border-t border-[var(--app-border-soft)] px-5 py-3">{contracts.find((contract) => contract.id === user.contractId)?.name}</td>
                    <td className="border-t border-[var(--app-border-soft)] px-5 py-3">{user.role}</td>
                    <td className="border-t border-[var(--app-border-soft)] px-5 py-3">{user.status}</td>
                    <td className="border-t border-[var(--app-border-soft)] px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => onEdit(user)} className="h-8 rounded-[10px] bg-[var(--app-muted)] px-3 text-[12px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-primary-soft)]">Editar</button>
                        <button type="button" onClick={() => onReset(user)} className="h-8 rounded-[10px] bg-[var(--brand-primary-soft)] px-3 text-[12px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--app-muted)]">Restablecer contraseña</button>
                        <button type="button" onClick={() => onDelete(user)} className="h-8 rounded-[10px] bg-[#fae4df] px-3 text-[12px] font-semibold text-[#b63c2a] hover:bg-[#f6d3cb]">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls pagination={pagination} onPageChange={onPageChange} />
        </>
      ) : null}
    </Card>
  );
}
