"use client";

import { AuthSession, UserRole } from "@/lib/auth-types";

const SESSION_STORAGE_KEY = "prescriptions_auth_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    clearSession();
    return null;
  }
}

export function setSession(session: AuthSession): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  setCookie("access_token", session.accessToken);
  setCookie("refresh_token", session.refreshToken);
  setCookie("role", session.user.role);
}

export function clearSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  clearCookie("access_token");
  clearCookie("refresh_token");
  clearCookie("role");
}

export function getDefaultRouteForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "doctor":
      return "/doctor/prescriptions";
    case "patient":
      return "/patient/prescriptions";
    default:
      return "/login";
  }
}

function setCookie(name: string, value: string): void {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax${secure}`;
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0; samesite=lax`;
}
