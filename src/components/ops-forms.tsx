"use client";

import { useState } from "react";
import type { FormEvent } from "react";

const roleOptions = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "TOURNAMENT_ADMIN", label: "Tournament Admin" },
  { value: "TEAM_ADMIN", label: "Team Admin" },
  { value: "MATCH_SCORER", label: "Match Scorer" },
  { value: "PUBLIC_VIEWER", label: "Public Viewer" }
] as const;

export function TournamentRequestForm() {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/tournaments/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") || ""),
        regionId: "bela"
      })
    });
    const result = await response.json();
    setMessage(result.ok ? `Requested ${result.data.name}` : result.error);
  }

  return (
    <form className="card" onSubmit={(event) => void onSubmit(event)}>
      <h3>Tournament Request</h3>
      <input name="name" placeholder="Makran League 2026" className="input" />
      <div className="actions" style={{ marginTop: 12 }}>
        <button type="submit">Submit Request</button>
      </div>
      <p className="muted">{message}</p>
    </form>
  );
}

export function PlayerRegistrationForm() {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: String(formData.get("fullName") || "")
      })
    });
    const result = await response.json();
    setMessage(result.ok ? `Registered ${result.data.fullName} as ${result.data.bcaId}` : result.error);
  }

  return (
    <form className="card" onSubmit={(event) => void onSubmit(event)}>
      <h3>Player Verification</h3>
      <input name="fullName" placeholder="Player full name" className="input" />
      <div className="actions" style={{ marginTop: 12 }}>
        <button type="submit">Create BCA ID</button>
      </div>
      <p className="muted">{message}</p>
    </form>
  );
}

export function NewsPostForm() {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/news-feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: String(formData.get("title") || ""),
        body: String(formData.get("body") || "")
      })
    });
    const result = await response.json();
    setMessage(result.ok ? `Published ${result.data.title}` : result.error);
  }

  return (
    <form className="card" onSubmit={(event) => void onSubmit(event)}>
      <h3>News Feed</h3>
      <input name="title" placeholder="Headline" className="input" />
      <textarea name="body" placeholder="Announcement details" className="textarea" rows={4} />
      <div className="actions" style={{ marginTop: 12 }}>
        <button type="submit">Publish News</button>
      </div>
      <p className="muted">{message}</p>
    </form>
  );
}

export function FanVoteForm() {
  const [message, setMessage] = useState("");

  async function vote(playerId: string) {
    const response = await fetch("/api/fan-votes/m-1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId,
        otpVerified: true,
        deviceId: "browser-demo"
      })
    });
    const result = await response.json();
    setMessage(result.ok ? "Vote submitted" : result.error);
  }

  return (
    <div className="card">
      <h3>Man of the Match Vote</h3>
      <div className="actions">
        <button onClick={() => vote("batter-1")}>Vote Batter 1</button>
        <button className="secondary" onClick={() => vote("bowler-1")}>
          Vote Bowler 1
        </button>
      </div>
      <p className="muted">{message}</p>
    </div>
  );
}

export function TossControlForm() {
  const [message, setMessage] = useState("");

  async function submitToss(teamId: string, electedTo: "BAT" | "BOWL") {
    const response = await fetch("/api/matches/m-1/toss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tossWinnerTeamId: teamId, electedTo })
    });
    const result = await response.json();
    setMessage(result.ok ? `Match live. Toss winner ${result.data.tossWinnerTeamId}` : result.error);
  }

  return (
    <div className="card">
      <h3>Toss Module</h3>
      <div className="actions">
        <button onClick={() => submitToss("team-a", "BAT")}>Team A Bat</button>
        <button className="secondary" onClick={() => submitToss("team-b", "BOWL")}>
          Team B Bowl
        </button>
      </div>
      <p className="muted">{message}</p>
    </div>
  );
}

export function CommentaryForm() {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/matches/m-1/commentary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: String(formData.get("text") || "") })
    });
    const result = await response.json();
    setMessage(result.ok ? `Commentary attached to ${result.data.id}` : result.error);
  }

  return (
    <form className="card" onSubmit={(event) => void onSubmit(event)}>
      <h3>Live Commentary</h3>
      <input name="text" placeholder="Big Hit!" className="input" />
      <div className="actions" style={{ marginTop: 12 }}>
        <button type="submit">Publish Commentary</button>
      </div>
      <p className="muted">{message}</p>
    </form>
  );
}

