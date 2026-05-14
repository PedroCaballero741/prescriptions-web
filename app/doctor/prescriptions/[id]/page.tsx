"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RolePageShell } from "@/components/role-page-shell";
import { ApiError, apiRequest, apiRequestRaw } from "@/lib/http-client";
import { Prescription } from "@/lib/prescriptions";

export default function DoctorPrescriptionDetailPage() {
  return (
    <RolePageShell
      title="Prescription detail"
      description="Review prescription information"
      expectedRole="doctor"
    >
      <DoctorPrescriptionDetailContent />
    </RolePageShell>
  );
}

function DoctorPrescriptionDetailContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;

    apiRequest<Prescription>(`/prescriptions/${id}`, { method: "GET" }, { auth: true })
      .then((data) => setPrescription(data))
      .catch((requestError) => {
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "Could not load prescription detail.",
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  const downloadPdf = async () => {
    if (!prescription) return;
    setDownloading(true);
    setError(null);

    try {
      const res = await apiRequestRaw(
        `/prescriptions/${prescription.id}/pdf`,
        { method: "GET" },
        { auth: true },
      );
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const contentDisposition = res.headers.get("Content-Disposition") ?? "";
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
    } catch (downloadError) {
      const message =
        downloadError instanceof ApiError
          ? downloadError.message
          : "Could not download PDF.";
      setError(message);
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-zinc-600">Loading prescription...</p>;
  }

  if (error) {
    return <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  }

  if (!prescription) {
    return <p className="rounded border border-zinc-200 bg-white p-4 text-sm text-zinc-600">Prescription not found.</p>;
  }

  return (
    <section className="space-y-4 rounded border border-zinc-200 bg-white p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-medium">{prescription.code}</p>
          <p className="text-zinc-600">Status: {prescription.status}</p>
        </div>
        <button
          type="button"
          disabled={downloading}
          onClick={downloadPdf}
          className="rounded bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-500"
        >
          {downloading ? "Downloading..." : "Download PDF"}
        </button>
      </div>

      <p>
        <strong>Patient:</strong> {prescription.patient.user.name} ({prescription.patient.user.email})
      </p>
      <p>
        <strong>Created at:</strong> {new Date(prescription.createdAt).toLocaleString()}
      </p>
      {prescription.notes && (
        <p>
          <strong>Notes:</strong> {prescription.notes}
        </p>
      )}

      <div>
        <p className="mb-2 font-medium">Items</p>
        <ul className="space-y-2">
          {prescription.items.map((item) => (
            <li key={item.id} className="rounded border border-zinc-200 p-3">
              <p className="font-medium">{item.name}</p>
              <p className="text-zinc-600">Dosage: {item.dosage || "-"}</p>
              <p className="text-zinc-600">Quantity: {item.quantity ?? "-"}</p>
              <p className="text-zinc-600">Instructions: {item.instructions || "-"}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
