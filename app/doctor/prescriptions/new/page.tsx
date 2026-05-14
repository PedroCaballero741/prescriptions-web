"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RolePageShell } from "@/components/role-page-shell";
import { ApiError, apiRequest } from "@/lib/http-client";
import { Prescription } from "@/lib/prescriptions";

type DraftItem = {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
};

const EMPTY_ITEM: DraftItem = {
  name: "",
  dosage: "",
  quantity: "",
  instructions: "",
};

export default function DoctorNewPrescriptionPage() {
  return (
    <RolePageShell
      title="Create prescription"
      description="Fill form and submit to create a prescription"
      expectedRole="doctor"
    >
      <DoctorNewPrescriptionContent />
    </RolePageShell>
  );
}

function DoctorNewPrescriptionContent() {
  const router = useRouter();
  const [patientId, setPatientId] = useState("");
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([{ ...EMPTY_ITEM }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasInvalidItems = useMemo(() => items.some((item) => !item.name.trim()), [items]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (hasInvalidItems) {
      setError("Each item requires a name.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await apiRequest<Prescription>(
        "/prescriptions",
        {
          method: "POST",
          body: JSON.stringify({
            patientId,
            code,
            notes: notes.trim() || undefined,
            items: items.map((item) => ({
              name: item.name.trim(),
              dosage: item.dosage.trim() || undefined,
              quantity: item.quantity ? Number(item.quantity) : undefined,
              instructions: item.instructions.trim() || undefined,
            })),
          }),
        },
        { auth: true },
      );

      toast.success("Prescription created successfully.");
      router.push(`/doctor/prescriptions/${created.id}`);
    } catch (requestError) {
      const message =
        requestError instanceof ApiError
          ? requestError.message
          : "Could not create prescription.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index: number, key: keyof DraftItem, value: string) => {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    );
  };

  const addItem = () => setItems((current) => [...current, { ...EMPTY_ITEM }]);

  const removeItem = (index: number) => {
    setItems((current) => (current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index)));
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded border border-zinc-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Patient ID</span>
          <input
            required
            value={patientId}
            onChange={(event) => setPatientId(event.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2"
          />
        </label>

        <label className="space-y-1 text-sm">
          <span>Code</span>
          <input
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Notes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="w-full rounded border border-zinc-300 px-3 py-2"
          rows={3}
        />
      </label>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Items</h2>
          <button
            type="button"
            onClick={addItem}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
          >
            Add item
          </button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="grid gap-3 rounded border border-zinc-200 p-3 md:grid-cols-2">
            <label className="space-y-1 text-sm md:col-span-2">
              <span>Name</span>
              <input
                required
                value={item.name}
                onChange={(event) => updateItem(index, "name", event.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span>Dosage</span>
              <input
                value={item.dosage}
                onChange={(event) => updateItem(index, "dosage", event.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span>Quantity</span>
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(event) => updateItem(index, "quantity", event.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm md:col-span-2">
              <span>Instructions</span>
              <input
                value={item.instructions}
                onChange={(event) => updateItem(index, "instructions", event.target.value)}
                className="w-full rounded border border-zinc-300 px-3 py-2"
              />
            </label>

            <div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="rounded border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
              >
                Remove item
              </button>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-500"
      >
        {loading ? "Creating..." : "Create prescription"}
      </button>
    </form>
  );
}
