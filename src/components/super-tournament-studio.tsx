"use client";

import { useMemo, useState } from "react";

const steps = [
  { id: 0, label: "Tournament" },
  { id: 1, label: "Operations" },
  { id: 2, label: "Admin Access" }
] as const;

const initialState = {
  name: "",
  regionId: "bela",
  city: "",
  venue: "",
  format: "T20",
  overs: "20",
  ballType: "Tape Ball",
  tournamentType: "League + Knockout",
  organizerName: "",
  organizerPhone: "",
  sponsorName: "",
  totalTeams: "8",
  startDate: "",
  endDate: "",
  ruleSummary: "",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
  adminPassword: ""
};

type FormState = typeof initialState;

export default function SuperTournamentStudio({ mode = "create" }: { mode?: "create" | "request" }) {
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(
    mode === "create"
      ? "Create an approved tournament and provision its admin account in one controlled flow."
      : "Submit your tournament for review. Super Admin will verify the details before activation."
  );
  const [form, setForm] = useState<FormState>(initialState);

  const summary = useMemo(
    () => [
      { label: "Tournament", value: form.name || "Not set" },
      { label: "Location", value: form.city && form.venue ? `${form.city} · ${form.venue}` : "Not set" },
      { label: "Format", value: `${form.format || "?"} · ${form.overs || "?"} overs` },
      { label: "Admin", value: form.adminEmail || "Not set" }
    ],
    [form]
  );

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(mode === "create" ? "Creating tournament and admin account..." : "Submitting tournament registration request...");

    const response = await fetch(mode === "create" ? "/api/admin/tournaments" : "/api/tournament-registration-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sponsorName: form.sponsorName || undefined
      })
    });

    const result = await response.json();
    setIsSubmitting(false);

    if (!result.ok) {
      setMessage(result.error ?? "Unable to create tournament.");
      return;
    }

    setMessage(
      mode === "create"
        ? `Created ${result.data.tournament.name} and provisioned ${result.data.adminUser.email ?? result.data.adminUser.name} as tournament admin.`
        : `Request submitted for ${result.data.name}. Super Admin will review it before activation.`
    );
    setForm(initialState);
    setActiveStep(0);
  }

  return (
    <div className="super-studio">
      <div className="super-studio__head">
        <div>
          <p className="panel-eyebrow">Tournament Build Studio</p>
          <h3>{mode === "create" ? "Create Tournament + Admin Account" : "Tournament Registration Request"}</h3>
          <p className="muted">
            {mode === "create"
              ? "Super Admin can launch a tournament directly, assign its operating admin, and save the full registration record without a separate request loop."
              : "Tournament organizers can fill the full registration form here. The request will appear in the Super Admin queue for approval."}
          </p>
        </div>
        <div className="super-studio__summary">
          {summary.map((item) => (
            <article key={item.label} className="super-studio__summary-card">
              <p>{item.label}</p>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </div>

      <div className="super-studio__steps">
        {steps.map((step) => (
          <button
            key={step.id}
            type="button"
            className={`super-studio__step ${activeStep === step.id ? "super-studio__step--active" : ""}`}
            onClick={() => setActiveStep(step.id)}
          >
            <span>{step.id + 1}</span>
            {step.label}
          </button>
        ))}
      </div>

      <form className="super-studio__form" onSubmit={(event) => void submitForm(event)}>
        {activeStep === 0 ? (
          <div className="super-studio__grid">
            <label className="field">
              <span>Tournament Name</span>
              <input className="input" value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Lasbela Premier Cup 2026" required />
            </label>
            <label className="field">
              <span>Region</span>
              <input className="input" value={form.regionId} onChange={(event) => updateField("regionId", event.target.value)} placeholder="bela" required />
            </label>
            <label className="field">
              <span>City</span>
              <input className="input" value={form.city} onChange={(event) => updateField("city", event.target.value)} placeholder="Bela" required />
            </label>
            <label className="field">
              <span>Venue</span>
              <input className="input" value={form.venue} onChange={(event) => updateField("venue", event.target.value)} placeholder="BCA Ground" required />
            </label>
            <label className="field">
              <span>Tournament Type</span>
              <input className="input" value={form.tournamentType} onChange={(event) => updateField("tournamentType", event.target.value)} placeholder="League + Knockout" required />
            </label>
            <label className="field">
              <span>Sponsor</span>
              <input className="input" value={form.sponsorName} onChange={(event) => updateField("sponsorName", event.target.value)} placeholder="Optional sponsor name" />
            </label>
          </div>
        ) : null}

        {activeStep === 1 ? (
          <div className="super-studio__grid">
            <label className="field">
              <span>Format</span>
              <input className="input" value={form.format} onChange={(event) => updateField("format", event.target.value)} placeholder="T20" required />
            </label>
            <label className="field">
              <span>Overs</span>
              <input className="input" type="number" value={form.overs} onChange={(event) => updateField("overs", event.target.value)} placeholder="20" required />
            </label>
            <label className="field">
              <span>Ball Type</span>
              <input className="input" value={form.ballType} onChange={(event) => updateField("ballType", event.target.value)} placeholder="Tape Ball / Hard Ball" required />
            </label>
            <label className="field">
              <span>Total Teams</span>
              <input className="input" type="number" value={form.totalTeams} onChange={(event) => updateField("totalTeams", event.target.value)} placeholder="8" required />
            </label>
            <label className="field">
              <span>Start Date</span>
              <input className="input" type="datetime-local" value={form.startDate} onChange={(event) => updateField("startDate", event.target.value)} required />
            </label>
            <label className="field">
              <span>End Date</span>
              <input className="input" type="datetime-local" value={form.endDate} onChange={(event) => updateField("endDate", event.target.value)} required />
            </label>
            <label className="field">
              <span>Organizer Name</span>
              <input className="input" value={form.organizerName} onChange={(event) => updateField("organizerName", event.target.value)} placeholder="Organizer full name" required />
            </label>
            <label className="field">
              <span>Organizer Phone</span>
              <input className="input" value={form.organizerPhone} onChange={(event) => updateField("organizerPhone", event.target.value)} placeholder="03XXXXXXXXX" required />
            </label>
            <label className="field super-studio__field--full">
              <span>Rules / Conditions</span>
              <textarea
                className="textarea"
                rows={5}
                value={form.ruleSummary}
                onChange={(event) => updateField("ruleSummary", event.target.value)}
                placeholder="Powerplay, player eligibility, toss conditions, super over rule, ball replacement rules..."
                required
              />
            </label>
          </div>
        ) : null}

        {activeStep === 2 ? (
          <div className="super-studio__grid">
            <label className="field">
              <span>Tournament Admin Name</span>
              <input className="input" value={form.adminName} onChange={(event) => updateField("adminName", event.target.value)} placeholder="Tournament admin full name" required />
            </label>
            <label className="field">
              <span>Admin Email</span>
              <input className="input" type="email" value={form.adminEmail} onChange={(event) => updateField("adminEmail", event.target.value)} placeholder="admin@pakscorer.com" required />
            </label>
            <label className="field">
              <span>Admin Phone</span>
              <input className="input" value={form.adminPhone} onChange={(event) => updateField("adminPhone", event.target.value)} placeholder="03XXXXXXXXX" required />
            </label>
            <label className="field">
              <span>Admin Password</span>
              <input className="input" type="password" value={form.adminPassword} onChange={(event) => updateField("adminPassword", event.target.value)} placeholder="Minimum 8 characters" required />
            </label>
          </div>
        ) : null}

        <div className="super-studio__actions">
          <button type="button" className="secondary" disabled={activeStep === 0 || isSubmitting} onClick={() => setActiveStep((current) => Math.max(0, current - 1))}>
            Back
          </button>
          {activeStep < steps.length - 1 ? (
            <button type="button" onClick={() => setActiveStep((current) => Math.min(steps.length - 1, current + 1))}>
              Next Step
            </button>
          ) : (
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (mode === "create" ? "Creating..." : "Submitting...") : mode === "create" ? "Create Tournament" : "Submit Request"}
            </button>
          )}
        </div>

        <p className="muted">{message}</p>
      </form>
    </div>
  );
}
