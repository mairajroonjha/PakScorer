"use client";

import { useEffect, useMemo, useState } from "react";
import type { getScorerWorkspaceDb } from "@/lib/db-store";

type ScorerWorkspace = Awaited<ReturnType<typeof getScorerWorkspaceDb>>[number];
type FieldState = {
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  wagonZone: string;
  commentaryText: string;
};

type WicketState = {
  outPlayerId: string;
  wicketType:
    | "BOWLED"
    | "CAUGHT"
    | "LBW"
    | "RUN_OUT"
    | "STUMPED"
    | "HIT_WICKET"
    | "OBSTRUCTING_FIELD"
    | "TIMED_OUT"
    | "RETIRED_OUT"
    | "HANDLED_BALL";
  newBatterId: string;
  runs: number;
};

type ExtraState = {
  totalRuns: number;
  runsBat: number;
  commentaryText: string;
};

const runButtons = [0, 1, 2, 3, 4, 6] as const;

function formatStart(value: string) {
  return new Date(value).toLocaleString("en-PK", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function toOversLabel(balls: number, ballsPerOver = 6) {
  return `${Math.floor(balls / ballsPerOver)}.${balls % ballsPerOver}`;
}

function buildInitialFieldState(match: ScorerWorkspace): FieldState {
  const firstBattingTeam =
    match.match.tossWinnerTeamId && match.match.electedTo
      ? match.match.electedTo === "BAT"
        ? match.match.tossWinnerTeamId
        : match.match.tossWinnerTeamId === match.teamA.id
          ? match.teamB.id
          : match.teamA.id
      : match.teamA.id;

  const battingTeam = (match.match.currentInnings ?? 1) === 2 ? (firstBattingTeam === match.teamA.id ? match.teamB.id : match.teamA.id) : firstBattingTeam;
  const bowlingTeam = battingTeam === match.teamA.id ? match.teamB.id : match.teamA.id;
  const battingPlayers = (battingTeam === match.teamA.id ? match.teamA.lineup : match.teamB.lineup).length
    ? battingTeam === match.teamA.id
      ? match.teamA.lineup
      : match.teamB.lineup
    : battingTeam === match.teamA.id
      ? match.teamA.players
      : match.teamB.players;
  const bowlingPlayers = (bowlingTeam === match.teamA.id ? match.teamA.lineup : match.teamB.lineup).length
    ? bowlingTeam === match.teamA.id
      ? match.teamA.lineup
      : match.teamB.lineup
    : bowlingTeam === match.teamA.id
      ? match.teamA.players
      : match.teamB.players;

  return {
    strikerId: battingPlayers[0]?.playerId ?? "",
    nonStrikerId: battingPlayers[1]?.playerId ?? battingPlayers[0]?.playerId ?? "",
    bowlerId: bowlingPlayers[0]?.playerId ?? "",
    wagonZone: "",
    commentaryText: ""
  };
}

function cloneNextBallContext(match: ScorerWorkspace, balls: number) {
  const ballsPerOver = match.match.ballsPerOver ?? 6;
  return {
    inningsNumber: match.match.currentInnings ?? 1,
    legalBallNumber: balls + 1,
    over: Math.floor(balls / ballsPerOver),
    ball: (balls % ballsPerOver) + 1
  };
}

function replaceMatch(current: ScorerWorkspace[], nextMatch: ScorerWorkspace) {
  return current.map((entry) => (entry.match.id === nextMatch.match.id ? nextMatch : entry));
}

export default function ScorerConsoleClient({ assignments }: { assignments: ScorerWorkspace[] }) {
  const [matches, setMatches] = useState(assignments);
  const [activeMatchId, setActiveMatchId] = useState(assignments.find((entry) => entry.canStartScoring)?.match.id ?? assignments[0]?.match.id ?? "");
  const activeMatch = useMemo(() => matches.find((entry) => entry.match.id === activeMatchId) ?? matches[0], [activeMatchId, matches]);
  const [fieldState, setFieldState] = useState<FieldState>(activeMatch ? buildInitialFieldState(activeMatch) : { strikerId: "", nonStrikerId: "", bowlerId: "", wagonZone: "", commentaryText: "" });
  const [lineupDraft, setLineupDraft] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState("Select an assigned match and start scoring from the ground.");
  const [tossWinnerTeamId, setTossWinnerTeamId] = useState(activeMatch?.match.tossWinnerTeamId ?? activeMatch?.teamA.id ?? "");
  const [electedTo, setElectedTo] = useState<"BAT" | "BOWL">(activeMatch?.match.electedTo ?? "BAT");
  const [submittingToss, setSubmittingToss] = useState(false);
  const [submittingLineupTeamId, setSubmittingLineupTeamId] = useState<string | null>(null);
  const [submittingBall, setSubmittingBall] = useState(false);
  const [startingSecondInnings, setStartingSecondInnings] = useState(false);
  const [undoingBall, setUndoingBall] = useState(false);
  const [showWicketPopup, setShowWicketPopup] = useState(false);
  const [extraMode, setExtraMode] = useState<"WD" | "NB" | null>(null);
  const [needsBowlerChange, setNeedsBowlerChange] = useState(false);
  const [targetRunsInput, setTargetRunsInput] = useState(activeMatch?.match.targetRuns ?? ((activeMatch?.score.runs ?? 0) + 1));
  const [undoReason, setUndoReason] = useState("Operator corrected the last recorded ball.");
  const [wicketState, setWicketState] = useState<WicketState>({
    outPlayerId: "",
    wicketType: "CAUGHT",
    newBatterId: "",
    runs: 0
  });
  const [extraState, setExtraState] = useState<ExtraState>({
    totalRuns: 1,
    runsBat: 0,
    commentaryText: ""
  });

  useEffect(() => {
    if (!activeMatch) {
      return;
    }
    setFieldState(buildInitialFieldState(activeMatch));
    setTossWinnerTeamId(activeMatch.match.tossWinnerTeamId ?? activeMatch.teamA.id);
    setElectedTo(activeMatch.match.electedTo ?? "BAT");
    setTargetRunsInput(activeMatch.match.targetRuns ?? (activeMatch.score.runs + 1));
    setWicketState((current) => ({
      ...current,
      outPlayerId: buildInitialFieldState(activeMatch).strikerId,
      newBatterId: activeMatch.teamA.players[2]?.playerId ?? activeMatch.teamB.players[2]?.playerId ?? ""
    }));
  }, [activeMatch]);

  const currentLineups = activeMatch
    ? {
        [activeMatch.teamA.id]: lineupDraft[activeMatch.teamA.id] ?? activeMatch.teamA.lineup.map((player) => player.playerId),
        [activeMatch.teamB.id]: lineupDraft[activeMatch.teamB.id] ?? activeMatch.teamB.lineup.map((player) => player.playerId)
      }
    : {};

  function toggleLineupPlayer(teamId: string, playerId: string) {
    if (!activeMatch) {
      return;
    }
    const available = activeMatch.teamA.id === teamId ? activeMatch.teamA.players : activeMatch.teamB.players;
    const requiredCount = available.length >= 11 ? 11 : available.length;
    setLineupDraft((current) => {
      const existing = current[teamId] ?? (teamId === activeMatch.teamA.id ? activeMatch.teamA.lineup.map((player) => player.playerId) : activeMatch.teamB.lineup.map((player) => player.playerId));
      const hasPlayer = existing.includes(playerId);
      if (hasPlayer) {
        return {
          ...current,
          [teamId]: existing.filter((entry) => entry !== playerId)
        };
      }
      if (existing.length >= requiredCount) {
        return current;
      }
      return {
        ...current,
        [teamId]: [...existing, playerId]
      };
    });
  }

  async function submitLineup(teamId: string) {
    if (!activeMatch) {
      return;
    }
    const playerIds = currentLineups[teamId] ?? [];
    setSubmittingLineupTeamId(teamId);
    const response = await fetch(`/api/matches/${activeMatch.match.id}/lineups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, playerIds })
    });
    const result = await response.json();
    setSubmittingLineupTeamId(null);
    if (!result.ok) {
      setMessage(result.error ?? "Unable to confirm the lineup.");
      return;
    }

    const nextMatch: ScorerWorkspace = {
      ...activeMatch,
      hasLineups:
        (teamId === activeMatch.teamA.id ? true : activeMatch.teamA.lineupConfirmed) &&
        (teamId === activeMatch.teamB.id ? true : activeMatch.teamB.lineupConfirmed),
      teamA:
        teamId === activeMatch.teamA.id
          ? {
              ...activeMatch.teamA,
              lineupConfirmed: true,
              lineup: result.data.map((entry: { playerId: string; roleTag?: string }) => {
                const player = activeMatch.teamA.players.find((candidate) => candidate.playerId === entry.playerId);
                return {
                  playerId: entry.playerId,
                  name: player?.name ?? entry.playerId,
                  roleTag: entry.roleTag ?? player?.roleTag ?? "Playing XI"
                };
              })
            }
          : activeMatch.teamA,
      teamB:
        teamId === activeMatch.teamB.id
          ? {
              ...activeMatch.teamB,
              lineupConfirmed: true,
              lineup: result.data.map((entry: { playerId: string; roleTag?: string }) => {
                const player = activeMatch.teamB.players.find((candidate) => candidate.playerId === entry.playerId);
                return {
                  playerId: entry.playerId,
                  name: player?.name ?? entry.playerId,
                  roleTag: entry.roleTag ?? player?.roleTag ?? "Playing XI"
                };
              })
            }
          : activeMatch.teamB
    };
    setMatches((current) => replaceMatch(current, nextMatch));
    setMessage("Playing XI confirmed for the selected team.");
  }

  async function submitToss() {
    if (!activeMatch) {
      return;
    }
    setSubmittingToss(true);
    const response = await fetch(`/api/matches/${activeMatch.match.id}/toss`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tossWinnerTeamId, electedTo })
    });
    const result = await response.json();
    setSubmittingToss(false);
    if (!result.ok) {
      setMessage(result.error ?? "Toss update failed.");
      return;
    }

    const nextMatch = {
      ...activeMatch,
      match: result.data,
      needsToss: false
    };
    setMatches((current) => replaceMatch(current, nextMatch));
    setFieldState(buildInitialFieldState(nextMatch));
    setMessage("Toss updated. Public users can now see the toss decision.");
  }

  async function publishBall(payload: {
    runs: number;
    isWicket: boolean;
    extraType?: "WD" | "NB";
    runsBat?: number;
    extras?: number;
    wicketType?: WicketState["wicketType"];
    outPlayerId?: string;
    newBatterId?: string;
    commentaryText?: string;
  }) {
    if (!activeMatch) {
      return;
    }
    setSubmittingBall(true);
    const response = await fetch(`/api/matches/${activeMatch.match.id}/balls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inningsId: undefined,
        over: activeMatch.nextBallContext.over,
        ball: activeMatch.nextBallContext.ball,
        legalBallNumber: activeMatch.nextBallContext.legalBallNumber,
        strikerId: fieldState.strikerId,
        nonStrikerId: fieldState.nonStrikerId || undefined,
        bowlerId: fieldState.bowlerId,
        runs: payload.runs,
        runsBat: payload.runsBat,
        extras: payload.extras,
        isWicket: payload.isWicket,
        extraType: payload.extraType,
        wicketType: payload.wicketType,
        outPlayerId: payload.outPlayerId,
        newBatterId: payload.newBatterId,
        wagonZone: fieldState.wagonZone || undefined,
        commentaryText: payload.commentaryText ?? (fieldState.commentaryText || undefined)
      })
    });
    const result = await response.json();
    setSubmittingBall(false);
    if (!result.ok) {
      setMessage(result.error ?? "Ball update failed.");
      return;
    }

    const score = result.data.score as { runs: number; wickets: number; balls: number };
    const legalDelivery = !payload.extraType || (payload.extraType !== "WD" && payload.extraType !== "NB");
    const ballsPerOver = activeMatch.match.ballsPerOver ?? 6;
    const nextContext = cloneNextBallContext(activeMatch, score.balls);
    const overComplete = legalDelivery && score.balls > 0 && score.balls % ballsPerOver === 0;
    const nextEvents = [
      {
        id: result.data.event.id,
        overBall: `${result.data.event.over}.${result.data.event.ball}`,
        summary: result.data.event.commentaryText ?? `${payload.runs} added`,
        strikerName: activeMatch.teamA.players.find((player) => player.playerId === fieldState.strikerId)?.name ?? fieldState.strikerId,
        bowlerName: activeMatch.teamB.players.find((player) => player.playerId === fieldState.bowlerId)?.name ?? fieldState.bowlerId
      },
      ...activeMatch.recentEvents
    ].slice(0, 8);

    const nextMatch = {
      ...activeMatch,
      score,
      scoreText: `${score.runs}-${score.wickets} (${toOversLabel(score.balls, ballsPerOver)})`,
      recentEvents: nextEvents,
      nextBallContext: nextContext
    };
    setMatches((current) => replaceMatch(current, nextMatch));

    if (payload.isWicket && payload.newBatterId) {
      setFieldState((current) => ({
        ...current,
        strikerId: payload.newBatterId ?? current.strikerId,
        commentaryText: ""
      }));
    } else {
      setFieldState((current) => ({
        ...current,
        commentaryText: ""
      }));
    }

    setNeedsBowlerChange(overComplete);
    setMessage(overComplete ? "Over complete. Select the next bowler before the next legal delivery." : "Ball recorded successfully.");
  }

  async function publishQuickRun(runs: number) {
    await publishBall({ runs, isWicket: false, commentaryText: fieldState.commentaryText || undefined });
  }

  async function publishExtra(extraType: "WD" | "NB") {
    await publishBall({
      runs: extraState.totalRuns,
      runsBat: extraType === "NB" ? extraState.runsBat : 0,
      extras: extraType === "NB" ? Math.max(1, extraState.totalRuns - extraState.runsBat) : extraState.totalRuns,
      isWicket: false,
      extraType,
      commentaryText: extraState.commentaryText || `${extraType === "WD" ? "Wide" : "No ball"} signalled`
    });
    setExtraMode(null);
    setExtraState({ totalRuns: 1, runsBat: 0, commentaryText: "" });
  }

  async function publishWicket() {
    await publishBall({
      runs: wicketState.runs,
      isWicket: true,
      wicketType: wicketState.wicketType,
      outPlayerId: wicketState.outPlayerId,
      newBatterId: wicketState.newBatterId || undefined,
      commentaryText: `${wicketState.wicketType.replace(/_/g, " ")}. New batter incoming.`
    });
    setShowWicketPopup(false);
  }

  async function startSecondInnings() {
    if (!activeMatch) {
      return;
    }
    setStartingSecondInnings(true);
    const response = await fetch(`/api/matches/${activeMatch.match.id}/innings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetRuns: targetRunsInput
      })
    });
    const result = await response.json();
    setStartingSecondInnings(false);
    if (!result.ok) {
      setMessage(result.error ?? "Unable to start second innings.");
      return;
    }

    const nextMatch: ScorerWorkspace = {
      ...activeMatch,
      match: result.data.match,
      score: result.data.score,
      scoreText: `${result.data.score.runs}-${result.data.score.wickets} (${toOversLabel(result.data.score.balls, activeMatch.match.ballsPerOver ?? 6)})`,
      recentEvents: [],
      nextBallContext: cloneNextBallContext({ ...activeMatch, match: result.data.match }, result.data.score.balls)
    };
    setMatches((current) => replaceMatch(current, nextMatch));
    setFieldState(buildInitialFieldState(nextMatch));
    setNeedsBowlerChange(false);
    setMessage(`Second innings is live. Chase target: ${result.data.targetRuns}.`);
  }

  async function undoLastBall() {
    if (!activeMatch) {
      return;
    }
    setUndoingBall(true);
    const response = await fetch(`/api/matches/${activeMatch.match.id}/undo-last-ball`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reason: undoReason
      })
    });
    const result = await response.json();
    setUndoingBall(false);
    if (!result.ok) {
      setMessage(result.error ?? "Unable to undo the last ball.");
      return;
    }

    const score = result.data.score as { runs: number; wickets: number; balls: number };
    const ballsPerOver = activeMatch.match.ballsPerOver ?? 6;
    const nextMatch: ScorerWorkspace = {
      ...activeMatch,
      score,
      scoreText: `${score.runs}-${score.wickets} (${toOversLabel(score.balls, ballsPerOver)})`,
      recentEvents: activeMatch.recentEvents.filter((event) => event.id !== result.data.undoneEventId),
      nextBallContext: cloneNextBallContext(activeMatch, score.balls)
    };
    setMatches((current) => replaceMatch(current, nextMatch));
    setNeedsBowlerChange(false);
    setMessage("Last ball removed from the sheet. Reconfirm striker, non-striker, and bowler before continuing.");
  }

  if (!activeMatch) {
    return (
      <section className="scorer-console">
        <article className="scorer-console__empty">
          <p className="team-workspace__eyebrow">Scorer Console</p>
          <h3>No scorer assignment found</h3>
          <p className="muted">The tournament organizer must assign you as scorer before the on-ground console unlocks.</p>
        </article>
      </section>
    );
  }

  return (
    <section className="scorer-console">
      <div className="scorer-console__assignment-grid">
        {matches.map((match) => (
          <article key={match.match.id} className={`scorer-console__assignment-card${match.match.id === activeMatchId ? " scorer-console__assignment-card--active" : ""}`}>
            <div className="scorer-console__assignment-head">
              <div>
                <p className="team-workspace__eyebrow">{match.tournamentName}</p>
                <h3>{match.label}</h3>
              </div>
              <span className={`pill${match.match.state === "LIVE" ? " pill--live" : ""}`}>{match.match.state}</span>
            </div>
            <p className="muted">
              {match.match.venue ?? "Venue pending"} | {formatStart(match.match.startAt)}
            </p>
            <div className="scorer-console__assignment-meta">
              <strong>{match.scoreText}</strong>
              <span>{match.match.tossWinnerTeamId ? "Toss confirmed" : "Toss pending"}</span>
            </div>
            <div className="actions">
              <button type="button" onClick={() => setActiveMatchId(match.match.id)} disabled={!match.canStartScoring}>
                {match.match.id === activeMatchId ? "Scoring Live" : "Start Scoring"}
              </button>
            </div>
          </article>
        ))}
      </div>

      <article className="scorer-console__stage">
        <div className="scorer-console__stage-head">
          <div>
            <p className="team-workspace__eyebrow">On-Ground Console</p>
            <h2>{activeMatch.label}</h2>
            <p className="muted">
              {activeMatch.tournamentName} | {activeMatch.match.venue ?? "Venue pending"} | Next ball {activeMatch.nextBallContext.over}.{activeMatch.nextBallContext.ball}
            </p>
          </div>
          <div className="scorer-console__scoreline">
            <strong>{activeMatch.scoreText}</strong>
            <span>{activeMatch.match.tossWinnerTeamId ? `${activeMatch.match.tossWinnerTeamId} opted to ${activeMatch.match.electedTo?.toLowerCase()}` : "Set toss and lineup before first ball"}</span>
          </div>
        </div>

        <div className="scorer-console__checklist">
          <span className={`pill${activeMatch.needsToss ? " pill--alert" : ""}`}>{activeMatch.needsToss ? "Toss Pending" : "Toss Ready"}</span>
          <span className={`pill${activeMatch.hasLineups ? "" : " pill--alert"}`}>{activeMatch.hasLineups ? "Playing XI Confirmed" : "Playing XI Pending"}</span>
          <span className={`pill${needsBowlerChange ? " pill--alert" : ""}`}>{needsBowlerChange ? "Change Bowler" : "Bowler Set"}</span>
          <span className="pill">Innings {activeMatch.match.currentInnings ?? 1}</span>
        </div>

        <p className="muted">{message}</p>

        <div className="scorer-console__grid">
          <section className="scorer-console__panel">
            <div className="scorer-console__panel-head">
              <h3>Pre-Match Setup</h3>
              <span className="pill">Step 1</span>
            </div>
            <div className="scorer-console__form">
              <label>
                <span>Toss Winner</span>
                <select className="input" value={tossWinnerTeamId} onChange={(event) => setTossWinnerTeamId(event.target.value)}>
                  <option value={activeMatch.teamA.id}>{activeMatch.teamA.name}</option>
                  <option value={activeMatch.teamB.id}>{activeMatch.teamB.name}</option>
                </select>
              </label>
              <label>
                <span>Decision</span>
                <select className="input" value={electedTo} onChange={(event) => setElectedTo(event.target.value as "BAT" | "BOWL")}>
                  <option value="BAT">Elected to Bat</option>
                  <option value="BOWL">Elected to Bowl</option>
                </select>
              </label>
              <button type="button" onClick={() => void submitToss()} disabled={submittingToss}>
                {submittingToss ? "Updating..." : "Update Toss"}
              </button>
            </div>

            <div className="scorer-console__lineup-grid">
              {[activeMatch.teamA, activeMatch.teamB].map((team) => {
                const selected = currentLineups[team.id] ?? [];
                const requiredCount = team.players.length >= 11 ? 11 : team.players.length;
                return (
                  <article key={team.id} className="scorer-console__lineup-card">
                    <div className="scorer-console__panel-head">
                      <h4>{team.name}</h4>
                      <span className="pill">
                        {selected.length}/{requiredCount}
                      </span>
                    </div>
                    <div className="scorer-console__lineup-list">
                      {team.players.map((player) => (
                        <label key={player.playerId} className="scorer-console__lineup-player">
                          <input
                            type="checkbox"
                            checked={selected.includes(player.playerId)}
                            onChange={() => toggleLineupPlayer(team.id, player.playerId)}
                          />
                          <span>
                            <strong>{player.name}</strong>
                            <small>{player.roleTag}</small>
                          </span>
                        </label>
                      ))}
                    </div>
                    <button type="button" onClick={() => void submitLineup(team.id)} disabled={submittingLineupTeamId === team.id}>
                      {submittingLineupTeamId === team.id ? "Saving..." : "Submit Playing XI"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="scorer-console__panel">
            <div className="scorer-console__panel-head">
              <h3>Innings Control</h3>
              <span className="pill">Step 1B</span>
            </div>
            <div className="scorer-console__form">
              <label>
                <span>Second innings target</span>
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={999}
                  value={targetRunsInput}
                  onChange={(event) => setTargetRunsInput(Number(event.target.value))}
                  disabled={(activeMatch.match.currentInnings ?? 1) >= 2}
                />
              </label>
              <button
                type="button"
                onClick={() => void startSecondInnings()}
                disabled={startingSecondInnings || (activeMatch.match.currentInnings ?? 1) >= 2}
              >
                {startingSecondInnings ? "Switching..." : (activeMatch.match.currentInnings ?? 1) >= 2 ? "Chase Live" : "Start 2nd Innings"}
              </button>
              <p className="muted">
                {(activeMatch.match.currentInnings ?? 1) >= 2
                  ? `Target locked at ${activeMatch.match.targetRuns ?? targetRunsInput}.`
                  : `Default target is first innings score plus one. Adjust only if penalties or revised conditions apply.`}
              </p>
            </div>

            <div className="scorer-console__form scorer-console__form--compact">
              <label>
                <span>Undo reason</span>
                <input
                  className="input"
                  value={undoReason}
                  onChange={(event) => setUndoReason(event.target.value)}
                  placeholder="Wrong run, wrong wicket, or wrong extra type."
                />
              </label>
              <button type="button" className="secondary" onClick={() => void undoLastBall()} disabled={undoingBall || activeMatch.recentEvents.length === 0}>
                {undoingBall ? "Undoing..." : "Undo Last Ball"}
              </button>
            </div>
          </section>

          <section className="scorer-console__panel">
            <div className="scorer-console__panel-head">
              <h3>Digital Score Sheet</h3>
              <span className="pill">Step 2</span>
            </div>

            <div className="scorer-console__field-grid">
              <label>
                <span>Striker</span>
                <select className="input" value={fieldState.strikerId} onChange={(event) => setFieldState((current) => ({ ...current, strikerId: event.target.value }))}>
                  {[...activeMatch.teamA.players, ...activeMatch.teamB.players].map((player) => (
                    <option key={player.playerId} value={player.playerId}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Non-Striker</span>
                <select className="input" value={fieldState.nonStrikerId} onChange={(event) => setFieldState((current) => ({ ...current, nonStrikerId: event.target.value }))}>
                  {[...activeMatch.teamA.players, ...activeMatch.teamB.players].map((player) => (
                    <option key={player.playerId} value={player.playerId}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Bowler</span>
                <select className="input" value={fieldState.bowlerId} onChange={(event) => { setFieldState((current) => ({ ...current, bowlerId: event.target.value })); setNeedsBowlerChange(false); }}>
                  {[...activeMatch.teamA.players, ...activeMatch.teamB.players].map((player) => (
                    <option key={player.playerId} value={player.playerId}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Wagon / Zone</span>
                <input className="input" value={fieldState.wagonZone} onChange={(event) => setFieldState((current) => ({ ...current, wagonZone: event.target.value }))} placeholder="Cover / Midwicket / Long-on" />
              </label>
            </div>

            <label className="scorer-console__commentary">
              <span>Ball Commentary</span>
              <input className="input" value={fieldState.commentaryText} onChange={(event) => setFieldState((current) => ({ ...current, commentaryText: event.target.value }))} placeholder="FOUR! Beautiful cover drive." />
            </label>

            <div className="scorer-console__quick-grid">
              {runButtons.map((run) => (
                <button key={run} type="button" onClick={() => void publishQuickRun(run)} disabled={submittingBall}>
                  {run}
                </button>
              ))}
              <button type="button" className="secondary" onClick={() => setExtraMode("WD")} disabled={submittingBall}>
                Wide
              </button>
              <button type="button" className="secondary" onClick={() => setExtraMode("NB")} disabled={submittingBall}>
                No Ball
              </button>
              <button type="button" className="alert" onClick={() => setShowWicketPopup(true)} disabled={submittingBall}>
                Wicket
              </button>
            </div>

            <div className="scorer-console__recent-feed">
              <div className="scorer-console__panel-head">
                <h4>Latest Balls</h4>
                <span className="pill">{activeMatch.recentEvents.length} events</span>
              </div>
              {activeMatch.recentEvents.length === 0 ? (
                <p className="muted">No ball has been recorded yet.</p>
              ) : (
                activeMatch.recentEvents.map((event) => (
                  <article key={event.id} className="scorer-console__event">
                    <strong>{event.overBall}</strong>
                    <p>{event.summary}</p>
                    <small>
                      {event.strikerName} vs {event.bowlerName}
                    </small>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </article>

      {showWicketPopup ? (
        <div className="scorer-console__overlay">
          <div className="scorer-console__modal">
            <div className="scorer-console__panel-head">
              <h3>Wicket Details</h3>
              <button type="button" className="secondary" onClick={() => setShowWicketPopup(false)}>
                Close
              </button>
            </div>
            <div className="scorer-console__form">
              <label>
                <span>Who is out?</span>
                <select className="input" value={wicketState.outPlayerId} onChange={(event) => setWicketState((current) => ({ ...current, outPlayerId: event.target.value }))}>
                  {[...activeMatch.teamA.players, ...activeMatch.teamB.players].map((player) => (
                    <option key={player.playerId} value={player.playerId}>
                      {player.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Dismissal Type</span>
                <select className="input" value={wicketState.wicketType} onChange={(event) => setWicketState((current) => ({ ...current, wicketType: event.target.value as WicketState["wicketType"] }))}>
                  <option value="CAUGHT">Catch</option>
                  <option value="BOWLED">Bowled</option>
                  <option value="LBW">LBW</option>
                  <option value="RUN_OUT">Run Out</option>
                  <option value="STUMPED">Stumped</option>
                </select>
              </label>
              <label>
                <span>New Batter</span>
                <select className="input" value={wicketState.newBatterId} onChange={(event) => setWicketState((current) => ({ ...current, newBatterId: event.target.value }))}>
                  <option value="">Select new batter</option>
                  {[...activeMatch.teamA.players, ...activeMatch.teamB.players]
                    .filter((player) => player.playerId !== wicketState.outPlayerId)
                    .map((player) => (
                      <option key={player.playerId} value={player.playerId}>
                        {player.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                <span>Runs on wicket ball</span>
                <input className="input" type="number" min={0} max={6} value={wicketState.runs} onChange={(event) => setWicketState((current) => ({ ...current, runs: Number(event.target.value) }))} />
              </label>
              <button type="button" onClick={() => void publishWicket()} disabled={submittingBall}>
                Confirm Wicket
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {extraMode ? (
        <div className="scorer-console__overlay">
          <div className="scorer-console__modal">
            <div className="scorer-console__panel-head">
              <h3>{extraMode === "WD" ? "Wide Details" : "No Ball Details"}</h3>
              <button type="button" className="secondary" onClick={() => setExtraMode(null)}>
                Close
              </button>
            </div>
            <div className="scorer-console__form">
              <label>
                <span>Total runs from this ball</span>
                <input className="input" type="number" min={1} max={6} value={extraState.totalRuns} onChange={(event) => setExtraState((current) => ({ ...current, totalRuns: Number(event.target.value) }))} />
              </label>
              {extraMode === "NB" ? (
                <label>
                  <span>Runs from the bat</span>
                  <input className="input" type="number" min={0} max={6} value={extraState.runsBat} onChange={(event) => setExtraState((current) => ({ ...current, runsBat: Number(event.target.value) }))} />
                </label>
              ) : null}
              <label>
                <span>Commentary</span>
                <input className="input" value={extraState.commentaryText} onChange={(event) => setExtraState((current) => ({ ...current, commentaryText: event.target.value }))} placeholder={extraMode === "WD" ? "Wide down leg." : "No ball and boundary."} />
              </label>
              <button type="button" onClick={() => void publishExtra(extraMode)} disabled={submittingBall}>
                Record {extraMode === "WD" ? "Wide" : "No Ball"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
