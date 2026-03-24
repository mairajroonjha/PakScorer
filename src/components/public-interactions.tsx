"use client";

import { useEffect, useMemo, useState } from "react";

export interface PublicVoteOption {
  id: string;
  label: string;
  note: string;
}

interface FeedEventPayload {
  matchId?: string;
  state?: string;
  overBall?: string;
  runs?: number;
  isWicket?: boolean;
  scoreText?: string;
  commentaryText?: string;
  headline?: string;
  milestone?: number;
  strikerName?: string;
  bowlerName?: string;
  winnerTeamName?: string;
}

interface FeedEvent {
  name: string;
  occurredAt?: string;
  payload?: FeedEventPayload;
  raw: string;
}

function formatFeedEvent(event: FeedEvent): string {
  const payload = event.payload;

  if (event.name === "match.ball_recorded") {
    if (payload?.isWicket) {
      return `${payload.strikerName ?? "Batter"} is out. ${payload.scoreText ?? "Score updated."}`;
    }
    if (payload?.milestone) {
      return `Team total reached ${payload.milestone}. ${payload.scoreText ?? ""}`.trim();
    }
    return payload?.commentaryText ?? "Ball recorded live from the scorer console.";
  }

  if (event.name === "match.state_changed") {
    return payload?.headline ?? "Match status changed on the public feed.";
  }

  if (event.name === "fanvote.updated") {
    return "Fan voting just moved.";
  }

  if (event.name === "leaderboard.updated") {
    return "Leaderboard positions refreshed.";
  }

  return event.raw;
}

function shouldNotify(event: FeedEvent) {
  const payload = event.payload;

  if (event.name === "match.ball_recorded" && (payload?.isWicket || typeof payload?.milestone === "number")) {
    return true;
  }

  if (event.name === "match.state_changed" && payload?.state === "COMPLETED") {
    return true;
  }

  return false;
}

function notificationBody(event: FeedEvent) {
  if (event.name === "match.ball_recorded" && event.payload?.isWicket) {
    return `Wicket at ${event.payload.overBall ?? "latest ball"}: ${event.payload.scoreText ?? "score updated"}`;
  }
  if (event.name === "match.ball_recorded" && typeof event.payload?.milestone === "number") {
    return `${event.payload.milestone} reached. ${event.payload.scoreText ?? ""}`.trim();
  }
  if (event.name === "match.state_changed" && event.payload?.state === "COMPLETED") {
    return event.payload.headline ?? `${event.payload.winnerTeamName ?? "A team"} won the match.`;
  }
  return formatFeedEvent(event);
}

