"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Field, inputClass, selectClass } from "@/components/ui";
import { useAppState } from "@/context/app-state";
import { t } from "@/i18n";
import type { Role } from "@/lib/types";
import { csrfFetch } from "@/lib/api-client";

const rolePath: Record<Role, string> = {
  usuario: "/usuario",
  ti_operativo: "/ti",
  ti_administrativo: "/admin",
};

type AuthUser = { id: string; role: Role; mustChangePassword?: boolean };

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-none stroke-current stroke-[1.8]">
        <path d="M2 12c.7-3.6 4.8-7 10-7s9.3 3.4 10 7c-.7 3.6-4.8 7-10 7S2.7 15.6 2 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] fill-none stroke-current stroke-[1.8]">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.7a2 2 0 002.7 2.7" />
      <path d="M9.9 5.1A10.9 10.9 0 0112 5c5.2 0 9.3 3.4 10 7-.3 1.6-1.4 3.1-2.9 4.3" />
      <path d="M6.2 6.3C3.9 7.5 2.4 9.6 2 12c.7 3.6 4.8 7 10 7 2 0 3.8-.5 5.4-1.3" />
    </svg>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <Field label={label}>
      <div className="relative">
        <input
          className={`${inputClass} w-full pr-11`}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          aria-label={visible ? "Ocultar contrasena" : "Mostrar contrasena"}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[9px] text-[var(--brand-secondary)] transition hover:bg-white hover:text-[var(--brand-primary)]"
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </Field>
  );
}

export function LoginClient() {
  const router = useRouter();
  const { contracts, refreshData, setCurrentUserId } = useAppState();
  const activeContracts = contracts.filter((contract) => contract.status === "Activo");
  const [contractId, setContractId] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedContractId = contractId || activeContracts[0]?.id || "";
  const isChangingPassword = Boolean(pendingUser?.mustChangePassword);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { headers: { "Accept-Language": "es-CO" } })
      .then((response) => response.ok ? response.json() : null)
      .then((payload) => {
        const user = payload?.data?.user as AuthUser | undefined;
        if (!cancelled && user?.mustChangePassword) setPendingUser(user);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept-Language": "es-CO" },
        body: JSON.stringify({ contractId: selectedContractId, documentId: documentId.trim(), password }),
      });

      const payload = await response.json().catch(() => null) as { data?: { user?: AuthUser }; error?: string } | null;

      if (!response.ok || !payload?.data?.user) {
        setError(payload?.error || t("auth.loginError"));
        return;
      }

      const user = payload.data.user;
      setCurrentUserId(user.id);

      if (user.mustChangePassword) {
        setPendingUser(user);
        setPassword("");
        return;
      }

      await refreshData();
      router.push(rolePath[user.role]);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function changeTemporaryPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(t("auth.mismatch"));
      return;
    }

    setLoading(true);
    try {
      const response = await csrfFetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept-Language": "es-CO" },
        body: JSON.stringify({ newPassword }),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;

      if (!response.ok) {
        setError(payload?.error || t("auth.changePasswordError"));
        return;
      }

      await refreshData();
      const role = pendingUser?.role ?? "usuario";
      router.push(rolePath[role]);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[var(--background)] lg:grid-cols-[0.95fr_1.05fr]">
      <section className="sidebar-gradient relative hidden overflow-hidden px-12 py-10 text-white lg:flex lg:flex-col lg:justify-center">
        <div>
          <div className="inline-flex">
            <Image src="/stockgi-logo.png" alt="StockGI" width={196} height={72} priority />
          </div>
          <div className="mt-16 max-w-lg">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/58">{t("app.portalPrivate")}</p>
            <h1 className="mt-3 text-[36px] font-semibold leading-tight">{t("loginHero.title")}</h1>
            <p className="mt-4 text-[15px] leading-7 text-white/72">{t("loginHero.description")}</p>
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-[430px] rounded-[20px] bg-white p-6 card-shadow sm:p-8">
          <div className="mb-8 text-center lg:hidden">
            <Image src="/stockgi-logo.png" alt="StockGI" width={168} height={64} className="mx-auto" priority />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--brand-secondary)]">{t("app.privateAccess")}</p>
          <h2 className="mt-2 text-[24px] font-semibold text-[var(--foreground)]">
            {isChangingPassword ? t("auth.newPasswordTitle") : t("auth.loginTitle")}
          </h2>
          <p className="mt-2 text-[13px] leading-6 text-[var(--brand-secondary)]">
            {isChangingPassword ? t("auth.newPasswordHelp") : t("auth.loginHelp")}
          </p>

          {isChangingPassword ? (
            <form onSubmit={changeTemporaryPassword} className="mt-6 grid gap-4">
              <PasswordField label={t("auth.newPassword")} value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
              <PasswordField label={t("auth.repeatPassword")} value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
              {error ? <p className="rounded-[12px] bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700">{error}</p> : null}
              <button disabled={loading} className="mt-2 h-12 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[14px] font-semibold text-white btn-shadow transition hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? t("common.saving") : t("auth.savePassword")}
              </button>
            </form>
          ) : (
            <form onSubmit={login} className="mt-6 grid gap-4">
              <Field label={t("auth.contract")}>
                <select className={selectClass} value={selectedContractId} onChange={(event) => setContractId(event.target.value)} required>
                  <option value="" disabled>{t("auth.selectContract")}</option>
                  {activeContracts.map((contract) => (
                    <option key={contract.id} value={contract.id}>{contract.name}</option>
                  ))}
                </select>
              </Field>
              <Field label={t("auth.documentId")}>
                <input className={inputClass} value={documentId} onChange={(event) => setDocumentId(event.target.value)} autoComplete="username" inputMode="numeric" required />
              </Field>
              <PasswordField label={t("auth.password")} value={password} onChange={setPassword} autoComplete="current-password" />
              {error ? <p className="rounded-[12px] bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700">{error}</p> : null}
              <button disabled={loading} className="mt-2 h-12 rounded-[14px] bg-[var(--brand-primary)] px-5 text-[14px] font-semibold text-white btn-shadow transition hover:bg-[var(--brand-primary-dark)] disabled:cursor-not-allowed disabled:opacity-70">
                {loading ? t("common.entering") : t("auth.submit")}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

