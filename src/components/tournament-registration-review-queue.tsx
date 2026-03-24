"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TournamentRegistrationRequest } from "@/types/domain";

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-PK", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export default function TournamentRegistrationReviewQueue({
  requests
}: {
  requests: TournamentRegistrationRequest[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  async function review(request: TournamentRegistrationRequest, decision: "approve" | "reject") {
    const confirmed = window.confirm(
      decision === "approve"
        ? `Approve ${request.name} and activate the organizer account as tournament admin?`
        : `Disapprove ${request.name}?`
    );

    if (!confirmed) {
      return;
    }

    setPendingId(request.id);
    setMessage(decision === "approve" ? `Approving ${request.name}...` : `Disapproving ${request.name}...`);

    const response = await fetch(`/api/tournament-registration-requests/${request.id}/${decision}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        decision === "reject"
          ? { rejectionReason: "Registration request rejected after Super Admin review." }
          : {}
      )
    });

    const result = await response.json();
    setPendingId(null);

    if (!result.ok) {
      setMessage(result.error ?? "Unable to process request.");
      return;
    }

    setMessage(
      decision === "approve"
        ? `${request.name} approved. Organizer account is now active as tournament admin.`
        : `${request.name} disapproved.`
    );
    startTransition(() => router.refresh());
  }

  if (requests.length === 0) {
    return <p className="muted">No tournament registration requests are pending.</p>;
  }

  return (
    <div className="registration-review-queue">
      {requests.map((request) => {
        const busy = pendingId === request.id || isPending;

        return (
          <article key={request.id} className="registration-review-card">
            <div className="registration-review-card__head">
              <div>
                <strong>{request.name}</strong>
                <p className="muted">
                  {request.city} · {request.venue}
                </p>
              </div>
              <span className="super-chip super-chip--warning">Pending Review</span>
            </div>

            <div className="registration-review-card__meta">
              <div>
                <span className="registration-review-card__label">Format</span>
                <p>
                  {request.format} · {request.overs} overs · {request.ballType}
                </p>
              </div>
              <div>
                <span className="registration-review-card__label">Teams</span>
                <p>{request.totalTeams} teams</p>
              </div>
              <div>
                <span className="registration-review-card__label">Dates</span>
                <p>
                  {formatDate(request.startDate)} to {formatDate(request.endDate)}
                </p>
              </div>
              <div>
                <span className="registration-review-card__label">Organizer</span>
                <p>
                  {request.organizerName} · {request.organizerPhone}
                </p>
              </div>
              <div>
                <span className="registration-review-card__label">Tournament Admin</span>
                <p>
                  {request.adminName} · {request.adminEmail} · {request.adminPhone}
                </p>
              </div>
              <div>
                <span className="registration-review-card__label">Request ID</span>
                <p>{request.id}</p>
              </div>
            </div>

            <div className="registration-review-card__actions">
              <button type="button" disabled={busy} onClick={() => void review(request, "approve")}>
                {busy && pendingId === request.id ? "Processing..." : "Approve"}
              </button>
              <button type="button" className="alert" disabled={busy} onClick={() => void review(request, "reject")}>
                Disapprove
              </button>
            </div>
          </article>
        );
      })}

      <p className="muted">{message}</p>
    </div>
  );
}
