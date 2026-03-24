"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";

export default function PublicParticipationPanel() {
  const router = useRouter();
  const { update } = useSession();
  const [message, setMessage] = useState("Sign in once, then register your team or send a tournament request.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitTeamRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("Registering your team profile...");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/teams/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") || ""),
        city: String(formData.get("city") || ""),
        description: String(formData.get("description") || "") || undefined,
        ownerName: String(formData.get("ownerName") || ""),
        ownerEmail: String(formData.get("ownerEmail") || "") || undefined,
        ownerPhone: String(formData.get("ownerPhone") || ""),
        captainName: String(formData.get("captainName") || ""),
        contactPhone: String(formData.get("contactPhone") || ""),
        managerName: String(formData.get("managerName") || "") || undefined,
        managerPhone: String(formData.get("managerPhone") || "") || undefined,
        homeGround: String(formData.get("homeGround") || "") || undefined,
        leagueAffiliation: String(formData.get("leagueAffiliation") || "") || undefined,
        logoUrl: String(formData.get("logoUrl") || "") || undefined,
        sponsorName: String(formData.get("sponsorName") || "") || undefined
      })
    });

    const result = await response.json();
    setIsSubmitting(false);

    if (!result.ok) {
      setMessage(result.error ?? "Team registration failed.");
      return;
    }

    await update({
      role: result.data.promotedRole,
      regionId: "bela"
    });

    setMessage(`Team ${result.data.team.name} registered. Opening Team Dashboard...`);
    router.push("/team");
    router.refresh();
  }

  return (
    <section className="public-board public-participation">
      <div className="public-section__head">
        <p className="public-section__eyebrow">Get Started</p>
        <h2>After sign in, choose how you want to enter PakScorer</h2>
        <p className="muted">
          Public users can create their team profile first, or continue to tournament request if they are an organizer.
        </p>
      </div>

      <div className="public-participation__grid">
        <form id="register-team" className="public-participation__card" onSubmit={(event) => void submitTeamRegistration(event)}>
          <div className="public-section__head public-section__head--compact">
            <p className="public-section__eyebrow">Option 1</p>
            <h3>Register Team</h3>
            <p className="muted">This creates your team and upgrades your account to Team Admin.</p>
          </div>
          <label className="field">
            <span>Team Name</span>
            <input name="name" className="input" placeholder="Bela Warriors" required />
          </label>
          <label className="field">
            <span>City</span>
            <input name="city" className="input" placeholder="Bela" required />
          </label>
          <label className="field">
            <span>Team Description</span>
            <textarea name="description" className="input" placeholder="Club history, style, or short intro" style={{ minHeight: 88, resize: "vertical" }} />
          </label>
          <label className="field">
            <span>Owner / Club Lead</span>
            <input name="ownerName" className="input" placeholder="Owner full name" required />
          </label>
          <label className="field">
            <span>Owner Email</span>
            <input name="ownerEmail" className="input" placeholder="owner@club.com" />
          </label>
          <label className="field">
            <span>Owner Phone</span>
            <input name="ownerPhone" className="input" placeholder="03XXXXXXXXX" required />
          </label>
          <label className="field">
            <span>Captain Name</span>
            <input name="captainName" className="input" placeholder="Captain full name" required />
          </label>
          <label className="field">
            <span>Captain / Primary Contact Phone</span>
            <input name="contactPhone" className="input" placeholder="03XXXXXXXXX" required />
          </label>
          <label className="field">
            <span>Manager Name</span>
            <input name="managerName" className="input" placeholder="Manager full name" />
          </label>
          <label className="field">
            <span>Manager Phone</span>
            <input name="managerPhone" className="input" placeholder="03XXXXXXXXX" />
          </label>
          <label className="field">
            <span>Home Ground</span>
            <input name="homeGround" className="input" placeholder="Your regular ground" />
          </label>
          <label className="field">
            <span>League Affiliation</span>
            <input name="leagueAffiliation" className="input" placeholder="Bela Domestic League" />
          </label>
          <label className="field">
            <span>Logo URL</span>
            <input name="logoUrl" className="input" placeholder="https://..." />
          </label>
          <label className="field">
            <span>Sponsor</span>
            <input name="sponsorName" className="input" placeholder="Optional sponsor" />
          </label>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating Team..." : "Create Team Profile"}
          </button>
        </form>

        <article id="request-tournament" className="public-participation__card public-participation__card--accent">
          <div className="public-section__head public-section__head--compact">
            <p className="public-section__eyebrow">Option 2</p>
            <h3>Request Tournament</h3>
            <p className="muted">Tournament organizers can fill the request form from this signed-in account and send it to Super Admin for review.</p>
          </div>
          <div className="public-rail-card__chips">
            <span className="public-tag">Organizer form</span>
            <span className="public-tag">Account reuse</span>
            <span className="public-tag">Super Admin approval</span>
          </div>
          <p className="muted">
            Once approved, this same organizer account becomes the tournament admin account and the competition moves into the platform workflow.
          </p>
          <Link href="/register-tournament" className="public-link">
            Open Tournament Request Form
          </Link>
        </article>
      </div>

      <p className="muted">{message}</p>
    </section>
  );
}