export function TournamentDecisionForm() {
  const [message, setMessage] = useState("");
  const [tournamentId, setTournamentId] = useState("t-1");

  async function submitDecision(decision: "approve" | "reject") {
    const response = await fetch(`/api/tournaments/${tournamentId}/${decision}`, {
      method: "POST"
    });
    const result = await response.json();
    setMessage(result.ok ? `${result.data.name} ${result.data.status}` : result.error);
  }

  return (
    <div className="card">
      <h3>Tournament Approval</h3>
      <input value={tournamentId} onChange={(event) => setTournamentId(event.target.value)} placeholder="t-1" className="input" />
      <div className="actions" style={{ marginTop: 12 }}>
        <button onClick={() => submitDecision("approve")}>
          Approve
        </button>
        <button className="alert" onClick={() => submitDecision("reject")}>
          Reject
        </button>
      </div>
      <p className="muted">{message}</p>
    </div>
  );
}

export function TournamentRegistrationReviewForm() {
  const [message, setMessage] = useState("");
  const [requestId, setRequestId] = useState("");

  async function review(decision: "approve" | "reject") {
    const response = await fetch(`/api/tournament-registration-requests/${requestId}/${decision}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rejectionReason: decision === "reject" ? "Registration request does not meet platform requirements" : undefined
      })
    });
    const result = await response.json();
    if (!result.ok) {
      setMessage(result.error);
      return;
    }

    if (decision === "approve") {
      setMessage(`Approved ${result.data.request.name}. Admin account: ${result.data.adminUser.email}`);
      return;
    }

    setMessage(`Rejected request ${result.data.id}`);
  }

  return (
    <div className="card">
      <h3>Tournament Registration Review</h3>
      <input value={requestId} onChange={(event) => setRequestId(event.target.value)} placeholder="Registration Request ID" className="input" />
      <div className="actions" style={{ marginTop: 12 }}>
        <button onClick={() => review("approve")}>Approve Request</button>
        <button className="alert" onClick={() => review("reject")}>
          Reject Request
        </button>
      </div>
      <p className="muted">{message}</p>
    </div>
  );
}

export function MatchCompletionForm() {
  const [message, setMessage] = useState("");
  const [matchId, setMatchId] = useState("m-1");

  async function completeMatch() {
    const response = await fetch(`/api/matches/${matchId}/complete`, { method: "POST" });
    const result = await response.json();
    setMessage(result.ok ? `Match ${result.data.id} ${result.data.state}` : result.error);
  }

  return (
    <div className="card">
      <h3>Finalize Match</h3>
      <input value={matchId} onChange={(event) => setMatchId(event.target.value)} placeholder="m-1" className="input" />
      <div className="actions">
        <button onClick={completeMatch}>Complete Match</button>
      </div>
      <p className="muted">{message}</p>
    </div>
  );
}

export function CorrectionApprovalForm() {
  const [message, setMessage] = useState("");
  const [matchId, setMatchId] = useState("m-1");
  const [correctionId, setCorrectionId] = useState("");

  async function approveCorrection() {
    const response = await fetch(`/api/matches/${matchId}/corrections`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correctionId })
    });
    const result = await response.json();
    setMessage(result.ok ? `Correction ${result.data.id} approved` : result.error);
  }

  return (
    <div className="card">
      <h3>Approve Score Correction</h3>
      <input value={matchId} onChange={(event) => setMatchId(event.target.value)} placeholder="Match ID" className="input" />
      <input
        value={correctionId}
        onChange={(event) => setCorrectionId(event.target.value)}
        placeholder="Correction ID"
        className="input"
        style={{ marginTop: 8 }}
      />
      <div className="actions" style={{ marginTop: 12 }}>
        <button onClick={approveCorrection}>Approve Correction</button>
      </div>
      <p className="muted">{message}</p>
    </div>
  );
}

export function SquadLockOverrideForm() {
  const [message, setMessage] = useState("");
  const [matchId, setMatchId] = useState("m-1");

  async function lockNow() {
    const response = await fetch(`/api/matches/${matchId}/lock-squad`, {
      method: "POST"
    });
    const result = await response.json();
    setMessage(result.ok ? `Squad lock overridden for ${result.data.id}` : result.error);
  }

  return (
    <div className="card">
      <h3>Squad Lock Override</h3>
      <input value={matchId} onChange={(event) => setMatchId(event.target.value)} placeholder="Match ID" className="input" />
      <div className="actions" style={{ marginTop: 12 }}>
        <button className="alert" onClick={lockNow}>
          Force Lock Squad
        </button>
      </div>
      <p className="muted">{message}</p>
    </div>
  );
}

export function UserRoleUpdateForm() {
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<(typeof roleOptions)[number]["value"]>("TOURNAMENT_ADMIN");

  async function updateRole() {
    const response = await fetch(`/api/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });
    const result = await response.json();
    setMessage(result.ok ? `${result.data.name} is now ${result.data.role}` : result.error);
  }

  return (
    <div className="card">
      <h3>User Role Control</h3>
      <input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="User ID" className="input" />
      <select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="input" style={{ marginTop: 8 }}>
        {roleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="actions" style={{ marginTop: 12 }}>
        <button onClick={updateRole}>Update Role</button>
      </div>
      <p className="muted">{message}</p>
    </div>
  );
}