export function PublicVotePanel({
  matchId,
  options
}: {
  matchId: string;
  options: PublicVoteOption[];
}) {
  const [message, setMessage] = useState("Vote for the current standout performer.");
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function vote(playerId: string) {
    setPendingId(playerId);
    try {
      const response = await fetch(`/api/fan-votes/${matchId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          otpVerified: true,
          deviceId: "public-browser-demo"
        })
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      setMessage(result.ok ? "Vote captured. Public pulse updated." : result.error ?? "Vote failed.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="public-vote">
      <div className="public-section__head public-section__head--compact">
        <p className="public-section__eyebrow">Fan Choice</p>
        <h3>Moment of the Match</h3>
        <p className="muted">Keep the public board active while the scorers handle the official sheet.</p>
      </div>
      <div className="public-vote__options">
        {options.map((option, index) => (
          <button
            key={`${option.id}-${index}`}
            className={`public-vote__option${pendingId === option.id ? " public-vote__option--active" : ""}`}
            disabled={pendingId !== null}
            onClick={() => void vote(option.id)}
            type="button"
          >
            <span className="public-vote__rank">{index + 1}</span>
            <span className="public-vote__copy">
              <strong>{option.label}</strong>
              <span>{option.note}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="public-vote__message">{message}</p>
    </section>
  );
}

export function PublicPredictionPanel({
  matchId,
  teamAName,
  teamBName,
  tournamentName,
  powerHitOptions
}: {
  matchId: string;
  teamAName: string;
  teamBName: string;
  tournamentName: string;
  powerHitOptions?: string[];
}) {
  const storageKey = `pakscorer-prediction-${matchId}`;
  const [selectedWinner, setSelectedWinner] = useState<string>("");
  const [selectedPowerHit, setSelectedPowerHit] = useState<string>("");
  const [message, setMessage] = useState(`Daily prediction game for ${tournamentName}. Pick the winner and the top six-hitter.`);
  const hitterOptions = powerHitOptions && powerHitOptions.length > 0 ? powerHitOptions.slice(0, 4) : ["Power Hitter A", "Power Hitter B"];

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { winner?: string; powerHit?: string };
        if (parsed.winner) {
          setSelectedWinner(parsed.winner);
        }
        if (parsed.powerHit) {
          setSelectedPowerHit(parsed.powerHit);
        }
      } catch {
        setSelectedWinner(saved);
      }
      setMessage("Daily prediction saved on this device.");
    }
  }, [storageKey]);

  function save(nextWinner: string, nextPowerHit: string) {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        winner: nextWinner,
        powerHit: nextPowerHit
      })
    );
    setMessage("Daily prediction locked. Correct answers can unlock bonus points and reward draws.");
  }

  function chooseWinner(teamName: string) {
    setSelectedWinner(teamName);
    save(teamName, selectedPowerHit);
  }

  function choosePowerHit(playerName: string) {
    setSelectedPowerHit(playerName);
    save(selectedWinner, playerName);
  }

  return (
    <section className="public-prediction">
      <div className="public-section__head public-section__head--compact">
        <p className="public-section__eyebrow">Daily Predictions</p>
        <h3>Win picks and six-hitter game</h3>
        <p className="muted">Sahi answers par bonus points, leaderboard boost, aur reward-draw eligibility mil sakti hai.</p>
      </div>
      <div className="public-prediction__group">
        <strong>Who wins today?</strong>
        <div className="public-prediction__actions">
          {[teamAName, teamBName].map((teamName) => (
            <button
              key={teamName}
              type="button"
              className={`public-prediction__button${selectedWinner === teamName ? " public-prediction__button--active" : ""}`}
              onClick={() => chooseWinner(teamName)}
            >
              {teamName}
            </button>
          ))}
        </div>
      </div>

      <div className="public-prediction__group">
        <strong>Who hits the most sixes?</strong>
        <div className="public-prediction__actions public-prediction__actions--stacked">
          {hitterOptions.map((playerName) => (
            <button
              key={playerName}
              type="button"
              className={`public-prediction__button${selectedPowerHit === playerName ? " public-prediction__button--active" : ""}`}
              onClick={() => choosePowerHit(playerName)}
            >
              {playerName}
            </button>
          ))}
        </div>
      </div>

      <div className="public-prediction__scoreline">
        <span>Winner pick: 10 pts</span>
        <span>Top six-hitter: 20 pts</span>
        <span>Perfect card: reward draw entry</span>
      </div>
      <p className="public-vote__message">{message}</p>
    </section>
  );
}

export function PublicFantasyPanel({
  matchId,
  tournamentName,
  players
}: {
  matchId: string;
  tournamentName: string;
  players: Array<{
    id: string;
    name: string;
    teamName: string;
    points: number;
    roleNote: string;
  }>;
}) {
  const storageKey = `pakscorer-fantasy-${matchId}`;
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("Pick exactly 5 players. Fantasy points update from live match stats.");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as string[];
      setSelectedIds(parsed.slice(0, 5));
      setMessage("Fantasy team restored on this device.");
    } catch {
      setSelectedIds([]);
    }
  }, [storageKey]);

  const selectedPlayers = players.filter((player) => selectedIds.includes(player.id));
  const totalPoints = selectedPlayers.reduce((sum, player) => sum + player.points, 0);

  function togglePlayer(playerId: string) {
    setSelectedIds((previous) => {
      const exists = previous.includes(playerId);
      let next = previous;

      if (exists) {
        next = previous.filter((id) => id !== playerId);
      } else if (previous.length < 5) {
        next = [...previous, playerId];
      } else {
        setMessage("Fantasy team already has 5 players. Remove one before adding another.");
        return previous;
      }

      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setMessage(next.length === 5 ? "Fantasy team locked. Live points are now tracking." : `Fantasy team: ${next.length}/5 selected.`);
      return next;
    });
  }

  return (
    <section className="public-fantasy">
      <div className="public-section__head public-section__head--compact">
        <p className="public-section__eyebrow">Simple Fantasy</p>
        <h3>Build a 5-player team</h3>
        <p className="muted">{tournamentName} fantasy card. Runs, fours, sixes, and wickets feed the live score.</p>
      </div>

      <div className="public-fantasy__summary">
        <article>
          <span>Selected</span>
          <strong>{selectedIds.length}/5</strong>
        </article>
        <article>
          <span>Live Points</span>
          <strong>{totalPoints}</strong>
        </article>
      </div>

      <div className="public-fantasy__pool">
        {players.map((player) => (
          <button
            key={player.id}
            type="button"
            className={`public-fantasy__player${selectedIds.includes(player.id) ? " public-fantasy__player--active" : ""}`}
            onClick={() => togglePlayer(player.id)}
          >
            <span className="public-fantasy__player-name">{player.name}</span>
            <span className="public-fantasy__player-team">{player.teamName}</span>
            <small>{player.roleNote}</small>
            <strong>{player.points} pts</strong>
          </button>
        ))}
      </div>
      <p className="public-vote__message">{message}</p>
    </section>
  );
}

export function PublicSharePanel({
  matchId,
  title
}: {
  matchId: string;
  title: string;
}) {
  const [message, setMessage] = useState("Create a shareable scorecard link for WhatsApp or Facebook.");
  const [pending, setPending] = useState(false);

  async function shareScorecard() {
    setPending(true);
    try {
      const response = await fetch("/api/share/scorecard-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId })
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
        data?: { snapshotUrl: string; social: { title: string; description: string } };
      };

      if (!result.ok || !result.data) {
        setMessage(result.error ?? "Share snapshot failed.");
        return;
      }

      const shareText = `${title}\n${result.data.social.description}\n${result.data.snapshotUrl}`;
      const browserNavigator =
        typeof window !== "undefined"
          ? (window.navigator as Navigator & {
              share?: (data: ShareData) => Promise<void>;
              clipboard?: { writeText(text: string): Promise<void> };
            })
          : undefined;

      if (browserNavigator?.share) {
        await browserNavigator.share({
          title: result.data.social.title,
          text: shareText,
          url: result.data.snapshotUrl
        });
        setMessage("Native share sheet opened.");
        return;
      }

      if (browserNavigator?.clipboard?.writeText) {
        await browserNavigator.clipboard.writeText(shareText);
        setMessage("Scorecard share text copied to clipboard.");
        return;
      }

      setMessage(result.data.snapshotUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Share snapshot failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="public-share">
      <div className="public-section__head public-section__head--compact">
        <p className="public-section__eyebrow">Share</p>
        <h3>Send scorecard</h3>
        <p className="muted">Generate a snapshot for social sharing directly from the public match page.</p>
      </div>
      <button type="button" className="public-share__button" disabled={pending} onClick={() => void shareScorecard()}>
        {pending ? "Preparing snapshot..." : "Share Scorecard"}
      </button>
      <p className="public-vote__message">{message}</p>
    </section>
  );
}

export function PublicLiveFeed() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [alertState, setAlertState] = useState<"idle" | "enabled" | "blocked">("idle");

  async function enableAlerts() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setAlertState("blocked");
      return;
    }

    const permission = await Notification.requestPermission();
    setAlertState(permission === "granted" ? "enabled" : "blocked");
  }

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }
    if (Notification.permission === "granted") {
      setAlertState("enabled");
    } else if (Notification.permission === "denied") {
      setAlertState("blocked");
    }
  }, []);

  useEffect(() => {
    const source = new EventSource("/api/realtime/stream");

    source.addEventListener("hello", () => {
      setConnected(true);
    });

    source.addEventListener("heartbeat", () => {
      setConnected(true);
    });

    source.onmessage = (event) => {
      setConnected(true);
      let parsedEvent: FeedEvent;
      try {
        parsedEvent = { ...(JSON.parse(event.data) as Omit<FeedEvent, "raw">), raw: event.data };
      } catch {
        parsedEvent = { name: "live.update", raw: event.data };
      }

      setEvents((previous) => [parsedEvent, ...previous].slice(0, 6));

      if (
        alertState === "enabled" &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        shouldNotify(parsedEvent)
      ) {
        new Notification("PakScorer Alert", {
          body: notificationBody(parsedEvent)
        });
      }
    };

    source.onerror = () => {
      setConnected(false);
    };

    return () => source.close();
  }, [alertState]);

  const alertStatus = useMemo(() => {
    if (alertState === "enabled") {
      return "Browser alerts enabled";
    }
    if (alertState === "blocked") {
      return "Browser alerts blocked";
    }
    return "Enable wicket, milestone, and result alerts";
  }, [alertState]);

  return (
    <section className="public-feed">
      <div className="public-section__head public-section__head--compact">
        <p className="public-section__eyebrow">Live Wire</p>
        <h3>Realtime Feed</h3>
      </div>
      <div className={`public-feed__status${connected ? " public-feed__status--live" : ""}`}>
        <span className="public-feed__dot" />
        {connected ? "Connected to the scorer stream" : "Waiting for a live scorer session"}
      </div>
      <div className="public-feed__alert-row">
        <span className="muted">{alertStatus}</span>
        {alertState !== "enabled" ? (
          <button type="button" className="public-feed__alert-button" onClick={() => void enableAlerts()}>
            Enable Alerts
          </button>
        ) : null}
      </div>
      <div className="public-feed__list">
        {events.length === 0 ? (
          <p className="muted">The feed will fill with balls, wickets, rankings, and result swings as soon as a live match starts.</p>
        ) : (
          events.map((event, index) => (
            <article key={`${event.name}-${event.occurredAt ?? index}`} className="public-feed__item">
              <div className="public-feed__item-row">
                <strong>{event.name.replaceAll(".", " ")}</strong>
                {event.occurredAt ? <span>{new Date(event.occurredAt).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" })}</span> : null}
              </div>
              <p>{formatFeedEvent(event)}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
