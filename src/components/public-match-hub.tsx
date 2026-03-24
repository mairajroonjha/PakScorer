"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicCenterMatch, PublicTournamentBoard } from "@/lib/db-store";

type MatchTabKey = "live" | "upcoming" | "finished";

function formatDayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const sameDay = (left: Date, right: Date) =>
    left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();

  if (sameDay(date, today)) {
    return "Today";
  }

  if (sameDay(date, tomorrow)) {
    return "Tomorrow";
  }

  return date.toLocaleDateString("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-PK", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatTournamentWindow(start?: string, end?: string) {
  if (!start) {
    return "Dates pending";
  }

  const startLabel = new Date(start).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short"
  });

  if (!end) {
    return startLabel;
  }

  const endLabel = new Date(end).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short"
  });

  return `${startLabel} - ${endLabel}`;
}

function formatNrr(value: number) {
  return value >= 0 ? `+${value.toFixed(2)}` : value.toFixed(2);
}

function TournamentPulseGraph({ board }: { board: PublicTournamentBoard }) {
  const totals = [
    { label: "Live", value: board.liveMatches.length, tone: "live" },
    { label: "Upcoming", value: board.upcomingMatches.length, tone: "upcoming" },
    { label: "Finished", value: board.finishedMatches.length, tone: "finished" }
  ] as const;
  const maxMatches = Math.max(...totals.map((item) => item.value), 1);
  const tableRows = board.pointsTable.slice(0, 4);
  const maxPoints = Math.max(...tableRows.map((row) => row.points), 1);

  return (
    <div className="tournament-board__analytics">
      <div className="tournament-board__activity">
        {totals.map((item) => (
          <article key={item.label} className={`tournament-board__activity-card tournament-board__activity-card--${item.tone}`}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <div className="tournament-board__activity-track">
              <span style={{ width: `${Math.max((item.value / maxMatches) * 100, 10)}%` }} />
            </div>
          </article>
        ))}
      </div>
      <div className="tournament-board__standings-graph">
        {tableRows.length === 0 ? (
          <p className="muted">Standings graph will appear after the first results.</p>
        ) : (
          tableRows.map((row) => (
            <div key={`${row.id}-chart`} className="tournament-board__standings-row">
              <div>
                <strong>{row.teamName}</strong>
                <span>{row.points} pts</span>
              </div>
              <div className="tournament-board__standings-track">
                <span style={{ width: `${Math.max((row.points / maxPoints) * 100, 12)}%` }} />
              </div>
              <small>{formatNrr(row.netRunRate)}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function groupBySeries(matches: PublicCenterMatch[]) {
  const grouped = new Map<string, PublicCenterMatch[]>();

  for (const match of matches) {
    const current = grouped.get(match.seriesLabel) ?? [];
    current.push(match);
    grouped.set(match.seriesLabel, current);
  }

  return [...grouped.entries()].map(([label, seriesMatches]) => ({
    label,
    matches: seriesMatches.sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())
  }));
}

function groupByDay(matches: PublicCenterMatch[]) {
  const grouped = new Map<string, PublicCenterMatch[]>();

  for (const match of matches) {
    const label = formatDayLabel(match.startAt);
    const current = grouped.get(label) ?? [];
    current.push(match);
    grouped.set(label, current);
  }

  return [...grouped.entries()].map(([label, dayMatches]) => ({
    label,
    matches: dayMatches.sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())
  }));
}

function MatchCard({ match, tab }: { match: PublicCenterMatch; tab: MatchTabKey }) {
  return (
    <Link href={`/public/matches/${match.id}` as Route} className={`match-hub-card match-hub-card--${tab}`}>
      <div className="match-hub-card__meta">
        <span>{match.tournamentName}</span>
        <span>{match.venue ?? "Ground pending"}</span>
      </div>
      <div className="match-hub-card__body">
        <div className="match-hub-card__teams">
          <strong>{match.teamAName}</strong>
          <strong>{match.teamBName}</strong>
        </div>
        <div className="match-hub-card__score">
          {tab === "upcoming" ? (
            <>
              <span>{formatDayLabel(match.startAt)}</span>
              <strong>{formatTime(match.startAt)}</strong>
            </>
          ) : tab === "finished" ? (
            <>
              <span>Result</span>
              <strong>{match.resultText ?? "Winner pending"}</strong>
            </>
          ) : (
            <>
              <span className="match-hub-card__live-dot">Live</span>
              <strong>{match.scoreText}</strong>
            </>
          )}
        </div>
      </div>
      <div className="match-hub-card__foot">
        <span>{match.seriesLabel}</span>
        <span>{tab === "live" ? "Open detail" : match.statusText}</span>
      </div>
    </Link>
  );
}

function MatchDeck({
  title,
  subtitle,
  groups,
  tab
}: {
  title: string;
  subtitle: string;
  groups: Array<{ label: string; matches: PublicCenterMatch[] }>;
  tab: MatchTabKey;
}) {
  return (
    <section className="public-board public-match-deck">
      <div className="public-section__head">
        <p className="public-section__eyebrow">{tab === "live" ? "Live Matches" : tab === "upcoming" ? "Upcoming Matches" : "Finished Matches"}</p>
        <h2>{title}</h2>
        <p className="muted">{subtitle}</p>
      </div>
      <div className="match-hub-groups">
        {groups.length === 0 ? (
          <p className="muted">No matches available in this section right now.</p>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="match-hub-group">
              <div className="match-hub-group__head">
                <h3>{group.label}</h3>
                <span>{group.matches.length} match{group.matches.length === 1 ? "" : "es"}</span>
              </div>
              <div className="match-hub-group__list">
                {group.matches.map((match) => (
                  <MatchCard key={match.id} match={match} tab={tab} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </section>
  );
}

function TournamentBoard({ board, boardIndex }: { board: PublicTournamentBoard; boardIndex: number }) {
  return (
    <article className="tournament-board">
      <div className="tournament-board__head">
        <div>
          <p className="public-section__eyebrow">Tournament Board</p>
          <h3>{board.tournament.name}</h3>
          <p className="muted">
            {board.tournament.city ?? board.tournament.regionId.toUpperCase()} - {board.tournament.format ?? "Format pending"} -{" "}
            {formatTournamentWindow(board.tournament.startDate, board.tournament.endDate)}
          </p>
        </div>
        <div className="tournament-board__chips">
          <span className="public-tag">{board.liveMatches.length} live</span>
          <span className="public-tag">{board.upcomingMatches.length} upcoming</span>
          <span className="public-tag">{board.finishedMatches.length} finished</span>
        </div>
      </div>

      <TournamentPulseGraph board={board} />

      <div className="tournament-board__grid">
        <section className="tournament-board__panel">
          <div className="public-section__head public-section__head--compact">
            <p className="public-section__eyebrow">Schedule</p>
            <h4>Matches</h4>
          </div>
          <div className="tournament-board__match-list">
            {board.liveMatches.length + board.upcomingMatches.length + board.finishedMatches.length === 0 ? (
              <p className="muted">No matches are mapped to this tournament yet.</p>
            ) : (
              [...board.liveMatches, ...board.upcomingMatches.slice(0, 3), ...board.finishedMatches.slice(0, 2)].map((match) => (
                <Link key={match.id} href={`/public/matches/${match.id}` as Route} className="tournament-board__match-item">
                  <strong>
                    {match.teamAName} vs {match.teamBName}
                  </strong>
                  <span>{match.state === "SCHEDULED" ? formatTime(match.startAt) : match.state === "COMPLETED" ? match.resultText ?? "Finished" : match.scoreText}</span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="tournament-board__panel" id={boardIndex === 0 ? "points-table" : undefined}>
          <div className="public-section__head public-section__head--compact">
            <p className="public-section__eyebrow">Points Table</p>
            <h4>Standings</h4>
          </div>
          <div className="tournament-table-wrap">
            <table className="tournament-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>P</th>
                  <th>W</th>
                  <th>L</th>
                  <th>Pts</th>
                  <th>NRR</th>
                </tr>
              </thead>
              <tbody>
                {board.pointsTable.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No points table rows yet.</td>
                  </tr>
                ) : (
                  board.pointsTable.map((row) => (
                    <tr key={row.id}>
                      <td>{row.teamName}</td>
                      <td>{row.played}</td>
                      <td>{row.won}</td>
                      <td>{row.lost}</td>
                      <td>{row.points}</td>
                      <td>{formatNrr(row.netRunRate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="tournament-board__panel" id={boardIndex === 0 ? "rankings" : undefined}>
          <div className="public-section__head public-section__head--compact">
            <p className="public-section__eyebrow">Player Rankings</p>
            <h4>Tournament Leaders</h4>
          </div>
          <div className="tournament-rank-grid">
            <div className="tournament-rank-column">
              <strong>Top Runs</strong>
              {board.rankings.runs.length === 0 ? (
                <p className="muted">No batting data yet.</p>
              ) : (
                board.rankings.runs.map((entry, index) => (
                  <Link key={entry.playerId} href={`/public/players/${entry.playerId}` as Route} className="tournament-rank-item">
                    <span>#{index + 1}</span>
                    <p>{entry.playerName}</p>
                    <strong>{entry.runs}</strong>
                  </Link>
                ))
              )}
            </div>
            <div className="tournament-rank-column">
              <strong>Top Wickets</strong>
              {board.rankings.wickets.length === 0 ? (
                <p className="muted">No bowling data yet.</p>
              ) : (
                board.rankings.wickets.map((entry, index) => (
                  <Link key={entry.playerId} href={`/public/players/${entry.playerId}` as Route} className="tournament-rank-item">
                    <span>#{index + 1}</span>
                    <p>{entry.playerName}</p>
                    <strong>{entry.wickets}</strong>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}

export default function PublicMatchHub({
  liveMatches,
  upcomingMatches,
  finishedMatches,
  tournamentBoards
}: {
  liveMatches: PublicCenterMatch[];
  upcomingMatches: PublicCenterMatch[];
  finishedMatches: PublicCenterMatch[];
  tournamentBoards: PublicTournamentBoard[];
}) {
  const defaultTab: MatchTabKey = liveMatches.length > 0 ? "live" : upcomingMatches.length > 0 ? "upcoming" : "finished";
  const [activeTab, setActiveTab] = useState<MatchTabKey>(defaultTab);
  const [seriesFilter, setSeriesFilter] = useState("All");

  const seriesOptions = useMemo(
    () => [
      "All",
      ...new Set([...liveMatches, ...upcomingMatches, ...finishedMatches].map((match) => match.seriesLabel))
    ],
    [finishedMatches, liveMatches, upcomingMatches]
  );

  const filteredLive = useMemo(
    () => liveMatches.filter((match) => seriesFilter === "All" || match.seriesLabel === seriesFilter),
    [liveMatches, seriesFilter]
  );
  const filteredUpcoming = useMemo(
    () => upcomingMatches.filter((match) => seriesFilter === "All" || match.seriesLabel === seriesFilter),
    [seriesFilter, upcomingMatches]
  );
  const filteredFinished = useMemo(
    () => finishedMatches.filter((match) => seriesFilter === "All" || match.seriesLabel === seriesFilter),
    [finishedMatches, seriesFilter]
  );

  const tabConfig = {
    live: {
      label: `Live (${liveMatches.length})`,
      title: "Live matches with tournament and series context",
      subtitle: "Every live card shows which teams are playing, in which tournament or series, and what is happening right now.",
      groups: groupBySeries(filteredLive)
    },
    upcoming: {
      label: `Upcoming (${upcomingMatches.length})`,
      title: "Upcoming schedule across tournaments and series",
      subtitle: "Scheduled matches are grouped by day, with their tournament name, venue, and start time visible on each card.",
      groups: groupByDay(filteredUpcoming)
    },
    finished: {
      label: `Finished (${finishedMatches.length})`,
      title: "Finished matches and winners",
      subtitle: "Completed matches stay visible with tournament labels and the recorded winner or published result.",
      groups: groupByDay(filteredFinished)
    }
  } satisfies Record<
    MatchTabKey,
    {
      label: string;
      title: string;
      subtitle: string;
      groups: Array<{ label: string; matches: PublicCenterMatch[] }>;
    }
  >;

  return (
    <section id="matches" className="public-board public-match-shell">
      <div className="public-section__head">
        <p className="public-section__eyebrow">Matches</p>
        <h2>Public match center</h2>
        <p className="muted">
          Live, upcoming, and finished matches stay separate, while each tournament gets its own schedule, points table, and player ranking board.
        </p>
      </div>

      <div className="public-match-tabs">
        {(Object.keys(tabConfig) as MatchTabKey[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`public-match-tabs__tab${activeTab === tab ? " public-match-tabs__tab--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tabConfig[tab].label}
          </button>
        ))}
      </div>

      <div className="public-match-filters">
        {seriesOptions.map((series) => (
          <button
            key={series}
            type="button"
            className={`public-match-filters__chip${seriesFilter === series ? " public-match-filters__chip--active" : ""}`}
            onClick={() => setSeriesFilter(series)}
          >
            {series}
          </button>
        ))}
      </div>

      <MatchDeck tab={activeTab} title={tabConfig[activeTab].title} subtitle={tabConfig[activeTab].subtitle} groups={tabConfig[activeTab].groups} />

      <section id="tournaments" className="public-board public-tournament-board-section">
        <div className="public-section__head">
          <p className="public-section__eyebrow">Tournaments</p>
          <h2>Schedules, points tables, and player rankings</h2>
          <p className="muted">
            Every approved tournament gets its own public board with scheduled matches, standings, and top performers.
          </p>
        </div>
        <div className="tournament-board-list">
          {tournamentBoards.length === 0 ? (
            <p className="muted">No approved tournament boards are public yet.</p>
          ) : (
            tournamentBoards.map((board, index) => <TournamentBoard key={board.tournament.id} board={board} boardIndex={index} />)
          )}
        </div>
      </section>
    </section>
  );
}
