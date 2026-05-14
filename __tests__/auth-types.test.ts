import { isUserRole } from "@/lib/auth-types";

describe("isUserRole", () => {
  it.each(["admin", "doctor", "patient"])("returns true for valid role: %s", (role) => {
    expect(isUserRole(role)).toBe(true);
  });

  it.each([null, undefined, "", "superadmin", "user"])("returns false for invalid role: %s", (value) => {
    expect(isUserRole(value)).toBe(false);
  });
});
