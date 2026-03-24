"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { getTeamAdminWorkspaceDb } from "@/lib/db-store";

type TeamWorkspace = Awaited<ReturnType<typeof getTeamAdminWorkspaceDb>>[number];
type WorkspaceTab = "squad" | "matches" | "tournaments";

function formatDateTime(value?: string) {
  if (!value) return "Time pending";
  return new Date(value).toLocaleString("en-PK", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function buildRoleTag(baseRole: string, leadership: string, specialist: string) {
  return [leadership, specialist, baseRole].filter((value) => value && value !== "NONE").join(" | ");
}

function TeamPerformanceGraph({
  stats
}: {
  stats: TeamWorkspace["stats"];
}) {
  const bars = [
    { label: "Wins", value: stats.wins, tone: "success" },
    { label: "Losses", value: stats.losses, tone: "alert" },
    { label: "Live", value: stats.live, tone: "live" },
    { label: "Upcoming", value: stats.upcoming, tone: "neutral" }
  ] as const;
  const maxValue = Math.max(...bars.map((item) => item.value), 1);

  return (
    <div className="team-console__graph">
      {bars.map((bar) => (
        <article key={bar.label} className={`team-console__graph-card team-console__graph-card--${bar.tone}`}>
          <span>{bar.label}</span>
          <strong>{bar.value}</strong>
          <div className="team-console__graph-track">
            <span style={{ width: `${Math.max((bar.value / maxValue) * 100, 10)}%` }} />
          </div>
        </article>
      ))}
    </div>
  );
}

function RosterBalanceGraph({
  rosterRows
}: {
  rosterRows: TeamWorkspace["roster"];
}) {
  const breakdown = [
    { label: "Available", value: rosterRows.filter((row) => row.availabilityStatus === "AVAILABLE").length },
    { label: "Questionable", value: rosterRows.filter((row) => row.availabilityStatus === "QUESTIONABLE").length },
    { label: "Unavailable", value: rosterRows.filter((row) => row.availabilityStatus === "UNAVAILABLE").length },
    { label: "Subs", value: rosterRows.filter((row) => row.isSubstitute).length }
  ];
  const total = Math.max(rosterRows.length, 1);

  return (
    <div className="team-console__availability">
      {breakdown.map((item) => (
        <article key={item.label} className="team-console__availability-card">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          <div className="team-console__availability-track">
            <span style={{ width: `${Math.max((item.value / total) * 100, 10)}%` }} />
          </div>
        </article>
      ))}
    </div>
  );
}

function TeamWorkspaceCard({ workspace }: { workspace: TeamWorkspace }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchTab = searchParams.get("tab");
  const initialTab: WorkspaceTab = searchTab === "matches" || searchTab === "tournaments" || searchTab === "squad" ? searchTab : "squad";
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const [rosterRows, setRosterRows] = useState(workspace.roster);
  const [rosterMessage, setRosterMessage] = useState("");
  const [challengeMessage, setChallengeMessage] = useState("");
  const [tournamentMessage, setTournamentMessage] = useState("");
  const [counteringRequestId, setCounteringRequestId] = useState<string | null>(null);
  const [savingRoster, setSavingRoster] = useState(false);
  const [sendingChallenge, setSendingChallenge] = useState(false);
  const [applyingTournamentId, setApplyingTournamentId] = useState<string | null>(null);

  const primaryTournamentId = workspace.activeTournaments[0]?.id ?? workspace.roster[0]?.tournamentId ?? workspace.team.tournamentId ?? "";
  const primaryTournamentName = workspace.activeTournaments.find((entry) => entry.id === primaryTournamentId)?.name ?? workspace.roster.find((entry) => entry.tournamentId === primaryTournamentId)?.tournamentName ?? "Tournament context required";
  const sortedFixtures = useMemo(() => [...workspace.fixtures].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()), [workspace.fixtures]);

  useEffect(() => {
    if (searchTab === "matches" || searchTab === "tournaments" || searchTab === "squad") {
      setActiveTab(searchTab);
    }
  }, [searchTab]);

  async function registerAndAddPlayer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: String(formData.get("fullName") || ""), phone: String(formData.get("phone") || "") || undefined })
    });
    const result = await response.json();
    if (!result.ok) {
      setRosterMessage(result.error ?? "Player registration failed.");
      return;
    }
    const roleTag = buildRoleTag(String(formData.get("baseRole") || "Squad Player"), String(formData.get("leadership") || "NONE"), String(formData.get("specialist") || "NONE"));
    setRosterRows((current) => [...current, { id: `draft-${crypto.randomUUID()}`, playerId: result.data.id, playerBcaId: result.data.bcaId, fullName: result.data.fullName, phone: result.data.phone, tournamentId: primaryTournamentId, tournamentName: primaryTournamentName, roleTag, availabilityStatus: String(formData.get("availabilityStatus") || "AVAILABLE"), isSubstitute: formData.get("isSubstitute") === "on", stats: { matches: 0, runs: 0, wickets: 0, strikeRate: 0 } }]);
    setRosterMessage(`Player ${result.data.fullName} added as ${result.data.bcaId}. Save squad to persist.`);
    event.currentTarget.reset();
  }

  async function addExistingPlayer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const bcaId = String(formData.get("bcaId") || "").trim().toUpperCase();
    if (rosterRows.some((entry) => entry.playerBcaId === bcaId)) {
      setRosterMessage(`Player ${bcaId} is already in the roster draft.`);
      return;
    }
    const response = await fetch(`/api/players/${encodeURIComponent(bcaId)}`);
    const result = await response.json();
    if (!result.ok) {
      setRosterMessage(result.error ?? "Player lookup failed.");
      return;
    }
    const roleTag = buildRoleTag(String(formData.get("baseRole") || "Squad Player"), String(formData.get("leadership") || "NONE"), String(formData.get("specialist") || "NONE"));
    setRosterRows((current) => [...current, { id: `draft-${crypto.randomUUID()}`, playerId: result.data.id, playerBcaId: result.data.bcaId, fullName: result.data.fullName, phone: result.data.phone, tournamentId: primaryTournamentId, tournamentName: primaryTournamentName, roleTag, availabilityStatus: String(formData.get("availabilityStatus") || "AVAILABLE"), isSubstitute: formData.get("isSubstitute") === "on", stats: { matches: 0, runs: 0, wickets: 0, strikeRate: 0 } }]);
    setRosterMessage(`Player ${result.data.fullName} moved into the roster draft.`);
    event.currentTarget.reset();
  }

  function removePlayer(bcaId: string) {
    setRosterRows((current) => current.filter((entry) => entry.playerBcaId !== bcaId));
    setRosterMessage(`Player ${bcaId} removed from the draft roster.`);
  }

  async function saveRoster() {
    if (!primaryTournamentId) {
      setRosterMessage("Join a tournament first. Roster save needs a tournament context.");
      return;
    }
    setSavingRoster(true);
    const response = await fetch(`/api/teams/${workspace.team.id}/roster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tournamentId: primaryTournamentId, players: rosterRows.map((entry) => ({ bcaId: entry.playerBcaId, roleTag: entry.roleTag, availabilityStatus: entry.availabilityStatus, isSubstitute: entry.isSubstitute })) })
    });
    const result = await response.json();
    setSavingRoster(false);
    if (!result.ok) {
      setRosterMessage(result.error ?? "Roster save failed.");
      return;
    }
    setRosterMessage(`Roster saved for ${primaryTournamentName}. ${result.data.length} players synced.`);
    router.refresh();
  }
  async function sendChallenge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSendingChallenge(true);
    const formData = new FormData(event.currentTarget);
    const startAt = new Date(`${String(formData.get("startDate") || "")}T${String(formData.get("startTime") || "")}:00`).toISOString();
    const response = await fetch("/api/direct-matches/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requesterTeamId: workspace.team.id, opponentTeamId: String(formData.get("opponentTeamId") || ""), format: String(formData.get("format") || "T20"), venue: String(formData.get("venue") || workspace.team.homeGround || ""), startAt })
    });
    const result = await response.json();
    setSendingChallenge(false);
    if (!result.ok) {
      setChallengeMessage(result.error ?? "Challenge could not be sent.");
      return;
    }
    setChallengeMessage(`Challenge sent for ${formatDateTime(result.data.startAt)}.`);
    event.currentTarget.reset();
    router.refresh();
  }

  async function respondToChallenge(requestId: string, action: "ACCEPT" | "REJECT" | "COUNTER", payload?: { format?: string; venue?: string; startDate?: string; startTime?: string }) {
    const response = await fetch(`/api/direct-matches/${requestId}/respond`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, format: payload?.format || undefined, venue: payload?.venue || undefined, startAt: payload?.startDate && payload?.startTime ? new Date(`${payload.startDate}T${payload.startTime}:00`).toISOString() : undefined })
    });
    const result = await response.json();
    if (!result.ok) {
      setChallengeMessage(result.error ?? "Challenge action failed.");
      return;
    }
    setChallengeMessage(action === "ACCEPT" ? `Challenge accepted. Match ${result.data.match?.id ?? "created"} scheduled.` : action === "REJECT" ? "Challenge rejected." : "Counter offer sent.");
    setCounteringRequestId(null);
    router.refresh();
  }

  async function applyToTournament(tournamentId: string) {
    setApplyingTournamentId(tournamentId);
    const response = await fetch(`/api/tournaments/${tournamentId}/apply-team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: workspace.team.id })
    });
    const result = await response.json();
    setApplyingTournamentId(null);
    if (!result.ok) {
      setTournamentMessage(result.error ?? "Tournament application failed.");
      return;
    }
    setTournamentMessage(`Team submitted. Application status: ${result.data.status}.`);
    router.refresh();
  }

  return (
    <article className="team-workspace__card">
      <div className="team-workspace__hero">
        <div>
          <p className="team-workspace__eyebrow">Team Owner / Captain View</p>
          <h2>{workspace.team.name}</h2>
          <p className="team-workspace__description">{workspace.team.description ?? "Club profile is active. Use this desk to manage roster, fixtures, tournament entry, and direct challenges."}</p>
        </div>
        <div className="team-workspace__chips">
          <span className="chip">Invite Code {workspace.team.inviteCode ?? "Pending"}</span>
          {workspace.team.city ? <span className="chip">{workspace.team.city}</span> : null}
          {workspace.team.homeGround ? <span className="chip">{workspace.team.homeGround}</span> : null}
          {workspace.team.leagueAffiliation ? <span className="chip">{workspace.team.leagueAffiliation}</span> : null}
        </div>
      </div>

      <div className="team-workspace__metric-strip">
        <article className="team-workspace__metric"><span>Played</span><strong>{workspace.stats.matches}</strong></article>
        <article className="team-workspace__metric"><span>Wins</span><strong>{workspace.stats.wins}</strong></article>
        <article className="team-workspace__metric"><span>Roster</span><strong>{rosterRows.length}</strong></article>
        <article className="team-workspace__metric"><span>Challenge Inbox</span><strong>{workspace.challengeCenter.pendingIncoming}</strong></article>
      </div>

      <nav className="team-console__tabs" aria-label="Team workspace tabs">
        <button type="button" className={`team-console__tab${activeTab === "squad" ? " team-console__tab--active" : ""}`} onClick={() => setActiveTab("squad")}>My Squad</button>
        <button type="button" className={`team-console__tab${activeTab === "matches" ? " team-console__tab--active" : ""}`} onClick={() => setActiveTab("matches")}>Match Center{workspace.challengeCenter.pendingIncoming > 0 ? <span className="team-console__badge">{workspace.challengeCenter.pendingIncoming}</span> : null}</button>
        <button type="button" className={`team-console__tab${activeTab === "tournaments" ? " team-console__tab--active" : ""}`} onClick={() => setActiveTab("tournaments")}>Tournaments</button>
      </nav>

      {activeTab === "squad" ? (
        <section className="team-console__panel">
          <div className="team-console__header"><div><p className="team-workspace__eyebrow">My Squad</p><h3>Players, roles, and availability</h3></div><div className="team-console__context"><strong>{primaryTournamentName}</strong><span>{primaryTournamentId ? "Roster context locked" : "Join a tournament to save roster"}</span></div></div>
          <div className="team-console__squad-grid">
            <section className="team-console__subpanel">
              <div className="team-console__subhead"><h4>Current Squad</h4><button type="button" className="button-link button-link--secondary" onClick={() => void saveRoster()} disabled={savingRoster || rosterRows.length === 0}>{savingRoster ? "Saving..." : "Save Squad"}</button></div>
              <TeamPerformanceGraph stats={workspace.stats} />
              <RosterBalanceGraph rosterRows={rosterRows} />
              {rosterRows.length === 0 ? <p className="muted">No players added yet.</p> : <div className="team-console__player-list">{rosterRows.map((entry) => <article key={`${entry.playerBcaId}-${entry.roleTag}`} className="team-console__player-card"><div><strong>{entry.fullName}</strong><p className="muted">{entry.playerBcaId} | {entry.roleTag}</p><p className="muted">Matches {entry.stats.matches} | Runs {entry.stats.runs} | Wickets {entry.stats.wickets} | SR {entry.stats.strikeRate}</p>{entry.phone ? <p className="muted">Phone {entry.phone}</p> : null}</div><div className="team-console__player-actions"><span className="pill">{entry.availabilityStatus}</span>{entry.isSubstitute ? <span className="pill">Substitute</span> : null}{entry.playerId ? <Link href={`/public/players/${entry.playerId}` as Route} className="team-console__link">Profile</Link> : null}<button type="button" className="team-console__remove" onClick={() => removePlayer(entry.playerBcaId)}>Remove</button></div></article>)}</div>}
              <p className="muted">{rosterMessage}</p>
            </section>
            <section className="team-console__subpanel">
              <div className="team-console__subhead"><h4>Add New Player</h4><span className="pill">Name + phone</span></div>
              <form className="team-console__form" onSubmit={(event) => void registerAndAddPlayer(event)}>
                <input name="fullName" className="input" placeholder="Player full name" required />
                <input name="phone" className="input" placeholder="Phone number" />
                <select name="baseRole" className="input" defaultValue="Batsman"><option>Batsman</option><option>Bowler</option><option>All-rounder</option><option>Wicketkeeper</option></select>
                <select name="leadership" className="input" defaultValue="NONE"><option value="NONE">No leadership tag</option><option value="Captain">Captain</option><option value="Vice-Captain">Vice-Captain</option></select>
                <select name="specialist" className="input" defaultValue="NONE"><option value="NONE">No specialist tag</option><option value="Wicketkeeper">Wicket-keeper</option></select>
                <select name="availabilityStatus" className="input" defaultValue="AVAILABLE"><option value="AVAILABLE">Available</option><option value="QUESTIONABLE">Questionable</option><option value="UNAVAILABLE">Unavailable</option></select>
                <label className="team-console__checkbox"><input type="checkbox" name="isSubstitute" /><span>Add as substitute</span></label>
                <button type="submit">Register And Add</button>
              </form>
            </section>
            <section className="team-console__subpanel">
              <div className="team-console__subhead"><h4>Add Existing Player</h4><span className="pill">Use BCA ID</span></div>
              <form className="team-console__form" onSubmit={(event) => void addExistingPlayer(event)}>
                <input name="bcaId" className="input" placeholder="BCA-301" required />
                <select name="baseRole" className="input" defaultValue="Batsman"><option>Batsman</option><option>Bowler</option><option>All-rounder</option><option>Wicketkeeper</option></select>
                <select name="leadership" className="input" defaultValue="NONE"><option value="NONE">No leadership tag</option><option value="Captain">Captain</option><option value="Vice-Captain">Vice-Captain</option></select>
                <select name="specialist" className="input" defaultValue="NONE"><option value="NONE">No specialist tag</option><option value="Wicketkeeper">Wicket-keeper</option></select>
                <select name="availabilityStatus" className="input" defaultValue="AVAILABLE"><option value="AVAILABLE">Available</option><option value="QUESTIONABLE">Questionable</option><option value="UNAVAILABLE">Unavailable</option></select>
                <label className="team-console__checkbox"><input type="checkbox" name="isSubstitute" /><span>Add as substitute</span></label>
                <button type="submit">Add To Draft Squad</button>
              </form>
            </section>
          </div>
        </section>
      ) : null}
      {activeTab === "matches" ? (
        <section className="team-console__panel">
          <div className="team-console__header"><div><p className="team-workspace__eyebrow">Match Center</p><h3>Find opponents and manage direct challenges</h3></div><div className="team-console__context"><strong>{workspace.challengeCenter.pendingIncoming} pending</strong><span>Incoming requests use the red badge</span></div></div>
          <div className="team-console__match-grid">
            <section className="team-console__subpanel">
              <div className="team-console__subhead"><h4>Challenge Center Inbox</h4>{workspace.challengeCenter.pendingIncoming > 0 ? <span className="team-console__alert-dot">{workspace.challengeCenter.pendingIncoming}</span> : null}</div>
              {workspace.challengeCenter.incoming.length === 0 ? <p className="muted">No incoming challenges yet.</p> : <div className="team-console__player-list">{workspace.challengeCenter.incoming.map((request) => <article key={request.id} className="team-console__challenge-card"><div><strong>{request.requesterName}</strong><p className="muted">{request.format} | {request.venue} | {formatDateTime(request.startAt)}</p></div><div className="team-console__challenge-actions"><span className="pill">{request.status}</span>{request.status === "PENDING" ? <><button type="button" onClick={() => void respondToChallenge(request.id, "ACCEPT")}>Accept</button><button type="button" className="secondary" onClick={() => setCounteringRequestId(request.id)}>Counter</button><button type="button" className="alert" onClick={() => void respondToChallenge(request.id, "REJECT")}>Reject</button></> : null}</div>{counteringRequestId === request.id ? <form className="team-console__counter-form" onSubmit={(event) => { event.preventDefault(); const formData = new FormData(event.currentTarget); void respondToChallenge(request.id, "COUNTER", { format: String(formData.get("format") || ""), venue: String(formData.get("venue") || ""), startDate: String(formData.get("startDate") || ""), startTime: String(formData.get("startTime") || "") }); }}><select name="format" className="input" defaultValue={request.format}><option>T20</option><option>T10</option><option>One Day</option></select><input name="venue" className="input" defaultValue={request.venue} /><input name="startDate" className="input" type="date" required /><input name="startTime" className="input" type="time" required /><div className="actions"><button type="submit">Send Counter Offer</button><button type="button" className="secondary" onClick={() => setCounteringRequestId(null)}>Cancel</button></div></form> : null}</article>)}</div>}
            </section>
            <section className="team-console__subpanel">
              <div className="team-console__subhead"><h4>Send Match Request</h4><span className="pill">Friendly match flow</span></div>
              <form className="team-console__form" onSubmit={(event) => void sendChallenge(event)}>
                <select name="opponentTeamId" className="input" required defaultValue=""><option value="" disabled>Find opponent</option>{workspace.teamDirectory.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
                <select name="format" className="input" defaultValue="T20"><option>T20</option><option>T10</option><option>One Day</option></select>
                <input name="venue" className="input" placeholder="Venue" defaultValue={workspace.team.homeGround ?? ""} required />
                <input name="startDate" className="input" type="date" required />
                <input name="startTime" className="input" type="time" required />
                <button type="submit" disabled={sendingChallenge}>{sendingChallenge ? "Sending..." : "Send Match Request"}</button>
              </form>
              <p className="muted">{challengeMessage}</p>
            </section>
            <section className="team-console__subpanel">
              <div className="team-console__subhead"><h4>Sent Challenges</h4><span className="pill">{workspace.challengeCenter.outgoing.length} sent</span></div>
              {workspace.challengeCenter.outgoing.length === 0 ? <p className="muted">No outgoing challenges yet.</p> : <div className="team-console__player-list">{workspace.challengeCenter.outgoing.map((request) => <article key={request.id} className="team-console__challenge-card"><div><strong>{request.opponentName}</strong><p className="muted">{request.format} | {request.venue} | {formatDateTime(request.startAt)}</p></div><div className="team-console__challenge-actions"><span className="pill">{request.status}</span></div></article>)}</div>}
            </section>
            <section className="team-console__subpanel">
              <div className="team-console__subhead"><h4>Schedule Management</h4><span className="pill">{sortedFixtures.length} fixtures</span></div>
              {sortedFixtures.length === 0 ? <p className="muted">No scheduled matches yet.</p> : <div className="team-console__player-list">{sortedFixtures.map((fixture) => <article key={fixture.id} className="team-console__challenge-card"><div><strong>{fixture.opponentName}</strong><p className="muted">{fixture.tournamentName} | {fixture.venue ?? "Venue pending"} | {formatDateTime(fixture.startAt)}</p></div><div className="team-console__challenge-actions"><span className="pill">{fixture.state}</span></div></article>)}</div>}
            </section>
          </div>
        </section>
      ) : null}

      {activeTab === "tournaments" ? (
        <section className="team-console__panel">
          <div className="team-console__header"><div><p className="team-workspace__eyebrow">Tournaments</p><h3>Track active registrations and browse new events</h3></div><div className="team-console__context"><strong>{workspace.activeTournaments.length} active</strong><span>{workspace.openTournaments.length} open for registration</span></div></div>
          <div className="team-console__tournament-grid">
            <section className="team-console__subpanel">
              <div className="team-console__subhead"><h4>Active Tournaments</h4><span className="pill">Registered</span></div>
              {workspace.activeTournaments.length === 0 ? <p className="muted">Your team is not active in any tournament yet.</p> : <div className="team-console__player-list">{workspace.activeTournaments.map((tournament) => <article key={tournament.id} className="team-console__tournament-card"><div><strong>{tournament.name}</strong><p className="muted">{tournament.format ?? "Format pending"} | {tournament.city ?? "City pending"} | Entry Fee {tournament.entryFeeStatus}</p><p className="muted">{tournament.nextMatchLabel ? `Next: ${tournament.nextMatchLabel} on ${formatDateTime(tournament.nextMatchStartAt)}` : "Next match will appear once fixtures are published."}</p></div><div className="team-console__tournament-meta"><span className="pill">Pts {tournament.points}</span>{tournament.position ? <span className="pill">Pos {tournament.position}</span> : null}<span className="pill">Played {tournament.played}</span></div></article>)}</div>}
            </section>
            <section className="team-console__subpanel">
              <div className="team-console__subhead"><h4>Open For Registration</h4><span className="pill">Browse events</span></div>
              {workspace.openTournaments.length === 0 ? <p className="muted">No new public tournaments are open right now.</p> : <div className="team-console__player-list">{workspace.openTournaments.map((tournament) => <article key={tournament.id} className="team-console__tournament-card"><div><strong>{tournament.name}</strong><p className="muted">{tournament.format ?? "Format pending"} | {tournament.venue ?? "Venue pending"} | Entry Fee {tournament.entryFeeStatus}</p><p className="muted">{tournament.startDate ? `Starts ${formatDateTime(tournament.startDate)}` : "Start date pending"}</p></div><div className="team-console__tournament-meta"><button type="button" onClick={() => void applyToTournament(tournament.id)} disabled={applyingTournamentId === tournament.id}>{applyingTournamentId === tournament.id ? "Submitting..." : "Submit Team"}</button></div></article>)}</div>}
            </section>
            <section className="team-console__subpanel">
              <div className="team-console__subhead"><h4>Registration Tracking</h4><span className="pill">{workspace.applications.length} requests</span></div>
              {workspace.applications.length === 0 ? <p className="muted">No tournament applications submitted yet.</p> : <div className="team-console__player-list">{workspace.applications.map((application) => <article key={application.id} className="team-console__challenge-card"><div><strong>{application.tournamentName}</strong><p className="muted">{formatDateTime(application.createdAt)} | Entry Fee {application.entryFeeStatus}</p>{application.rejectionReason ? <p className="muted">{application.rejectionReason}</p> : null}</div><div className="team-console__challenge-actions"><span className="pill">{application.status}</span></div></article>)}</div>}
              <p className="muted">{tournamentMessage}</p>
            </section>
          </div>
        </section>
      ) : null}
    </article>
  );
}

export default function TeamOwnerWorkspaceClient({ workspaces }: { workspaces: TeamWorkspace[] }) {
  if (workspaces.length === 0) {
    return <section className="team-workspace team-workspace--empty"><div className="team-workspace__panel"><div className="team-workspace__section-head"><p className="team-workspace__eyebrow">Owner View</p><h3>No team profile linked yet</h3></div><p className="muted">Create your team profile first, then roster, fixtures, tournament tracking, and match challenges will appear here.</p></div></section>;
  }

  return <section className="team-workspace">{workspaces.map((workspace) => <TeamWorkspaceCard key={workspace.team.id} workspace={workspace} />)}</section>;
}
