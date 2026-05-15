"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RolePageShell } from "@/components/role-page-shell";
import { Field, Icon } from "@/components/ui";
import { ApiError, apiRequest } from "@/lib/http-client";
import { Prescription } from "@/lib/prescriptions";

type DraftItem = {
  name: string;
  dosage: string;
  quantity: string;
  instructions: string;
};

const EMPTY_ITEM: DraftItem = { name: "", dosage: "", quantity: "", instructions: "" };

export default function DoctorNewPrescriptionPage() {
  return (
    <RolePageShell
      title="New prescription"
      crumbs={["Doctor", "Prescriptions", "New"]}
      expectedRole="doctor"
    >
      <DoctorNewPrescriptionContent />
    </RolePageShell>
  );
}

function DoctorNewPrescriptionContent() {
  const router = useRouter();
  const [refMode, setRefMode] = useState<"id" | "email">("id");
  const [patientId, setPatientId] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [code, setCode] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([{ ...EMPTY_ITEM }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasInvalidItems = useMemo(() => items.some((i) => !i.name.trim()), [items]);

  const updateItem = (index: number, key: keyof DraftItem, value: string) => {
    setItems((cur) => cur.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  const addItem = () => setItems((cur) => [...cur, { ...EMPTY_ITEM }]);
  const removeItem = (index: number) =>
    setItems((cur) => (cur.length === 1 ? cur : cur.filter((_, i) => i !== index)));

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (hasInvalidItems) {
      setError("Each item requires a name.");
      return;
    }
    if (refMode === "id" && !patientId.trim()) {
      setError("Enter the patient system ID.");
      return;
    }
    if (refMode === "email" && !patientEmail.trim()) {
      setError("Enter the patient email.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          name: item.name.trim(),
          dosage: item.dosage.trim() || undefined,
          quantity: item.quantity ? Number(item.quantity) : undefined,
          instructions: item.instructions.trim() || undefined,
        })),
      };
      if (refMode === "id") {
        body.patientId = patientId.trim();
      } else {
        body.patientEmail = patientEmail.trim();
      }
      if (code.trim()) {
        body.code = code.trim();
      }

      const created = await apiRequest<Prescription>(
        "/prescriptions",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
        { auth: true },
      );

      toast.success(`Prescription ${created.code} issued`);
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

  return (
    <div className="stack-lg">
      <div>
        <p className="page-sub">Issue a prescription — the patient receives an alert immediately.</p>
      </div>

      <form className="stack-lg" onSubmit={onSubmit}>
        {/* Patient + code */}
        <div className="card">
          <div className="card-head"><h2 className="card-title">For patient</h2></div>
          <div className="card-body stack" style={{ gap: 16 }}>
            <div className="row-wrap" style={{ gap: 8 }}>
              <span className="tight" style={{ fontSize: 12, color: "var(--ink-3)" }}>Identify by</span>
              <button
                type="button"
                className={"chip" + (refMode === "id" ? " active" : "")}
                onClick={() => setRefMode("id")}
              >
                Patient ID
              </button>
              <button
                type="button"
                className={"chip" + (refMode === "email" ? " active" : "")}
                onClick={() => setRefMode("email")}
              >
                Email
              </button>
            </div>

            <div className="grid-2">
              {refMode === "id" ? (
                <Field label="Patient ID" hint="Patient profile id (from directory or records)" full>
                  <input
                    className="input"
                    value={patientId}
                    placeholder="e.g. clxyz…"
                    onChange={(e) => setPatientId(e.target.value)}
                  />
                </Field>
              ) : (
                <Field label="Patient email" hint="Must match the account email on file" full>
                  <input
                    className="input"
                    type="email"
                    autoComplete="off"
                    value={patientEmail}
                    placeholder="patient@test.com"
                    onChange={(e) => setPatientEmail(e.target.value)}
                  />
                </Field>
              )}

              <Field label="Prescription code" hint="Optional — generated automatically if left blank">
                <input
                  className="input mono"
                  value={code}
                  placeholder="RX-2026-0001 (optional)"
                  onChange={(e) => setCode(e.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Medications */}
        <div className="card">
          <div className="card-head">
            <h2 className="card-title">Medications · {items.length}</h2>
            <button type="button" className="btn btn-sm" onClick={addItem}>
              <Icon name="plus" /> Add medication
            </button>
          </div>
          <div className="card-body stack">
            {items.map((item, index) => (
              <MedicationRow
                key={index}
                item={item}
                index={index}
                canRemove={items.length > 1}
                onChange={(k, v) => updateItem(index, k, v)}
                onRemove={() => removeItem(index)}
              />
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="card">
          <div className="card-head"><h2 className="card-title">Notes for patient</h2></div>
          <div className="card-body">
            <textarea
              className="textarea"
              rows={3}
              placeholder="E.g. take with food, no driving while on this medication…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="alert-error">{error}</div>}

        <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
          <button
            type="button"
            className="btn"
            onClick={() => router.push("/doctor/prescriptions")}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? "Issuing…" : <>Issue prescription <Icon name="arrowRight" /></>}
          </button>
        </div>
      </form>
    </div>
  );
}

function MedicationRow({
  item,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  item: DraftItem;
  index: number;
  canRemove: boolean;
  onChange: (key: keyof DraftItem, value: string) => void;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-lg)",
        padding: 14,
        background: "var(--bg-sunk)",
      }}
    >
      <div className="row" style={{ marginBottom: 10 }}>
        <span
          className="tight"
          style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}
        >
          Item {index + 1}
        </span>
        <div className="spacer" />
        {canRemove && (
          <button type="button" className="btn btn-ghost btn-sm btn-danger" onClick={onRemove}>
            <Icon name="trash" /> Remove
          </button>
        )}
      </div>

      <div className="grid-2" style={{ gap: 12 }}>
        <Field label="Medication" full>
          <input
            className="input"
            required
            value={item.name}
            placeholder="e.g. Amoxicillin"
            onChange={(e) => onChange("name", e.target.value)}
          />
        </Field>

        <Field label="Strength / dosage">
          <input
            className="input"
            value={item.dosage}
            placeholder="e.g. 500 mg"
            onChange={(e) => onChange("dosage", e.target.value)}
          />
        </Field>

        <Field label="Quantity">
          <input
            className="input"
            type="number"
            min={1}
            value={item.quantity}
            placeholder="0"
            onChange={(e) => onChange("quantity", e.target.value)}
          />
        </Field>

        <Field label="Instructions" full>
          <input
            className="input"
            value={item.instructions}
            placeholder="e.g. 1 capsule 3× daily for 7 days"
            onChange={(e) => onChange("instructions", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}
