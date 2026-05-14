"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiRequest } from "@/lib/http-client";
import { isUserRole, SessionUser, UserRole } from "@/lib/auth-types";
import { clearSession, getDefaultRouteForRole, getSession } from "@/lib/session";
import { LogoutButton } from "@/components/logout-button";

type ProfilePanelProps = {
  title: string;
  description: string;
  expectedRole: UserRole;
};

export function ProfilePanel({ title, description, expectedRole }: ProfilePanelProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<SessionUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = getSession();

    if (!session || !isUserRole(session.user.role)) {
      clearSession();
      router.replace("/login");
      return;
    }

    apiRequest<SessionUser>("/auth/profile", { method: "GET" }, { auth: true })
      .then((user) => {
        setProfile(user);

        if (user.role !== expectedRole) {
          router.replace(getDefaultRouteForRole(user.role));
        }
      })
      .catch((requestError) => {
        if (requestError instanceof ApiError && requestError.status === 401) {
          clearSession();
          router.replace("/login");
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Could not load your profile.",
        );
      });
  }, [expectedRole, router]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-zinc-600">{description}</p>
        </div>
        <LogoutButton />
      </header>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!profile ? (
        <p className="text-sm text-zinc-600">Loading profile...</p>
      ) : (
        <section className="rounded border border-zinc-200 bg-white p-4 text-sm">
          <p>
            Logged in as <strong>{profile.name}</strong> ({profile.email})
          </p>
          <p className="text-zinc-600">Role: {profile.role}</p>
        </section>
      )}
    </main>
  );
}
