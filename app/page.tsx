import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Prescriptions Web</h1>
      <p className="text-sm text-zinc-600">
        Login and you will be redirected to your role-specific area.
      </p>
      <Link href="/login" className="w-fit rounded bg-zinc-900 px-3 py-2 text-sm text-white">
        Go to login
      </Link>
    </main>
  );
}