export function TeamRegistrationForm() {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/teams/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") || ""),
        city: String(formData.get("city") || ""),
        captainName: String(formData.get("captainName") || ""),
        contactPhone: String(formData.get("contactPhone") || ""),
        sponsorName: String(formData.get("sponsorName") || "") || undefined
      })
    });
    const result = await response.json();
    setMessage(result.ok ? `Team created: ${result.data.name}` : result.error);
  }

  return (
    <form className="card" onSubmit={(event) => void onSubmit(event)}>
      <h3>Team Profile</h3>
      <input name="name" placeholder="Team name" className="input" />
      <input name="city" placeholder="City" className="input" style={{ marginTop: 8 }} />
      <input name="captainName" placeholder="Captain name" className="input" style={{ marginTop: 8 }} />
      <input name="contactPhone" placeholder="Contact phone" className="input" style={{ marginTop: 8 }} />
      <input name="sponsorName" placeholder="Sponsor (optional)" className="input" style={{ marginTop: 8 }} />
      <div className="actions" style={{ marginTop: 12 }}>
        <button type="submit">Create Team</button>
      </div>
      <p className="muted">{message}</p>
    </form>
  );
}

export function TeamTournamentApplicationForm() {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const tournamentId = String(formData.get("tournamentId") || "");
    const response = await fetch(`/api/tournaments/${tournamentId}/apply-team`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        teamId: String(formData.get("teamId") || "")
      })
    });
    const result = await response.json();
    setMessage(result.ok ? `Application ${result.data.status}` : result.error);
  }

  return (
    <form className="card" onSubmit={(event) => void onSubmit(event)}>
      <h3>Apply to Tournament</h3>
      <input name="teamId" placeholder="Team ID" className="input" />
      <input name="tournamentId" placeholder="Tournament ID" className="input" style={{ marginTop: 8 }} />
      <div className="actions" style={{ marginTop: 12 }}>
        <button type="submit">Apply</button>
      </div>
      <p className="muted">{message}</p>
    </form>
  );
}

export function TeamApplicationReviewForm() {
  const [message, setMessage] = useState("");
  const [applicationId, setApplicationId] = useState("");

  async function review(status: "approve" | "reject") {
    const response = await fetch(`/api/team-applications/${applicationId}/${status}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rejectionReason: status === "reject" ? "Tournament requirements not met" : undefined
      })
    });
    const result = await response.json();
    setMessage(result.ok ? `Application ${result.data.status}` : result.error);
  }

  return (
    <div className="card">
      <h3>Review Team Application</h3>
      <input value={applicationId} onChange={(event) => setApplicationId(event.target.value)} placeholder="Application ID" className="input" />
      <div className="actions" style={{ marginTop: 12 }}>
        <button onClick={() => review("approve")}>Approve</button>
        <button className="alert" onClick={() => review("reject")}>
          Reject
        </button>
      </div>
      <p className="muted">{message}</p>
    </div>
  );
}

export function DirectMatchRequestForm() {
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/direct-matches/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requesterTeamId: String(formData.get("requesterTeamId") || ""),
        opponentTeamId: String(formData.get("opponentTeamId") || ""),
        format: String(formData.get("format") || ""),
        venue: String(formData.get("venue") || ""),
        startAt: String(formData.get("startAt") || "")
      })
    });
    const result = await response.json();
    setMessage(result.ok ? `Direct match request ${result.data.status}` : result.error);
  }

  return (
    <form className="card" onSubmit={(event) => void onSubmit(event)}>
      <h3>Direct Match Request</h3>
      <input name="requesterTeamId" placeholder="Requester team ID" className="input" />
      <input name="opponentTeamId" placeholder="Opponent team ID" className="input" style={{ marginTop: 8 }} />
      <input name="format" placeholder="T20 / T10" className="input" style={{ marginTop: 8 }} />
      <input name="venue" placeholder="Venue" className="input" style={{ marginTop: 8 }} />
      <input name="startAt" placeholder="2026-03-20T15:00:00.000Z" className="input" style={{ marginTop: 8 }} />
      <div className="actions" style={{ marginTop: 12 }}>
        <button type="submit">Send Challenge</button>
      </div>
      <p className="muted">{message}</p>
    </form>
  );
}
