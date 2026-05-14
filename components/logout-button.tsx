"use client";

import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";

export function LogoutButton() {
  const router = useRouter();

  const onLogout = () => {
    clearSession();
    router.replace("/login");
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      className="rounded bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
    >
      Logout
    </button>
  );
}
