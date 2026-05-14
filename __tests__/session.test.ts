import { clearSession, getDefaultRouteForRole, getSession, setSession } from "@/lib/session";
import type { AuthSession } from "@/lib/auth-types";

const MOCK_SESSION: AuthSession = {
  accessToken: "access-token-abc",
  refreshToken: "refresh-token-xyz",
  user: {
    id: "user-1",
    email: "dr@test.com",
    name: "Dr. House",
    role: "doctor",
    createdAt: "2025-01-01T00:00:00Z",
  },
};

beforeEach(() => {
  localStorage.clear();
  // reset document.cookie
  document.cookie.split(";").forEach((c) => {
    document.cookie = c.trim().split("=")[0] + "=; max-age=0; path=/";
  });
});

describe("getSession", () => {
  it("returns null when nothing stored", () => {
    expect(getSession()).toBeNull();
  });

  it("returns null and clears storage when stored value is invalid JSON", () => {
    localStorage.setItem("prescriptions_auth_session", "not-json");
    expect(getSession()).toBeNull();
    expect(localStorage.getItem("prescriptions_auth_session")).toBeNull();
  });

  it("returns parsed session from localStorage", () => {
    localStorage.setItem("prescriptions_auth_session", JSON.stringify(MOCK_SESSION));
    expect(getSession()).toEqual(MOCK_SESSION);
  });
});

describe("setSession", () => {
  it("stores session in localStorage", () => {
    setSession(MOCK_SESSION);
    expect(localStorage.getItem("prescriptions_auth_session")).toBe(JSON.stringify(MOCK_SESSION));
  });

  it("sets cookies for access_token, refresh_token and role", () => {
    setSession(MOCK_SESSION);
    expect(document.cookie).toContain("access_token=");
    expect(document.cookie).toContain("refresh_token=");
    expect(document.cookie).toContain("role=doctor");
  });
});

describe("clearSession", () => {
  it("removes session from localStorage", () => {
    setSession(MOCK_SESSION);
    clearSession();
    expect(getSession()).toBeNull();
  });
});

describe("getDefaultRouteForRole", () => {
  it.each([
    ["admin", "/admin"],
    ["doctor", "/doctor/prescriptions"],
    ["patient", "/patient/prescriptions"],
  ] as const)("returns correct route for %s", (role, expected) => {
    expect(getDefaultRouteForRole(role)).toBe(expected);
  });
});
