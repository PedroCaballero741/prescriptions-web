"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge, Icon, fmtDate } from "@/components/ui";

type PublicItem = {
  id: string;
  name: string;
  dosage: string | null;
  quantity: number | null;
  instructions: string | null;
};

type PublicPrescription = {
  code: string;
  status: "pending" | "consumed";
  issuedAt: string;
  items: PublicItem[];
  doctor: {
    name: string;
    specialty: string | null;
  };
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function PublicRxPage() {
  const params = useParams<{ code: string }>();
  const code = params.code;

  const [rx, setRx] = useState<PublicPrescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    fetch(`${API_BASE}/rx/${encodeURIComponent(code)}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error("Error loading prescription");
        setRx(await res.json());
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="rx-public-wrap">
        <div className="rx-public-card">
          <div className="empty"><p>Loading…</p></div>
        </div>
      </div>
    );
  }

  if (notFound || !rx) {
    return (
      <div className="rx-public-wrap">
        <div className="rx-public-card">
          <div className="rx-pub-header">
            <Icon name="shield" size={22} />
            <span>RxFlow</span>
          </div>
          <div className="empty" style={{ paddingTop: 32 }}>
            <div className="empty-icon"><Icon name="inbox" size={28} /></div>
            <h3>Prescripción no encontrada</h3>
            <p className="tight">El código escaneado no corresponde a ninguna prescripción activa.</p>
          </div>
        </div>
      </div>
    );
  }

  const isConsumed = rx.status === "consumed";

  return (
    <div className="rx-public-wrap">
      <div className="rx-public-card">
        {/* Header */}
        <div className="rx-pub-header">
          <div className="row" style={{ gap: 8, alignItems: "center" }}>
            <Icon name="shield" size={18} />
            <span style={{ fontWeight: 700, letterSpacing: "-0.01em" }}>RxFlow</span>
          </div>
          <span className="tight" style={{ fontSize: 12 }}>Verificación de prescripción</span>
        </div>

        {/* Code + status */}
        <div className="rx-pub-hero">
          <div className="mono" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "0.04em" }}>
            {rx.code}
          </div>
          <Badge status={rx.status} dot />
        </div>

        {isConsumed && (
          <div
            className="alert-error"
            style={{
              background: "color-mix(in srgb, var(--status-consumed) 10%, transparent)",
              borderColor: "color-mix(in srgb, var(--status-consumed) 30%, transparent)",
              color: "var(--status-consumed)",
              marginBottom: 12,
            }}
          >
            Esta prescripción ya fue dispensada y no puede volver a ser procesada.
          </div>
        )}

        <div className="tight" style={{ marginBottom: 20 }}>
          Emitida el {fmtDate(rx.issuedAt)}
        </div>

        {/* Medications */}
        <div className="rx-pub-section">
          <div className="rx-pub-label">Medicamentos</div>
          <div className="stack" style={{ gap: 10 }}>
            {rx.items.map((item, i) => (
              <div key={item.id} className="rx-pub-item">
                <div className="row" style={{ gap: 10, alignItems: "flex-start" }}>
                  <div
                    className="empty-icon"
                    style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0 }}
                  >
                    <Icon name="pill" size={14} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {i + 1}. {item.name}
                    </div>
                    <div className="tight" style={{ marginTop: 2, fontSize: 13 }}>
                      {[
                        item.dosage && `Dosis: ${item.dosage}`,
                        item.quantity && `Cantidad: ${item.quantity}`,
                      ]
                        .filter(Boolean)
                        .join("  ·  ")}
                    </div>
                    {item.instructions && (
                      <div className="tight" style={{ marginTop: 2, fontSize: 12 }}>
                        {item.instructions}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Doctor */}
        <div className="rx-pub-section">
          <div className="rx-pub-label">Médico emisor</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Dr. {rx.doctor.name}</div>
          {rx.doctor.specialty && (
            <div className="tight" style={{ fontSize: 13 }}>{rx.doctor.specialty}</div>
          )}
        </div>

        {/* Footer */}
        <div className="rx-pub-footer">
          <Icon name="shield" size={13} />
          <span>Documento verificado por RxFlow. Solo muestra información mínima necesaria.</span>
        </div>
      </div>
    </div>
  );
}
