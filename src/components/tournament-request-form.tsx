"use client";

import { useState } from "react";
import type { FormEvent } from "react";

const initialState = {
  name: "",
  city: "",
  venue: "",
  format: "T20",
  overs: "20",
  ballType: "Tape Ball",
  totalTeams: "8",
  startDate: "",
  endDate: ""
};

type FormState = typeof initialState;

const formatDefaults: Record<string, string> = {
  T10: "10",
  T20: "20",
  "One Day": "50"
};

export default function TournamentRequestForm({
  organizerName,
  organizerEmail,
  organizerPhone
}: {
  organizerName: string;
  organizerEmail: string;
  organizerPhone: string;
}) {
  const [form, setForm] = useState<FormState>(initialState);
  const [message, setMessage] = useState("Submit this simple form. Your signed-in organizer account will be sent to Super Admin for review.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleFormatChange(value: string) {
    setForm((current) => ({
      ...current,
      format: value,
      overs: formatDefaults[value] ?? current.overs
    }));
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Submitting request to Super Admin...");

    const response = await fetch("/api/tournament-registration-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const result = await response.json();
    setIsSubmitting(false);

    if (!result.ok) {
      setMessage(result.error ?? "Unable to submit request.");
      return;
    }

    setMessage(`Request submitted successfully. Super Admin will review ${result.data.name}.`);
    setForm(initialState);
  }

  return (
    <form className="simple-request-form" onSubmit={(event) => void submitForm(event)}>
      <div className="simple-request-form__head">
        <div>
          <p className="panel-eyebrow">Tournament Registration</p>
          <h2>Simple Tournament Request Form</h2>
          <p className="muted">Enter the tournament basics. PakScorer will use your signed-in organizer account for approval and future tournament admin access.</p>
        </div>
        <div className="simple-request-form__note">
          <strong>Organizer Account</strong>
          <p>{organizerName}</p>
          <p>{organizerEmail}</p>
          <p>{organizerPhone}</p>
        </div>
      </div>

      <div className="simple-request-form__section">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Tournament Details</p>
          <h3>Competition Information</h3>
        </div>
        <div className="simple-request-form__grid">
          <label className="field">
            <span>Tournament Name</span>
            <input className="input" value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Lasbela Champions Cup" required />
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
            <span>Format</span>
            <select className="input" value={form.format} onChange={(event) => handleFormatChange(event.target.value)}>
              <option value="T10">T10</option>
              <option value="T20">T20</option>
              <option value="One Day">One Day</option>
              <option value="Custom">Custom</option>
            </select>
          </label>
          <label className="field">
            <span>Overs</span>
            <input className="input" type="number" min="1" max="100" value={form.overs} onChange={(event) => updateField("overs", event.target.value)} required />
          </label>
          <label className="field">
            <span>Ball Type</span>
            <select className="input" value={form.ballType} onChange={(event) => updateField("ballType", event.target.value)}>
              <option value="Tape Ball">Tape Ball</option>
              <option value="Hard Ball">Hard Ball</option>
              <option value="Tennis Ball">Tennis Ball</option>
            </select>
          </label>
          <label className="field">
            <span>Total Teams</span>
            <input className="input" type="number" min="2" max="128" value={form.totalTeams} onChange={(event) => updateField("totalTeams", event.target.value)} required />
          </label>
          <label className="field">
            <span>Start Date</span>
            <input className="input" type="datetime-local" value={form.startDate} onChange={(event) => updateField("startDate", event.target.value)} required />
          </label>
          <label className="field">
            <span>End Date</span>
            <input className="input" type="datetime-local" value={form.endDate} onChange={(event) => updateField("endDate", event.target.value)} required />
          </label>
        </div>
      </div>

      <div className="simple-request-form__footer">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Tournament Request"}
        </button>
        <p className="muted">{message}</p>
      </div>
    </form>
  );
}
