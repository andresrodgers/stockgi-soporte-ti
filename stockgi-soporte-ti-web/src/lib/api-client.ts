import { defaultLocale } from "@/i18n/config";

type ApiResponse<T> = { data?: T; error?: string };

let csrfTokenPromise: Promise<string | null> | null = null;

function needsCsrf(method?: string) {
  const normalized = (method || "GET").toUpperCase();
  return !["GET", "HEAD", "OPTIONS"].includes(normalized);
}

function needsIdempotency(method?: string) {
  return (method || "GET").toUpperCase() === "POST";
}

async function getCsrfToken() {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch("/api/auth/csrf", { headers: { "Accept-Language": defaultLocale } })
      .then(async (response) => {
        const payload = await readApiResponse<{ csrfToken: string }>(response);
        if (!response.ok || !payload?.data?.csrfToken) return null;
        return payload.data.csrfToken;
      })
      .catch(() => null);
  }
  return csrfTokenPromise;
}

export function resetCsrfToken() {
  csrfTokenPromise = null;
}

export async function readApiResponse<T>(response: Response) {
  const raw = await response.text();
  if (!raw.trim().length) return null;
  try {
    return JSON.parse(raw) as ApiResponse<T>;
  } catch {
    return null;
  }
}

export async function csrfFetch(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("Accept-Language", defaultLocale);
  if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  if (needsCsrf(init?.method)) {
    const token = await getCsrfToken();
    if (token) headers.set("X-CSRF-Token", token);
  }

  if (needsIdempotency(init?.method) && !headers.has("Idempotency-Key")) {
    headers.set("Idempotency-Key", crypto.randomUUID());
  }

  return fetch(url, { ...init, headers });
}

export async function apiFetch<T>(url: string, init?: RequestInit) {
  const response = await csrfFetch(url, init);
  const payload = await readApiResponse<T>(response);
  if (!response.ok || !payload?.data) {
    throw new Error(payload?.error || "Error de API interna");
  }
  return payload.data;
}