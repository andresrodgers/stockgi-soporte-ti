"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import { apiFetch } from "@/lib/api-client";
import type { PaginationMeta, User } from "@/lib/types";
import { UserTable } from "./user-table";
import { UserFormModal } from "./user-form-modal";
import { ResetPasswordModal } from "./reset-password-modal";
import { DeleteUserModal } from "./delete-user-modal";

const PAGE_SIZE = 10;
const initialPagination: PaginationMeta = { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 };

export default function UsuariosPage() {
  const { contracts } = useAppState();
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [tableUsers, setTableUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(initialPagination);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);

  const loadUsers = useCallback(async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiFetch<{ users: User[]; pagination: PaginationMeta }>(`/api/admin/users?page=${pageNumber}&pageSize=${PAGE_SIZE}`);
      setTableUsers(payload.users);
      setPagination(payload.pagination);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No fue posible consultar usuarios");
      setTableUsers([]);
      setPagination({ ...initialPagination, page: pageNumber });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => {
      void loadUsers(page);
    }, 0);
    return () => window.clearTimeout(task);
  }, [loadUsers, page]);

  async function refreshUsersAfterMutation(targetPage: number) {
    if (page !== targetPage) {
      setPage(targetPage);
      return;
    }
    await loadUsers(targetPage);
  }

  async function handleFormSaved(isNewUser: boolean) {
    await refreshUsersAfterMutation(isNewUser ? 1 : page);
  }

  async function handleDeleted() {
    const nextTotal = Math.max(0, pagination.totalItems - 1);
    const nextTotalPages = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));
    const targetPage = Math.min(page, nextTotalPages);
    await refreshUsersAfterMutation(targetPage);
  }

  return (
    <AppShell>
      <div className="grid gap-[18px]">
        <PageHeader eyebrow="Administración" title="Usuarios" description="Crea usuarios, cambia contratos, ajusta roles y activa o inactiva accesos." />
        <UserTable
          contracts={contracts}
          tableUsers={tableUsers}
          pagination={pagination}
          loading={loading}
          error={error}
          onPageChange={setPage}
          onCreate={() => {
            setEditingUser(null);
            setOpen(true);
          }}
          onEdit={(user) => {
            setEditingUser(user);
            setOpen(true);
          }}
          onReset={setResetTarget}
          onDelete={setDeleteTarget}
        />
      </div>

      <UserFormModal
        open={open}
        editingUser={editingUser}
        contracts={contracts}
        onClose={() => setOpen(false)}
        onSaved={handleFormSaved}
      />

      <ResetPasswordModal target={resetTarget} onClose={() => setResetTarget(null)} onDone={() => refreshUsersAfterMutation(page)} />

      <DeleteUserModal target={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />
    </AppShell>
  );
}
