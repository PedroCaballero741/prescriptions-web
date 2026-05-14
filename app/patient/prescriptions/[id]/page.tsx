"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RolePageShell } from "@/components/role-page-shell";
import { ApiError, apiRequest } from "@/lib/http-client";
import { Prescription } from "@/lib/prescriptions";

export default function PatientPrescriptionDetailPage() {
  return (
    <RolePageShell
      title="Prescription detail"
      description="Review your prescription data"
      expectedRole="patient"
    >
      <PatientPrescriptionDetailContent />
    </RolePageShell>
  );
}

function PatientPrescriptionDetailContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    apiRequest<Prescription>(
      `/me/prescriptions/${id}`,
      { method: "GET" },
      { auth: true },
    )
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
      <div>
        <p className="text-lg font-medium">{prescription.code}</p>
        <p className="text-zinc-600">Status: {prescription.status}</p>
      </div>

      <p>
        <strong>Doctor:</strong> {prescription.author.user.name} ({prescription.author.user.email})
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
