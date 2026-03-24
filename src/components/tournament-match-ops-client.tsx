"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { getScorerAssignmentWorkspaceDb } from "@/lib/db-store";

type AssignmentWorkspace = Awaited<ReturnType<typeof getScorerAssignmentWorkspaceDb>>;

function formatStart(value: string) {
  return new Date(value).toLocaleString("en-PK", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export default function TournamentMatchOpsClient({ workspace }: { workspace: AssignmentWorkspace }) {
  const [matches, setMatches] = useState(workspace.matches);
  const [scorers, setScorers] = useState(workspace.scorers);
  const [scorerDirectory, setScorerDirectory] = useState(workspace.scorerDirectory);
  const [pendingMatchId, setPendingMatchId] = useState<string | null>(null);
  const [creatingScorer, setCreatingScorer] = useState(false);
  const [groupMode, setGroupMode] = useState<"tournament" | "venue">("tournament");
  const [pendingScorerActionId, setPendingScorerActionId] = useState<string | null>(null);
  const [passwordDraftByScorerId, setPasswordDraftByScorerId] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("Assign one scorer per match so the on-ground console only opens for authorized operators.");
  const [selectionByMatchId, setSelectionByMatchId] = useState<Record<string, string>>(
    Object.fromEntries(workspace.matches.map((match) => [match.id, match.scorerUserId ?? ""]))
  );
  const [newScorer, setNewScorer] = useState({
    tournamentId: workspace.tournaments[0]?.id ?? "",
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  const scorerOptions = useMemo(
    () =>
      scorers.map((scorer) => ({
        value: scorer.id,
        label: scorer.email ? `${scorer.name} | ${scorer.email}` : scorer.name
      })),
    [scorers]
  );

  const scorerOptionsByTournamentId = useMemo(() => {
    const groups = new Map<string, typeof scorerOptions>();

    for (const scorer of scorers) {
      for (const tournamentId of scorer.tournamentPoolIds) {
        groups.set(tournamentId, [
          ...(groups.get(tournamentId) ?? []),
          {
            value: scorer.id,
            label: scorer.email ? `${scorer.name} | ${scorer.email}` : scorer.name
          }
        ]);
      }
    }

    return groups;
  }, [scorers]);

  const groupedScorers = useMemo(() => {
    const groups = new Map<string, typeof scorerDirectory>();

    for (const scorer of scorerDirectory) {
      const labels =
        groupMode === "tournament"
          ? scorer.tournamentGroups.length > 0
            ? scorer.tournamentGroups
            : ["Unassigned Pool"]
          : scorer.venueGroups.length > 0
            ? scorer.venueGroups
            : ["Unassigned Pool"];

      for (const label of labels) {
        groups.set(label, [...(groups.get(label) ?? []), scorer]);
      }
    }

    return [...groups.entries()]
      .sort((left, right) => left[0].localeCompare(right[0]))
      .map(([label, rows]) => ({
        label,
        scorers: rows.sort((left, right) => left.name.localeCompare(right.name))
      }));
  }, [groupMode, scorerDirectory]);

  async function createScorer() {
    setCreatingScorer(true);
    const response = await fetch("/api/scorers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newScorer)
    });
    const result = await response.json();
    setCreatingScorer(false);

    if (!result.ok) {
      setMessage(result.error ?? "Unable to create scorer account.");
      return;
    }

    setScorers((current) =>
      [...current, { id: result.data.id, name: result.data.name, email: result.data.email, tournamentPoolIds: [newScorer.tournamentId] }]
        .sort((left, right) => left.name.localeCompare(right.name))
    );
    setScorerDirectory((current) =>
      [
        ...current,
        {
          id: result.data.id,
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone,
          status: result.data.status ?? "ACTIVE",
          managedByCurrentAdmin: true,
          assignments: [],
          tournamentGroups: [workspace.tournaments.find((tournament) => tournament.id === newScorer.tournamentId)?.name ?? "Tournament"],
          venueGroups: [workspace.tournaments.find((tournament) => tournament.id === newScorer.tournamentId)?.venue ?? "Venue pending"],
          poolTournaments: [
            {
              id: newScorer.tournamentId,
              name: workspace.tournaments.find((tournament) => tournament.id === newScorer.tournamentId)?.name ?? "Tournament",
              venue: workspace.tournaments.find((tournament) => tournament.id === newScorer.tournamentId)?.venue ?? "Venue pending"
            }
          ]
        }
      ].sort((left, right) => left.name.localeCompare(right.name))
    );
    setNewScorer({
      tournamentId: newScorer.tournamentId,
      name: "",
      email: "",
      phone: "",
      password: ""
    });
    setMessage(`Scorer account created: ${result.data.email}. It is now available inside the selected tournament pool.`);
  }

  async function assignScorer(matchId: string) {
    setPendingMatchId(matchId);
    const response = await fetch(`/api/matches/${matchId}/assignments/scorer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scorerUserId: selectionByMatchId[matchId] || null
      })
    });
    const result = await response.json();
    setPendingMatchId(null);

    if (!result.ok) {
      setMessage(result.error ?? "Unable to save scorer assignment.");
      return;
    }

    setMatches((current) =>
      current.map((match) =>
        match.id === matchId
          ? {
              ...match,
              scorerUserId: result.data?.user?.id,
              scorerName: result.data?.user?.name,
              scorerEmail: result.data?.user?.email
            }
          : match
      )
    );
    setScorerDirectory((current) =>
      current.map((scorer) =>
        scorer.id === result.data?.user?.id
          ? {
              ...scorer,
              assignments: [
                ...current
                  .flatMap((row) => row.id === scorer.id ? row.assignments.filter((assignment) => assignment.matchId !== matchId) : []),
                {
                  matchId,
                  label: matches.find((entry) => entry.id === matchId)?.label ?? matchId,
                  tournamentName: matches.find((entry) => entry.id === matchId)?.tournamentName ?? "Tournament",
                  venue: matches.find((entry) => entry.id === matchId)?.venue ?? "Venue pending",
                  state: matches.find((entry) => entry.id === matchId)?.state ?? "SCHEDULED"
                }
              ],
              tournamentGroups: [
                ...new Set([
                  ...scorer.poolTournaments.map((entry) => entry.name),
                  matches.find((entry) => entry.id === matchId)?.tournamentName ?? "Tournament"
                ])
              ],
              venueGroups: [
                ...new Set([
                  ...scorer.poolTournaments.map((entry) => entry.venue),
                  matches.find((entry) => entry.id === matchId)?.venue ?? "Venue pending"
                ])
              ]
            }
          : {
              ...scorer,
              assignments: scorer.assignments.filter((assignment) => assignment.matchId !== matchId),
              tournamentGroups: [
                ...new Set([
                  ...scorer.poolTournaments.map((entry) => entry.name),
                  ...scorer.assignments
                    .filter((assignment) => assignment.matchId !== matchId)
                    .map((assignment) => assignment.tournamentName)
                ])
              ],
              venueGroups: [
                ...new Set([
                  ...scorer.poolTournaments.map((entry) => entry.venue),
                  ...scorer.assignments
                    .filter((assignment) => assignment.matchId !== matchId)
                    .map((assignment) => assignment.venue)
                ])
              ]
            }
      )
    );
    setMessage(result.data?.user?.name ? `Scorer assigned: ${result.data.user.name}.` : "Scorer assignment cleared.");
  }

  async function updateScorerStatus(scorerId: string, status: "ACTIVE" | "BLOCKED") {
    setPendingScorerActionId(scorerId);
    const response = await fetch(`/api/scorers/${scorerId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const result = await response.json();
    setPendingScorerActionId(null);
    if (!result.ok) {
      setMessage(result.error ?? "Unable to update scorer status.");
      return;
    }

    setScorerDirectory((current) =>
      current.map((scorer) =>
        scorer.id === scorerId
          ? {
              ...scorer,
              status,
              assignments: status === "BLOCKED" ? [] : scorer.assignments,
              tournamentGroups:
                status === "BLOCKED"
                  ? scorer.poolTournaments.length > 0
                    ? [...new Set(scorer.poolTournaments.map((entry) => entry.name))]
                    : ["Unassigned Pool"]
                  : scorer.tournamentGroups,
              venueGroups:
                status === "BLOCKED"
                  ? scorer.poolTournaments.length > 0
                    ? [...new Set(scorer.poolTournaments.map((entry) => entry.venue))]
                    : ["Unassigned Pool"]
                  : scorer.venueGroups
            }
          : scorer
      )
    );
    const restoredPoolIds = scorerDirectory.find((scorer) => scorer.id === scorerId)?.poolTournaments.map((entry) => entry.id) ?? [];
    setScorers((current) =>
      status === "ACTIVE"
        ? [
            ...current.filter((scorer) => scorer.id !== scorerId),
            {
              id: result.data.id,
              name: result.data.name,
              email: result.data.email ?? null,
              tournamentPoolIds: restoredPoolIds
            }
          ].sort((left, right) => left.name.localeCompare(right.name))
        : current.filter((scorer) => scorer.id !== scorerId)
    );
    if (status === "BLOCKED") {
      setMatches((current) =>
        current.map((match) =>
          match.scorerUserId === scorerId
            ? {
                ...match,
                scorerUserId: undefined,
                scorerName: undefined,
                scorerEmail: undefined
              }
            : match
        )
      );
      setSelectionByMatchId((current) =>
        Object.fromEntries(Object.entries(current).map(([matchId, value]) => [matchId, value === scorerId ? "" : value]))
      );
    }
    setMessage(status === "ACTIVE" ? "Scorer reactivated." : "Scorer deactivated and removed from active assignments.");
  }

  async function resetPassword(scorerId: string, password: string) {
    setPendingScorerActionId(scorerId);
    const response = await fetch(`/api/scorers/${scorerId}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const result = await response.json();
    setPendingScorerActionId(null);
    if (!result.ok) {
      setMessage(result.error ?? "Unable to reset scorer password.");
      return;
    }
    setMessage(`Password reset for ${result.data.email ?? result.data.name}.`);
  }

  if (matches.length === 0) {
    return (
      <section className="match-ops">
        <div className="section-heading">
          <p className="section-heading__eyebrow">Match Ops</p>
          <h2>Scorer Assignment Desk</h2>
          <p className="muted">No managed matches are currently available for assignment.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="match-ops">
      <div className="section-heading">
        <p className="section-heading__eyebrow">Match Ops</p>
        <h2>Scorer Assignment Desk</h2>
        <p className="muted">{message}</p>
      </div>
      <div className="match-ops__grid match-ops__grid--setup">
        <article className="match-ops__card">
          <div className="match-ops__head">
            <div>
              <p className="team-workspace__eyebrow">Scorer Accounts</p>
              <h3>Create Scorer</h3>
            </div>
            <span className="pill">{scorers.length} active</span>
          </div>
            <div className="match-ops__assignment">
              <label>
                <span>Tournament pool</span>
                <select
                  className="input"
                  value={newScorer.tournamentId}
                  onChange={(event) => setNewScorer((current) => ({ ...current, tournamentId: event.target.value }))}
                >
                  <option value="">Select tournament</option>
                  {workspace.tournaments.map((tournament) => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name}{tournament.venue ? ` | ${tournament.venue}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Full name</span>
                <input className="input" value={newScorer.name} onChange={(event) => setNewScorer((current) => ({ ...current, name: event.target.value }))} placeholder="Ground scorer name" />
            </label>
            <label>
              <span>Email</span>
              <input className="input" type="email" value={newScorer.email} onChange={(event) => setNewScorer((current) => ({ ...current, email: event.target.value }))} placeholder="scorer@pakscorer.local" />
            </label>
            <label>
              <span>Phone</span>
              <input className="input" value={newScorer.phone} onChange={(event) => setNewScorer((current) => ({ ...current, phone: event.target.value }))} placeholder="03xxxxxxxxx" />
            </label>
            <label>
              <span>Password</span>
              <input className="input" type="password" value={newScorer.password} onChange={(event) => setNewScorer((current) => ({ ...current, password: event.target.value }))} placeholder="Minimum 8 characters" />
            </label>
            <div className="actions">
              <button
                type="button"
                onClick={() => void createScorer()}
                disabled={creatingScorer || !newScorer.tournamentId || !newScorer.name || !newScorer.email || !newScorer.phone || !newScorer.password}
              >
                {creatingScorer ? "Creating..." : "Create Scorer Account"}
              </button>
            </div>
          </div>
        </article>
      </div>
      <div className="match-ops__group-toggle">
        <button type="button" className={groupMode === "tournament" ? "" : "secondary"} onClick={() => setGroupMode("tournament")}>
          Group by Tournament
        </button>
        <button type="button" className={groupMode === "venue" ? "" : "secondary"} onClick={() => setGroupMode("venue")}>
          Group by Venue
        </button>
      </div>
      <div className="match-ops__directory">
        {groupedScorers.map((group) => (
          <section key={group.label} className="match-ops__group">
            <div className="match-ops__group-head">
              <h3>{group.label}</h3>
              <span className="pill">{group.scorers.length} scorers</span>
            </div>
            <div className="match-ops__grid">
              {group.scorers.map((scorer) => (
                <article key={scorer.id} className="match-ops__card">
                  <div className="match-ops__head">
                    <div>
                      <p className="team-workspace__eyebrow">{scorer.email ?? scorer.phone ?? "Scorer account"}</p>
                      <h3>{scorer.name}</h3>
                    </div>
                    <span className={`pill${scorer.status === "BLOCKED" ? " pill--alert" : ""}`}>{scorer.status}</span>
                  </div>
                  <p className="muted">
                    {scorer.assignments.length > 0
                      ? `${scorer.assignments.length} active assignment${scorer.assignments.length === 1 ? "" : "s"}`
                      : "No active match assignment"}
                  </p>
                  <p className="muted">
                    Pool: {scorer.poolTournaments.map((entry) => entry.name).join(", ") || "Unassigned pool"}
                  </p>
                  <div className="match-ops__assignment">
                    <label>
                      <span>Reset password</span>
                      <input
                        className="input"
                        type="password"
                        value={passwordDraftByScorerId[scorer.id] ?? ""}
                        onChange={(event) =>
                          setPasswordDraftByScorerId((current) => ({
                            ...current,
                            [scorer.id]: event.target.value
                          }))
                        }
                        placeholder="New scorer password"
                        disabled={!scorer.managedByCurrentAdmin}
                      />
                    </label>
                    <div className="match-ops__assignment-list">
                      {scorer.assignments.length > 0 ? (
                        scorer.assignments.map((assignment) => (
                          <div key={`${scorer.id}-${assignment.matchId}`} className="match-ops__assignment-chip">
                            <strong>{assignment.label}</strong>
                            <small>
                              {assignment.tournamentName} | {assignment.venue}
                            </small>
                          </div>
                        ))
                      ) : (
                        <p className="muted">This scorer is available in the tournament pool and has no live assignment.</p>
                      )}
                    </div>
                  </div>
                  <div className="actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => void resetPassword(scorer.id, passwordDraftByScorerId[scorer.id] ?? "")}
                      disabled={pendingScorerActionId === scorer.id || !scorer.managedByCurrentAdmin || !(passwordDraftByScorerId[scorer.id] ?? "").trim()}
                    >
                      {pendingScorerActionId === scorer.id ? "Saving..." : "Reset Password"}
                    </button>
                    <button
                      type="button"
                      className={scorer.status === "ACTIVE" ? "alert" : ""}
                      onClick={() => void updateScorerStatus(scorer.id, scorer.status === "ACTIVE" ? "BLOCKED" : "ACTIVE")}
                      disabled={pendingScorerActionId === scorer.id || !scorer.managedByCurrentAdmin}
                    >
                      {scorer.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="match-ops__grid">
        {matches.map((match) => (
          <article key={match.id} className="match-ops__card">
            {(() => {
              const availableScorerOptions = match.tournamentId
                ? scorerOptionsByTournamentId.get(match.tournamentId) ?? []
                : scorerOptions;

              return (
                <>
            <div className="match-ops__head">
              <div>
                <p className="team-workspace__eyebrow">{match.tournamentName}</p>
                <h3>{match.label}</h3>
              </div>
              <span className={`pill${match.state === "LIVE" ? " pill--live" : ""}`}>{match.state}</span>
            </div>
            <p className="muted">
              {match.venue ?? "Venue pending"} | {formatStart(match.startAt)}
            </p>
            <div className="match-ops__assignment">
              <label>
                <span>Assigned scorer</span>
                <select
                  className="input"
                  value={selectionByMatchId[match.id] ?? ""}
                  onChange={(event) =>
                    setSelectionByMatchId((current) => ({
                      ...current,
                      [match.id]: event.target.value
                    }))
                  }
                >
                  <option value="">Unassigned</option>
                  {availableScorerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <p className="muted">
                {match.scorerName ? `Current: ${match.scorerName}${match.scorerEmail ? ` | ${match.scorerEmail}` : ""}` : "No scorer assigned yet."}
              </p>
              {availableScorerOptions.length === 0 ? <p className="muted">No scorers in this tournament pool yet.</p> : null}
            </div>
            <div className="actions">
              <button type="button" onClick={() => void assignScorer(match.id)} disabled={pendingMatchId === match.id}>
                {pendingMatchId === match.id ? "Saving..." : "Save Scorer"}
              </button>
              <Link href="/scorer" className="button-link button-link--secondary">
                Open Scorer Console
              </Link>
            </div>
                </>
              );
            })()}
          </article>
        ))}
      </div>
    </section>
  );
}
