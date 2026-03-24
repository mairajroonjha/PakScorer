"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicBottomNav from "@/components/public-bottom-nav";
import { PublicFantasyPanel, PublicPredictionPanel, PublicSharePanel } from "@/components/public-interactions";
import type { PublicMatchDetail } from "@/lib/db-store";

type MatchCenterTab = "live" | "scorecard" | "stats" | "info" | "squads";

const MATCH_CENTER_TABS: Array<{ id: MatchCenterTab; label: string }> = [
  { id: "live", label: "Live" },
  { id: "scorecard", label: "Scorecard" },
  { id: "stats", label: "Stats" },
  { id: "info", label: "Info" },
  { id: "squads", label: "Squads" }
];

function formatDetailTime(value: string) {
  return new Date(value).toLocaleString("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatShortTime(value: string) {
  return new Date(value).toLocaleTimeString("en-PK", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function TeamInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("");

  return <span className="match-center__initials">{initials || "TM"}</span>;
}

function LinkedPlayer({
  playerId,
  name
}: {
  playerId?: string;
  name: string;
}) {
  if (!playerId) {
    return <span>{name}</span>;
  }

  return <Link href={`/public/players/${playerId}` as Route}>{name}</Link>;
}

function MatchCenterSection({
  eyebrow,
  title,
  body,
  children
}: {
  eyebrow: string;
  title: string;
  body?: string;
  children: ReactNode;
}) {
  return (
    <section className="public-board match-center__section">
      <div className="public-section__head">
        <p className="public-section__eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {body ? <p className="muted">{body}</p> : null}
      </div>
      {children}
    </section>
  );
}

function MatchCenterInfoGrid({
  items
}: {
  items: Array<{ label: string; value: string; note?: string }>;
}) {
  return (
    <div className="match-center__metric-grid">
      {items.map((item) => (
        <article key={`${item.label}-${item.value}`} className="match-center__metric-card">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.note ? <small>{item.note}</small> : null}
        </article>
      ))}
    </div>
  );
}

function LiveBatterCard({
  batter
}: {
  batter: PublicMatchDetail["matchCenter"]["battingNow"][number];
}) {
  return (
    <article className="match-center__live-card">
      <div className="match-center__live-card-head">
        <strong>
          <LinkedPlayer playerId={batter.playerId} name={batter.name} />
        </strong>
        <span>{batter.isOnStrike ? "On strike" : "Non-striker"}</span>
      </div>
      <div className="match-center__live-card-score">
        <strong>
          {batter.runs} <small>({batter.balls})</small>
        </strong>
        <span>SR {batter.strikeRate.toFixed(1)}</span>
      </div>
      <div className="match-center__mini-stats">
        <div>
          <span>4s</span>
          <strong>{batter.fours}</strong>
        </div>
        <div>
          <span>6s</span>
          <strong>{batter.sixes}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{batter.status === "batting" ? "Batting" : "Out"}</strong>
        </div>
      </div>
    </article>
  );
}

function TabButton({
  active,
  onClick,
  label
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button type="button" onClick={onClick} className={`match-center__tab${active ? " match-center__tab--active" : ""}`}>
      {label}
    </button>
  );
}

function RunFlowGraph({
  data
}: {
  data: PublicMatchDetail["matchCenter"]["stats"]["runFlow"];
}) {
  if (data.length === 0) {
    return <p className="muted">Run flow graph will appear once overs are recorded.</p>;
  }

  const width = 320;
  const height = 160;
  const maxTotal = Math.max(...data.map((point) => point.total), 1);
  const maxIndex = Math.max(data.length - 1, 1);
  const points = data
    .map((point, index) => {
      const x = (index / maxIndex) * (width - 24) + 12;
      const y = height - (point.total / maxTotal) * (height - 28) - 12;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="match-center__flow-chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="match-center__flow-svg" aria-label="Run flow graph">
        <defs>
          <linearGradient id="runFlowFill" x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(20,75,54,0.36)" />
            <stop offset="100%" stopColor="rgba(20,75,54,0.04)" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((line) => (
          <line
            key={line}
            x1="12"
            x2={width - 12}
            y1={height * line}
            y2={height * line}
            className="match-center__flow-grid"
          />
        ))}
        <polyline points={`12,${height - 12} ${points} ${width - 12},${height - 12}`} className="match-center__flow-area" />
        <polyline points={points} className="match-center__flow-line" />
        {data.map((point, index) => {
          const x = (index / maxIndex) * (width - 24) + 12;
          const y = height - (point.total / maxTotal) * (height - 28) - 12;
          return <circle key={`${point.over}-${point.total}`} cx={x} cy={y} r="3.5" className="match-center__flow-dot" />;
        })}
      </svg>
      <div className="match-center__flow-axis">
        {data.map((point) => (
          <span key={`axis-${point.over}`}>O{point.over}</span>
        ))}
      </div>
    </div>
  );
}

function RequirementStrip({
  requirements
}: {
  requirements?: PublicMatchDetail["matchCenter"]["stats"]["requirements"];
}) {
  if (!requirements) {
    return null;
  }

  return (
    <div className="match-center__requirements">
      <article className="match-center__requirement-card">
        <span>Target</span>
        <strong>{requirements.target}</strong>
      </article>
      <article className="match-center__requirement-card">
        <span>Need</span>
        <strong>
          {requirements.runsNeeded} off {requirements.ballsRemaining}
        </strong>
      </article>
      <article className="match-center__requirement-card">
        <span>Required RR</span>
        <strong>{requirements.requiredRate.toFixed(2)}</strong>
      </article>
      <article className={`match-center__requirement-card match-center__requirement-card--${requirements.pressure.toLowerCase()}`}>
        <span>Pressure</span>
        <strong>{requirements.pressure}</strong>
      </article>
    </div>
  );
}

export function PublicMatchCenter({
  detail
}: {
  detail: PublicMatchDetail;
}) {
  const router = useRouter();
  const liveish = detail.match.state === "LIVE" || detail.match.state === "INNINGS_BREAK";
  const [activeTab, setActiveTab] = useState<MatchCenterTab>("live");
  const [dismissedResult, setDismissedResult] = useState(false);

  useEffect(() => {
    setDismissedResult(false);
  }, [detail.match.id]);

  useEffect(() => {
    if (!liveish) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      router.refresh();
    }, 15000);

    return () => window.clearInterval(timer);
  }, [liveish, router]);

  const summaryMetrics = useMemo(
    () => [
      {
        label: "Live Score",
        value: `${detail.score.runs}/${detail.score.wickets}`,
        note: `${detail.score.oversLabel} overs`
      },
      {
        label: "Status",
        value: detail.match.statusText,
        note: detail.matchCenter.summaryText
      },
      {
        label: "Current RR",
        value: detail.score.currentRunRate.toFixed(2),
        note: detail.match.targetRuns ? `Target ${detail.match.targetRuns}` : "First innings build"
      },
      {
        label: "Projected",
        value: detail.matchCenter.projectedScore ? `${detail.matchCenter.projectedScore}` : "Pending",
        note: "Projected total on current pace"
      }
    ],
    [detail]
  );

  const powerHitOptions = useMemo(
    () =>
      detail.matchCenter.scorecard.batting
        .slice()
        .sort((left, right) => right.sixes - left.sixes || right.runs - left.runs)
        .slice(0, 4)
        .map((entry) => entry.name),
    [detail.matchCenter.scorecard.batting]
  );

  const fantasyPlayers = useMemo(() => {
    const scoreByPlayerId = new Map<
      string,
      {
        batting?: PublicMatchDetail["matchCenter"]["scorecard"]["batting"][number];
        bowling?: PublicMatchDetail["matchCenter"]["scorecard"]["bowling"][number];
      }
    >(
      detail.matchCenter.scorecard.batting.map((entry) => [
        entry.playerId,
        {
          batting: entry,
          bowling: detail.matchCenter.scorecard.bowling.find((bowler) => bowler.playerId === entry.playerId)
        }
      ])
    );

    detail.matchCenter.scorecard.bowling.forEach((entry) => {
      const existing = scoreByPlayerId.get(entry.playerId);
      if (existing) {
        existing.bowling = entry;
        return;
      }

      scoreByPlayerId.set(entry.playerId, {
        bowling: entry
      });
    });

    return [...detail.squads.teamA.map((player) => ({ ...player, teamName: detail.match.teamAName })), ...detail.squads.teamB.map((player) => ({ ...player, teamName: detail.match.teamBName }))]
      .filter((player) => Boolean(player.playerId))
      .map((player) => {
        const statLine = scoreByPlayerId.get(player.playerId!);
        const batting = statLine?.batting;
        const bowling = statLine?.bowling;
        const points = (batting?.runs ?? 0) + (batting?.fours ?? 0) + (batting?.sixes ?? 0) * 2 + (bowling?.wickets ?? 0) * 25;

        return {
          id: player.playerId!,
          name: player.name,
          teamName: player.teamName,
          roleNote: player.role,
          points
        };
      });
  }, [detail]);

  const showResultPopup = detail.match.state === "COMPLETED" && !dismissedResult;

  return (
    <main className="public-app-shell">
      <div className="public-mobile-app public-mobile-app--detail">
      <header className="public-app-bar public-app-bar--detail">
        <div className="public-app-bar__brand">
          <Link href="/public" className="public-app-bar__back">
            &lt; Back
          </Link>
          <div>
            <strong>
              {detail.match.teamAName} vs {detail.match.teamBName}
            </strong>
            <span>{detail.match.tournamentName}</span>
          </div>
        </div>
        <div className="public-app-bar__actions">
          <Link href="/public#matches" className="public-app-bar__chip">
            Matches
          </Link>
        </div>
      </header>

      <section className="public-board match-center__hero">
        <div className="match-center__hero-top">
          <div>
            <p className="public-section__eyebrow">Match Center</p>
            <h1>{detail.match.tournamentName}</h1>
            <p className="muted">
              {detail.match.seriesLabel} · {detail.match.venue ?? "Ground pending"} · {formatDetailTime(detail.match.startAt)}
            </p>
          </div>

          <div className="match-center__hero-actions">
            <span className={`public-tag${liveish ? " public-tag--live" : ""}`}>{detail.match.statusText}</span>
            {liveish ? <span className="site-header__utility site-header__utility--live">Auto refresh on</span> : null}
            <a href="/public#matches" className="match-center__back-link">
              Back to matches
            </a>
          </div>
        </div>

        <div className="match-center__score-ribbon">
          <article className="match-center__team-panel">
            <div className="match-center__team-id">
              <TeamInitials name={detail.match.teamAName} />
              <div>
                <strong>{detail.match.teamAName}</strong>
                <span>{detail.teamA?.captainName ? `Captain: ${detail.teamA.captainName}` : "Team profile active"}</span>
              </div>
            </div>
          </article>

          <article className="match-center__score-panel">
            <small>{detail.matchCenter.summaryText}</small>
            <strong>{detail.match.scoreText}</strong>
            <span>{detail.match.resultText ?? `${detail.match.teamAName} vs ${detail.match.teamBName}`}</span>
          </article>

          <article className="match-center__team-panel match-center__team-panel--right">
            <div className="match-center__team-id">
              <div>
                <strong>{detail.match.teamBName}</strong>
                <span>{detail.teamB?.captainName ? `Captain: ${detail.teamB.captainName}` : "Team profile active"}</span>
              </div>
              <TeamInitials name={detail.match.teamBName} />
            </div>
          </article>
        </div>

        <MatchCenterInfoGrid items={summaryMetrics} />

        <div className="match-center__live-strip">
          <div className="match-center__live-strip-block">
            <span>Batting now</span>
            <strong>
              {detail.matchCenter.battingNow.length > 0
                ? detail.matchCenter.battingNow.map((item) => `${item.name} ${item.runs}(${item.balls})`).join(" · ")
                : "Waiting for batting data"}
            </strong>
          </div>

          <div className="match-center__live-strip-block">
            <span>Bowling now</span>
            <strong>
              {detail.matchCenter.bowlingNow
                ? `${detail.matchCenter.bowlingNow.name} ${detail.matchCenter.bowlingNow.wickets}/${detail.matchCenter.bowlingNow.runs} (${detail.matchCenter.bowlingNow.overs})`
                : "Bowler not assigned yet"}
            </strong>
          </div>

          <div className="match-center__live-strip-block">
            <span>Last 6</span>
            <div className="match-center__last-six">
              {detail.matchCenter.lastSixBalls.length === 0 ? (
                <small>No recent balls</small>
              ) : (
                detail.matchCenter.lastSixBalls.map((ball) => (
                  <span key={ball.ballId} className={`match-center__ball-pill match-center__ball-pill--${ball.tone}`}>
                    {ball.label}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="public-board match-center__tab-shell">
        <div className="match-center__tabs" role="tablist" aria-label="Match center tabs">
          {MATCH_CENTER_TABS.map((tab) => (
            <TabButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} label={tab.label} />
          ))}
        </div>
        {activeTab === "live" ? (
          <div className="match-center__tab-panel">
            <div className="match-center__two-column">
              <div className="match-center__stack">
                <MatchCenterSection
                  eyebrow="Live"
                  title="Current on-field battle"
                  body="Score, strike rotation, partnership, and recent balls for the active passage of play."
                >
                  <div className="match-center__live-grid">
                    <div className="match-center__stack">
                      {detail.matchCenter.battingNow.length === 0 ? (
                        <p className="muted">Batting cards will appear once ball-by-ball data starts flowing.</p>
                      ) : (
                        detail.matchCenter.battingNow.map((batter) => <LiveBatterCard key={batter.playerId} batter={batter} />)
                      )}
                    </div>

                    <div className="match-center__stack">
                      <article className="match-center__live-card">
                        <div className="match-center__live-card-head">
                          <strong>Current bowler</strong>
                          <span>{detail.matchCenter.bowlingNow ? "Spell" : "Pending"}</span>
                        </div>
                        {detail.matchCenter.bowlingNow ? (
                          <>
                            <div className="match-center__live-card-score">
                              <strong>
                                <LinkedPlayer
                                  playerId={detail.matchCenter.bowlingNow.playerId}
                                  name={detail.matchCenter.bowlingNow.name}
                                />
                              </strong>
                              <span>
                                {detail.matchCenter.bowlingNow.wickets}/{detail.matchCenter.bowlingNow.runs}
                              </span>
                            </div>
                            <div className="match-center__mini-stats">
                              <div>
                                <span>Overs</span>
                                <strong>{detail.matchCenter.bowlingNow.overs}</strong>
                              </div>
                              <div>
                                <span>Maidens</span>
                                <strong>{detail.matchCenter.bowlingNow.maidens}</strong>
                              </div>
                              <div>
                                <span>Eco</span>
                                <strong>{detail.matchCenter.bowlingNow.economy.toFixed(2)}</strong>
                              </div>
                            </div>
                          </>
                        ) : (
                          <p className="muted">Bowler information will appear once the innings starts.</p>
                        )}
                      </article>

                      <article className="match-center__live-card">
                        <div className="match-center__live-card-head">
                          <strong>Partnership</strong>
                          <span>Active stand</span>
                        </div>
                        <div className="match-center__live-card-score">
                          <strong>
                            {detail.matchCenter.currentPartnership.runs} <small>runs</small>
                          </strong>
                          <span>{detail.matchCenter.currentPartnership.balls} balls</span>
                        </div>
                        <div className="match-center__mini-stats">
                          <div>
                            <span>Projected</span>
                            <strong>{detail.matchCenter.projectedScore ?? "Pending"}</strong>
                          </div>
                          <div>
                            <span>Last wicket</span>
                            <strong>{detail.matchCenter.lastWicket ?? "No wicket yet"}</strong>
                          </div>
                        </div>
                      </article>
                    </div>
                  </div>
                </MatchCenterSection>

                <MatchCenterSection
                  eyebrow="Commentary"
                  title="Ball-by-ball live feed"
                  body="Latest official updates from the scorer. This panel refreshes automatically while the match is live."
                >
                  <div className="match-center__commentary">
                    {detail.recentBalls.length === 0 ? (
                      <p className="muted">No commentary has been posted yet.</p>
                    ) : (
                      detail.recentBalls.map((ball) => (
                        <article key={ball.id} className="match-center__commentary-item">
                          <div className="match-center__commentary-head">
                            <strong>{ball.overBall}</strong>
                            <span>{formatShortTime(ball.createdAt)}</span>
                          </div>
                          <p>{ball.text}</p>
                          <small>
                            <LinkedPlayer playerId={ball.batterId} name={ball.batterName} /> vs{" "}
                            <LinkedPlayer playerId={ball.bowlerId} name={ball.bowlerName} />
                          </small>
                        </article>
                      ))
                    )}
                  </div>
                </MatchCenterSection>
              </div>

              <div className="match-center__stack">
                <MatchCenterSection
                  eyebrow="Match Requirement"
                  title="What this innings requires"
                  body="Target chase pressure, required rate, and live requirement context."
                >
                  <RequirementStrip requirements={detail.matchCenter.stats.requirements} />
                  <div className="match-center__analysis-notes">
                    {detail.matchCenter.stats.analysisNotes.map((note) => (
                      <article key={note} className="match-center__analysis-note">
                        {note}
                      </article>
                    ))}
                  </div>
                </MatchCenterSection>

                <MatchCenterSection
                  eyebrow="Momentum Graph"
                  title="Live run flow"
                  body="Quick over-by-over scoring curve without leaving the live tab."
                >
                  <RunFlowGraph data={detail.matchCenter.stats.runFlow} />
                </MatchCenterSection>

                {detail.match.state !== "COMPLETED" ? (
                  <PublicPredictionPanel
                    matchId={detail.match.id}
                    teamAName={detail.match.teamAName}
                    teamBName={detail.match.teamBName}
                    tournamentName={detail.match.tournamentName}
                    powerHitOptions={powerHitOptions}
                  />
                ) : null}

                <PublicFantasyPanel matchId={detail.match.id} tournamentName={detail.match.tournamentName} players={fantasyPlayers} />

                <PublicSharePanel
                  matchId={detail.match.id}
                  title={`${detail.match.teamAName} vs ${detail.match.teamBName} - ${detail.match.tournamentName}`}
                />
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "scorecard" ? (
          <div className="match-center__tab-panel">
            <div className="match-center__stack">
              <MatchCenterSection
                eyebrow="Scorecard"
                title="Batting card"
                body="Runs, balls, boundaries, and dismissal state for the innings tracked on the public sheet."
              >
                <div className="match-center__table-shell">
                  <table className="match-center__table">
                    <thead>
                      <tr>
                        <th>Batter</th>
                        <th>R</th>
                        <th>B</th>
                        <th>4s</th>
                        <th>6s</th>
                        <th>SR</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.matchCenter.scorecard.batting.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="match-center__table-empty">
                            Batting detail is not available yet.
                          </td>
                        </tr>
                      ) : (
                        detail.matchCenter.scorecard.batting.map((entry) => (
                          <tr key={entry.playerId}>
                            <td>
                              <LinkedPlayer playerId={entry.playerId} name={entry.name} />
                            </td>
                            <td>{entry.runs}</td>
                            <td>{entry.balls}</td>
                            <td>{entry.fours}</td>
                            <td>{entry.sixes}</td>
                            <td>{entry.strikeRate.toFixed(1)}</td>
                            <td>{entry.dismissalText}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </MatchCenterSection>

              <MatchCenterSection
                eyebrow="Bowling"
                title="Bowling figures"
                body="Overs, maidens, wickets, economy, and runs conceded by the active bowling group."
              >
                <div className="match-center__table-shell">
                  <table className="match-center__table">
                    <thead>
                      <tr>
                        <th>Bowler</th>
                        <th>O</th>
                        <th>M</th>
                        <th>R</th>
                        <th>W</th>
                        <th>ECO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.matchCenter.scorecard.bowling.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="match-center__table-empty">
                            Bowling figures are not available yet.
                          </td>
                        </tr>
                      ) : (
                        detail.matchCenter.scorecard.bowling.map((entry) => (
                          <tr key={entry.playerId}>
                            <td>
                              <LinkedPlayer playerId={entry.playerId} name={entry.name} />
                            </td>
                            <td>{entry.overs}</td>
                            <td>{entry.maidens}</td>
                            <td>{entry.runs}</td>
                            <td>{entry.wickets}</td>
                            <td>{entry.economy.toFixed(2)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </MatchCenterSection>
            </div>
          </div>
        ) : null}
        {activeTab === "stats" ? (
          <div className="match-center__tab-panel">
            <div className="match-center__two-column">
              <div className="match-center__stack">
                <MatchCenterSection
                  eyebrow="Run Flow"
                  title="Over-by-over scoring trend"
                  body="Cumulative scoring path across the innings so far."
                >
                  <RunFlowGraph data={detail.matchCenter.stats.runFlow} />
                </MatchCenterSection>

                <MatchCenterSection
                  eyebrow="Stats"
                  title="Win probability"
                  body="A live public estimate based on state, wickets, scoring speed, and chase pressure."
                >
                  <div className="match-center__probability">
                    <div className="match-center__probability-bar">
                      <span style={{ width: `${detail.matchCenter.stats.winProbability.teamA}%` }}>{detail.match.teamAName}</span>
                      <span style={{ width: `${detail.matchCenter.stats.winProbability.teamB}%` }}>{detail.match.teamBName}</span>
                    </div>
                    <div className="match-center__probability-meta">
                      <strong>{detail.matchCenter.stats.winProbability.teamA}%</strong>
                      <strong>{detail.matchCenter.stats.winProbability.teamB}%</strong>
                    </div>
                  </div>
                </MatchCenterSection>

                <MatchCenterSection
                  eyebrow="Run Rate"
                  title="Live pace comparison"
                  body="Current rate, required rate, and projected finish in a compact comparison block."
                >
                  <div className="match-center__chart-list">
                    {detail.matchCenter.stats.runRateBars.map((bar) => {
                      const scale = Math.max(bar.teamA, bar.teamB, 1);
                      return (
                        <article key={bar.label} className="match-center__chart-row">
                          <div className="match-center__chart-head">
                            <strong>{bar.label}</strong>
                            <span>
                              {detail.match.teamAName} {bar.teamA} · {detail.match.teamBName} {bar.teamB}
                            </span>
                          </div>
                          <div className="match-center__chart-bars">
                            <div className="match-center__chart-track">
                              <span className="match-center__chart-fill match-center__chart-fill--team-a" style={{ width: `${(bar.teamA / scale) * 100}%` }} />
                            </div>
                            <div className="match-center__chart-track">
                              <span className="match-center__chart-fill match-center__chart-fill--team-b" style={{ width: `${(bar.teamB / scale) * 100}%` }} />
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </MatchCenterSection>

                <MatchCenterSection
                  eyebrow="Wagon Wheel"
                  title="Shot zones"
                  body="Where the scoring shots have gone so far in this innings."
                >
                  <div className="match-center__wagon-grid">
                    {detail.wagonWheel.length === 0 ? (
                      <p className="muted">Wagon wheel entries will appear once shot zones are recorded.</p>
                    ) : (
                      detail.wagonWheel.map((zone) => (
                        <article key={zone.zone} className="match-center__wagon-card">
                          <strong>{zone.zone}</strong>
                          <span>{zone.runs} runs</span>
                          <small>{zone.balls} balls</small>
                        </article>
                      ))
                    )}
                  </div>
                </MatchCenterSection>
              </div>

              <div className="match-center__stack">
                <MatchCenterSection
                  eyebrow="Phase Analysis"
                  title="Powerplay, middle, and death overs"
                  body="Where the innings accelerated, slowed down, or leaked wickets."
                >
                  <div className="match-center__phase-grid">
                    {detail.matchCenter.stats.phaseBreakdown.map((phase) => (
                      <article key={phase.label} className="match-center__phase-card">
                        <strong>{phase.label}</strong>
                        <div className="match-center__phase-metrics">
                          <span>{phase.runs} runs</span>
                          <span>{phase.wickets} wkts</span>
                          <span>{phase.runRate.toFixed(2)} RR</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </MatchCenterSection>

                <MatchCenterSection
                  eyebrow="Ball Outcomes"
                  title="How the over flow is built"
                  body="Distribution of dots, rotation, boundaries, and wickets."
                >
                  <div className="match-center__outcome-list">
                    {detail.matchCenter.stats.ballOutcomeSplit.map((item) => (
                      <article key={item.label} className="match-center__outcome-item">
                        <div className="match-center__chart-head">
                          <strong>{item.label}</strong>
                          <span>{item.value}</span>
                        </div>
                        <div className="match-center__outcome-track">
                          <span
                            className={`match-center__outcome-fill match-center__outcome-fill--${item.tone}`}
                            style={{
                              width: `${Math.max(
                                8,
                                (item.value /
                                  Math.max(...detail.matchCenter.stats.ballOutcomeSplit.map((entry) => entry.value), 1)) *
                                  100
                              )}%`
                            }}
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                </MatchCenterSection>

                <MatchCenterSection eyebrow="Form" title="Recent team form" body="Quick read on both sides before this fixture turns.">
                  <div className="match-center__stack">
                    {[
                      { label: detail.match.teamAName, items: detail.form.teamA },
                      { label: detail.match.teamBName, items: detail.form.teamB }
                    ].map((formBlock) => (
                      <article key={formBlock.label} className="match-center__form-card">
                        <div className="match-center__form-head">
                          <strong>{formBlock.label}</strong>
                          <span>Last {formBlock.items.length || 0}</span>
                        </div>
                        <div className="match-center__form-strip">
                          {formBlock.items.length === 0 ? (
                            <small>No completed matches</small>
                          ) : (
                            formBlock.items.map((item, index) => (
                              <span key={`${formBlock.label}-${index}`} className={`match-center__form-pill match-center__form-pill--${item.tone}`}>
                                {item.label}
                              </span>
                            ))
                          )}
                        </div>
                        <small>{formBlock.items[0]?.result ?? "No recent result yet."}</small>
                      </article>
                    ))}
                  </div>
                </MatchCenterSection>

                <MatchCenterSection
                  eyebrow="Head To Head"
                  title={`${detail.match.teamAName} ${detail.headToHead.winsA} - ${detail.headToHead.winsB} ${detail.match.teamBName}`}
                  body="Completed meetings already recorded between these two sides."
                >
                  <div className="match-center__history">
                    {detail.recentHeadToHead.length === 0 ? (
                      <p className="muted">No previous completed head-to-head record yet.</p>
                    ) : (
                      detail.recentHeadToHead.map((item) => (
                        <article key={item.id} className="match-center__history-item">
                          <strong>{item.title}</strong>
                          <span>{new Date(item.startAt).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span>
                          <p>{item.result}</p>
                        </article>
                      ))
                    )}
                  </div>
                </MatchCenterSection>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "info" ? (
          <div className="match-center__tab-panel">
            <div className="match-center__two-column">
              <div className="match-center__stack">
                <MatchCenterSection
                  eyebrow="Info"
                  title="Match and venue information"
                  body="Series label, toss, venue, pitch report, and match-day context in one place."
                >
                  <MatchCenterInfoGrid
                    items={[
                      { label: "Series", value: detail.match.seriesLabel },
                      { label: "Venue", value: detail.match.venue ?? "Ground pending" },
                      {
                        label: "Toss",
                        value: detail.match.tossWinnerTeamName
                          ? `${detail.match.tossWinnerTeamName} opted to ${detail.match.electedTo?.toLowerCase() ?? "pending"}`
                          : "Pending"
                      },
                      {
                        label: "Format",
                        value: detail.tournament?.format ?? `${detail.match.scheduledOvers ?? "?"} overs`,
                        note: detail.tournament?.ballType ?? "Ball type pending"
                      },
                      { label: "Start", value: formatDetailTime(detail.match.startAt) },
                      {
                        label: "Target",
                        value: typeof detail.match.targetRuns === "number" ? `${detail.match.targetRuns}` : "Not set"
                      }
                    ]}
                  />
                </MatchCenterSection>

                <MatchCenterSection eyebrow="Venue" title={detail.venue.name} body="Ground history, pitch signal, and venue conditions from recorded matches.">
                  <MatchCenterInfoGrid
                    items={[
                      { label: "Matches Hosted", value: `${detail.venue.matchesHosted}` },
                      { label: "Average Total", value: `${detail.venue.averageScore}` },
                      { label: "Highest Total", value: `${detail.venue.highestScore}` },
                      { label: "Lowest Total", value: `${detail.venue.lowestScore}` }
                    ]}
                  />
                  <div className="match-center__venue-notes">
                    <article className="match-center__metric-card">
                      <span>Pitch Report</span>
                      <strong>{detail.venue.pitchReport}</strong>
                    </article>
                    <article className="match-center__metric-card">
                      <span>Conditions</span>
                      <strong>{detail.venue.conditionsNote}</strong>
                    </article>
                  </div>
                </MatchCenterSection>
              </div>

              <div className="match-center__stack">
                <MatchCenterSection eyebrow="Playing XI" title="Confirmed lineup snapshot" body="Public view of the first eleven from both squads.">
                  <div className="match-center__playing-xi">
                    <article className="match-center__squad-card">
                      <div className="match-center__squad-head">
                        <strong>{detail.match.teamAName}</strong>
                        <span>Playing XI</span>
                      </div>
                      <div className="match-center__squad-list">
                        {detail.squads.teamA.slice(0, 11).map((player, index) => (
                          <div key={`${player.name}-${index}`} className="match-center__squad-player">
                            <LinkedPlayer playerId={player.playerId} name={player.name} />
                            <small>{player.role}</small>
                          </div>
                        ))}
                      </div>
                    </article>

                    <article className="match-center__squad-card">
                      <div className="match-center__squad-head">
                        <strong>{detail.match.teamBName}</strong>
                        <span>Playing XI</span>
                      </div>
                      <div className="match-center__squad-list">
                        {detail.squads.teamB.slice(0, 11).map((player, index) => (
                          <div key={`${player.name}-${index}`} className="match-center__squad-player">
                            <LinkedPlayer playerId={player.playerId} name={player.name} />
                            <small>{player.role}</small>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>
                </MatchCenterSection>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "squads" ? (
          <div className="match-center__tab-panel">
            <MatchCenterSection eyebrow="Squads" title="Full match squads" body="Playing members and squad depth available for this fixture.">
              <div className="match-center__playing-xi">
                <article className="match-center__squad-card">
                  <div className="match-center__squad-head">
                    <strong>{detail.match.teamAName}</strong>
                    <span>{detail.squads.teamA.length} listed players</span>
                  </div>
                  <div className="match-center__squad-list">
                    {detail.squads.teamA.map((player, index) => (
                      <div key={`${player.name}-${index}`} className="match-center__squad-player">
                        <LinkedPlayer playerId={player.playerId} name={player.name} />
                        <small>{player.role}</small>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="match-center__squad-card">
                  <div className="match-center__squad-head">
                    <strong>{detail.match.teamBName}</strong>
                    <span>{detail.squads.teamB.length} listed players</span>
                  </div>
                  <div className="match-center__squad-list">
                    {detail.squads.teamB.map((player, index) => (
                      <div key={`${player.name}-${index}`} className="match-center__squad-player">
                        <LinkedPlayer playerId={player.playerId} name={player.name} />
                        <small>{player.role}</small>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </MatchCenterSection>
          </div>
        ) : null}
      </section>

      {showResultPopup ? (
        <div className="match-center__result-popup" role="dialog" aria-live="polite" aria-label="Match result">
          <div className="match-center__result-card">
            <button type="button" className="match-center__result-close" onClick={() => setDismissedResult(true)} aria-label="Dismiss result card">
              x
            </button>
            <p className="public-section__eyebrow">Match Result</p>
            <h3>{detail.match.resultText ?? detail.match.statusText}</h3>
            <p className="muted">{detail.match.winnerTeamName ? `${detail.match.winnerTeamName} closed the game.` : "Match completed."}</p>
            <div className="match-center__result-potm">
              <span>Player of the Match</span>
              <strong>{detail.matchCenter.playerOfTheMatch?.name ?? "To be confirmed"}</strong>
              <small>{detail.matchCenter.playerOfTheMatch?.summary ?? "Performance summary will appear once stats settle."}</small>
            </div>
          </div>
        </div>
      ) : null}
      <PublicBottomNav />
      </div>
    </main>
  );
}

