"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicCenterMatch } from "@/lib/db-store";

type RailFilter = "all" | "live" | "upcoming" | "finished";

function formatRailTime(value: string) {
  return new Date(value).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getStatusLabel(match: PublicCenterMatch) {
  if (match.state === "LIVE" || match.state === "INNINGS_BREAK") {
    return "Live";
  }

  if (match.state === "SCHEDULED") {
    return "Upcoming";
  }

  return "Finished";
}

export default function PublicMatchRail({
  liveMatches,
  upcomingMatches,
  finishedMatches,
  title = "Featured Matches",
  subtitle = "Live, scheduled, and upcoming matches stay visible first."
}: {
  liveMatches: PublicCenterMatch[];
  upcomingMatches: PublicCenterMatch[];
  finishedMatches: PublicCenterMatch[];
  title?: string;
  subtitle?: string;
}) {
  const [filter, setFilter] = useState<RailFilter>("all");

  const allMatches = useMemo(
    () =>
      [...liveMatches, ...upcomingMatches, ...finishedMatches].sort(
        (left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime()
      ),
    [finishedMatches, liveMatches, upcomingMatches]
  );

  const visibleMatches = useMemo(() => {
    if (filter === "live") {
      return liveMatches;
    }

    if (filter === "upcoming") {
      return upcomingMatches;
    }

    if (filter === "finished") {
      return finishedMatches;
    }

    return allMatches;
  }, [allMatches, filter, finishedMatches, liveMatches, upcomingMatches]);

  const filters: Array<{ id: RailFilter; label: string }> = [
    { id: "all", label: `All (${allMatches.length})` },
    { id: "live", label: `Live (${liveMatches.length})` },
    { id: "upcoming", label: `Upcoming (${upcomingMatches.length})` },
    { id: "finished", label: `Finished (${finishedMatches.length})` }
  ];

  return (
    <section id="matches" className="public-match-rail public-app-card">
      <div className="public-section__head public-section__head--compact">
        <p className="public-section__eyebrow">Matches</p>
        <h2>{title}</h2>
        <p className="muted">{subtitle}</p>
      </div>

      <div className="public-match-rail__filters">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`public-match-rail__filter${filter === item.id ? " public-match-rail__filter--active" : ""}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="public-match-rail__track">
        {visibleMatches.length === 0 ? (
          <p className="muted">No matches available in this section right now.</p>
        ) : (
          visibleMatches.map((match) => (
            <Link
              key={match.id}
              href={`/public/matches/${match.id}` as Route}
              className={`public-match-rail-card public-match-rail-card--${match.state.toLowerCase()}`}
            >
              <div className="public-match-rail-card__head">
                <strong>{match.tournamentName}</strong>
                <span>{getStatusLabel(match)}</span>
              </div>
              <p className="public-match-rail-card__meta">{match.seriesLabel}</p>
              <p className="public-match-rail-card__venue">{match.venue ?? "Ground pending"}</p>
              <div className="public-match-rail-card__teams">
                <div className="public-match-rail-card__team-names">
                  <span>{match.teamAName}</span>
                  <span>{match.teamBName}</span>
                </div>
                <div className="public-match-rail-card__score">
                  <strong>{match.state === "SCHEDULED" ? formatRailTime(match.startAt) : match.scoreText}</strong>
                  <small>{match.state === "COMPLETED" ? match.resultText ?? "Finished" : match.statusText}</small>
                </div>
              </div>
              <p className="public-match-rail-card__summary">{match.resultText ?? match.statusText}</p>
              <div className="public-match-rail-card__foot">
                <span>Open match detail</span>
                <span>&gt;</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
