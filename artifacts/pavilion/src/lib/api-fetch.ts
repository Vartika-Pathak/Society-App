import { startManualRequest, endManualRequest } from "./loading-store";

/**
 * Minimal hand-written POST helper for endpoints that only the Java backend
 * implements (staged signup / visit OTP verification) and that therefore
 * aren't in the shared openapi contract used to generate the typed hooks.
 */
export class ApiFetchError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  startManualRequest();
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    return await parseResponse<T>(response);
  } finally {
    endManualRequest();
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  startManualRequest();
  try {
    const response = await fetch(path, { credentials: "include" });
    return await parseResponse<T>(response);
  } finally {
    endManualRequest();
  }
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  startManualRequest();
  try {
    const response = await fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });

    return await parseResponse<T>(response);
  } finally {
    endManualRequest();
  }
}

export async function apiDelete<T>(path: string): Promise<T> {
  startManualRequest();
  try {
    const response = await fetch(path, { method: "DELETE", credentials: "include" });
    return await parseResponse<T>(response);
  } finally {
    endManualRequest();
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  // A non-JSON body (e.g. Express's default HTML page for a route that doesn't exist
  // at all, as opposed to one that handled the request and returned a JSON error)
  // shouldn't blow up parsing — callers still need a proper ApiFetchError with the
  // real status code to make sense of it.
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    throw new ApiFetchError(response.status, extractErrorMessage(data, response.status));
  }

  return data as T;
}

function extractErrorMessage(data: unknown, status: number): string {
  if (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string") {
    return (data as { error: string }).error;
  }
  return `Request failed (${status})`;
}
