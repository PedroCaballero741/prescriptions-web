import { NextRequest, NextResponse } from "next/server";
import { isUserRole, UserRole } from "@/lib/auth-types";

function getHomeForRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "doctor":
      return "/doctor/prescriptions";
    case "patient":
      return "/patient/prescriptions";
  }
}

function getRequiredRole(pathname: string): UserRole | null {
  if (pathname.startsWith("/admin")) {
    return "admin";
  }

  if (pathname.startsWith("/doctor")) {
    return "doctor";
  }

  if (pathname.startsWith("/patient")) {
    return "patient";
  }

  return null;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const roleFromCookie = request.cookies.get("role")?.value;
  const role = isUserRole(roleFromCookie) ? roleFromCookie : null;

  if (pathname === "/login") {
    if (accessToken && role) {
      return NextResponse.redirect(new URL(getHomeForRole(role), request.url));
    }

    return NextResponse.next();
  }

  const requiredRole = getRequiredRole(pathname);
  if (!requiredRole) {
    return NextResponse.next();
  }

  if (!accessToken || !role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (role !== requiredRole) {
    return NextResponse.redirect(new URL(getHomeForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/doctor/:path*", "/patient/:path*"],
};
