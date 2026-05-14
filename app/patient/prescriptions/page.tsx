"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RolePageShell } from "@/components/role-page-shell";
import { ApiError, apiRequest, apiRequestRaw } from "@/lib/http-client";
import { PaginatedResponse, Prescription } from "@/lib/prescriptions";

export default function PatientPrescriptionsPage() {
  return (
    <RolePageShell
      title="Patient prescriptions"
      description="Check prescriptions, consume them and download PDF"
      expectedRole="patient"
    >
      <PatientPrescriptionsContent />
    </RolePageShell>
  );
}

function PatientPrescriptionsContent() {
  const [response, setResponse] = useState<PaginatedResponse<Prescription> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [reloadSignal, setReloadSignal] = useState(0);

  useEffect(() => {
    apiRequest<PaginatedResponse<Prescription>>(
      "/me/prescriptions",
      { method: "GET" },
      { auth: true },
    )
      .then((data) => setResponse(data))
      .catch((requestError) => {
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "Could not load prescriptions.",
        );
      })
      .finally(() => setLoading(false));
  }, [reloadSignal]);

  const consumePrescription = async (id: string) => {
    setActionId(id);
    setError(null);

    try {
      await apiRequest(`/prescriptions/${id}/consume`, { method: "PUT" }, { auth: true });
      toast.success("Prescription marked as consumed.");
      setLoading(true);
      setReloadSignal((n) => n + 1);
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : "Could not consume prescription.";
      setError(message);
      toast.error(message);
    } finally {
      setActionId(null);
    }
  };

  const downloadPdf = async (prescription: Prescription) => {
    setActionId(prescription.id);
    setError(null);

    try {
      const response = await apiRequestRaw(
        `/prescriptions/${prescription.id}/pdf`,
        { method: "GET" },
        { auth: true },
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const contentDisposition = response.headers.get("Content-Disposition") ?? "";
      const match = contentDisposition.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] ?? `prescription-${prescription.code}.pdf`;

      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded.");
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : "Could not download PDF.";
      setError(message);
      toast.error(message);
    } finally {
      setActionId(null);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-medium">My prescriptions</h2>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="text-sm text-zinc-600">Loading prescriptions...</p>
      ) : response && response.data.length > 0 ? (
        <ul className="space-y-3">
          {response.data.map((prescription) => {
            const isActing = actionId === prescription.id;
            return (
              <li key={prescription.id} className="space-y-3 rounded border border-zinc-200 bg-white p-4 text-sm">
                <div>
                  <p className="font-medium">{prescription.code}</p>
                  <p className="text-zinc-600">Status: {prescription.status}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/patient/prescriptions/${prescription.id}`}
                    className="rounded border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100"
                  >
                    View detail
                  </Link>
                  <button
                    type="button"
                    disabled={isActing || prescription.status === "consumed"}
                    onClick={() => consumePrescription(prescription.id)}
                    className="rounded border border-zinc-300 px-3 py-1.5 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isActing ? "Processing..." : "Mark consumed"}
                  </button>
                  <button
                    type="button"
                    disabled={isActing}
                    onClick={() => downloadPdf(prescription)}
                    className="rounded bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-500"
                  >
                    Download PDF
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          No prescriptions found.
        </p>
      )}
    </section>
  );
}
