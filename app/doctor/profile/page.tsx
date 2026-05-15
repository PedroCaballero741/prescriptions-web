"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { RolePageShell } from "@/components/role-page-shell";
import { Field, Icon } from "@/components/ui";
import { ApiError, apiRequest, apiRequestRaw } from "@/lib/http-client";

type DoctorProfile = {
  id: string;
  specialty: string | null;
  signatureText: string | null;
  signatureImage: string | null;
  licenseImage: string | null;
  user: { name: string; email: string };
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export default function DoctorProfilePage() {
  return (
    <RolePageShell title="My Profile" crumbs={["Doctor"]} expectedRole="doctor">
      <DoctorProfileContent />
    </RolePageShell>
  );
}

function DoctorProfileContent() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [specialty, setSpecialty] = useState("");
  const [sigMode, setSigMode] = useState<"text" | "image">("text");
  const [sigText, setSigText] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const sigFileRef = useRef<HTMLInputElement>(null);
  const licenseFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiRequest<DoctorProfile>("/doctor/profile", { method: "GET" }, { auth: true })
      .then((data) => {
        setProfile(data);
        setSpecialty(data.specialty ?? "");
        setSigText(data.signatureText ?? "");
        setSigMode(data.signatureImage ? "image" : "text");
      })
      .catch(() => toast.error("Could not load profile."))
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await apiRequest<DoctorProfile>(
        "/doctor/profile",
        {
          method: "PATCH",
          body: JSON.stringify({ specialty, signatureText: sigText }),
        },
        { auth: true },
      );
      setProfile(updated);
      toast.success("Profile saved.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not save.");
    } finally {
      setSavingProfile(false);
    }
  };

  const uploadFile = async (
    endpoint: string,
    file: File,
    setSaving: (v: boolean) => void,
    onSuccess: (p: DoctorProfile) => void,
  ) => {
    setSaving(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await apiRequestRaw(endpoint, { method: "POST", body: form }, { auth: true });
      const data = await res.json();
      onSuccess(data);
      toast.success("Image uploaded.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setSaving(false);
    }
  };

  const removeImage = async (
    endpoint: string,
    field: "signatureImage" | "licenseImage",
  ) => {
    try {
      await apiRequest(`${endpoint}`, { method: "DELETE" }, { auth: true });
      setProfile((p) => p ? { ...p, [field]: null } : p);
      toast.success("Image removed.");
    } catch {
      toast.error("Could not remove image.");
    }
  };

  if (loading) return <div className="empty"><p>Loading profile…</p></div>;
  if (!profile) return <div className="alert-error">Could not load profile.</div>;

  const sigImageUrl = profile.signatureImage
    ? `${API_BASE}/uploads/doctors/${profile.id}/${profile.signatureImage}`
    : null;
  const licenseImageUrl = profile.licenseImage
    ? `${API_BASE}/uploads/doctors/${profile.id}/${profile.licenseImage}`
    : null;

  return (
    <div className="stack-lg">
      <div>
        <p className="page-sub">
          Manage your professional profile. Your signature and license ID will appear on prescription PDFs.
        </p>
      </div>

      {/* Basic info */}
      <form className="card" onSubmit={saveProfile}>
        <div className="card-head">
          <h2 className="card-title"><Icon name="user" size={15} /> Professional info</h2>
        </div>
        <div className="card-body stack">
          <div className="grid-2">
            <Field label="Name">
              <input className="input" value={profile.user.name} disabled />
            </Field>
            <Field label="Email">
              <input className="input" value={profile.user.email} disabled />
            </Field>
            <Field label="Specialty" hint="Shown on prescription PDFs.">
              <input
                className="input"
                value={specialty}
                placeholder="e.g. Cardiología"
                onChange={(e) => setSpecialty(e.target.value)}
              />
            </Field>
          </div>

          {/* Signature */}
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Signature</div>
            <div className="row" style={{ gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                className={`btn btn-sm ${sigMode === "text" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setSigMode("text")}
              >
                Text
              </button>
              <button
                type="button"
                className={`btn btn-sm ${sigMode === "image" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setSigMode("image")}
              >
                Image
              </button>
            </div>

            {sigMode === "text" ? (
              <Field label="" hint="Written in italic on the PDF when no signature image is uploaded.">
                <input
                  className="input"
                  style={{ fontStyle: "italic" }}
                  value={sigText}
                  placeholder="Dr. Your Name"
                  onChange={(e) => setSigText(e.target.value)}
                />
              </Field>
            ) : (
              <div className="stack" style={{ gap: 8 }}>
                {sigImageUrl ? (
                  <div className="row" style={{ gap: 12, alignItems: "center" }}>
                    <img
                      src={sigImageUrl}
                      alt="Signature"
                      style={{
                        height: 56,
                        maxWidth: 220,
                        objectFit: "contain",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        background: "#fff",
                        padding: 4,
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost btn-danger"
                      onClick={() => removeImage("/doctor/profile/signature", "signatureImage")}
                    >
                      <Icon name="trash" /> Remove
                    </button>
                  </div>
                ) : (
                  <div className="tight">No signature image uploaded.</div>
                )}
                <input
                  ref={sigFileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    uploadFile(
                      "/doctor/profile/signature",
                      file,
                      setUploadingSig,
                      (data) => setProfile((p) => p ? { ...p, signatureImage: data.signatureImage } : p),
                    );
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  disabled={uploadingSig}
                  onClick={() => sigFileRef.current?.click()}
                >
                  <Icon name="upload" /> {uploadingSig ? "Uploading…" : "Upload signature image"}
                </button>
                <p className="tight" style={{ fontSize: 12 }}>JPEG, PNG or WebP — max 2 MB. Use a transparent background PNG for best results.</p>
              </div>
            )}
          </div>
        </div>
        <div className="card-foot" style={{ justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary" disabled={savingProfile}>
            {savingProfile ? "Saving…" : <><Icon name="check" /> Save profile</>}
          </button>
        </div>
      </form>

      {/* License / Colegiatura */}
      <div className="card">
        <div className="card-head">
          <h2 className="card-title"><Icon name="shield" size={15} /> License / Colegiatura</h2>
        </div>
        <div className="card-body stack" style={{ gap: 12 }}>
          <p className="tight">
            Upload a photo or scan of your professional license. It will appear in the bottom-right corner of prescription PDFs.
          </p>

          {licenseImageUrl ? (
            <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
              <img
                src={licenseImageUrl}
                alt="License"
                style={{
                  width: 120,
                  height: 150,
                  objectFit: "cover",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              />
              <div className="stack" style={{ gap: 8 }}>
                <div style={{ fontWeight: 500 }}>License uploaded</div>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost btn-danger"
                  onClick={() => removeImage("/doctor/profile/license", "licenseImage")}
                >
                  <Icon name="trash" /> Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="tight">No license image uploaded.</div>
          )}

          <input
            ref={licenseFileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              uploadFile(
                "/doctor/profile/license",
                file,
                setUploadingLicense,
                (data) => setProfile((p) => p ? { ...p, licenseImage: data.licenseImage } : p),
              );
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            disabled={uploadingLicense}
            onClick={() => licenseFileRef.current?.click()}
          >
            <Icon name="upload" /> {uploadingLicense ? "Uploading…" : "Upload license image"}
          </button>
          <p className="tight" style={{ fontSize: 12 }}>JPEG, PNG or WebP — max 5 MB.</p>
        </div>
      </div>
    </div>
  );
}
