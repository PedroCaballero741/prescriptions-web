"use client";

import { AuthSession, SessionUser } from "@/lib/auth-types";
import { clearSession, getSession, setSession } from "@/lib/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

type RequestOptions = {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

type RefreshResponse = {
  accessToken?: string;
  refreshToken?: string;
  user?: SessionUser;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<T> {
  const response = await apiRequestRaw(path, init, options);

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiRequestRaw(
  path: string,
  init: RequestInit = {},
  options: RequestOptions = {},
): Promise<Response> {
  const { auth = false, retryOnUnauthorized = true } = options;
  const session = getSession();

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth && session?.accessToken) {
    headers.set("Authorization", `Bearer ${session.accessToken}`);
  }

  let response: Response;
  try {
    response = await fetch(resolveUrl(path), {
      ...init,
      headers,
    });
  } catch (networkError) {
    const msg = networkError instanceof Error ? networkError.message : "Network error";
    throw new ApiError(0, `Cannot reach the server: ${msg}`);
  }

  if (response.status === 401 && auth && retryOnUnauthorized) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiRequestRaw(path, init, { auth, retryOnUnauthorized: false });
    }
  }

  if (!response.ok) {
    throw await createApiError(response);
  }

  return response;
}

async function refreshSession(): Promise<boolean> {
  const currentSession = getSession();
  if (!currentSession?.refreshToken) {
    clearSession();
    return false;
  }

  const refreshResponse = await fetch(resolveUrl("/auth/refresh"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken: currentSession.refreshToken }),
  });

  if (!refreshResponse.ok) {
    clearSession();
    return false;
  }

  const refreshPayload = (await refreshResponse.json()) as RefreshResponse;
  if (!refreshPayload.accessToken) {
    clearSession();
    return false;
  }

  const user = refreshPayload.user ?? (await fetchProfile(refreshPayload.accessToken));
  if (!user) {
    clearSession();
    return false;
  }

  const nextSession: AuthSession = {
    accessToken: refreshPayload.accessToken,
    refreshToken: refreshPayload.refreshToken ?? currentSession.refreshToken,
    user,
  };

  setSession(nextSession);
  return true;
}

async function fetchProfile(accessToken: string): Promise<SessionUser | null> {
  const profileResponse = await fetch(resolveUrl("/auth/profile"), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!profileResponse.ok) {
    return null;
  }

  return (await profileResponse.json()) as SessionUser;
}

async function createApiError(response: Response): Promise<ApiError> {
  let message = `Request failed with status ${response.status}`;

  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(payload.message)) {
      message = payload.message.join(", ");
    } else if (payload.message) {
      message = payload.message;
    }
  } catch {
    // keep default message
  }

  return new ApiError(response.status, message);
}

function resolveUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
