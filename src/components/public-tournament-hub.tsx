"use client";

import type { Route } from "next";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { PublicTournamentBoard } from "@/lib/db-store";
import type { Role } from "@/types/domain";

type TournamentHubLanguage = "en" | "ur";
type TournamentStatusTone = "open" | "ongoing" | "soon";

type TournamentHubCopy = {
  eyebrow: string;
  title: string;
  body: string;
  city: string;
  format: string;
  ballType: string;
  allCities: string;
  allFormats: string;
  allBallTypes: string;
  hostTournament: string;
  wizardPreview: string;
  previewBody: string;
  openForEntry: string;
  ongoing: string;
  startingSoon: string;
  prize: string;
  entry: string;
  teams: string;
  dates: string;
  viewDetailsApply: string;
  registrationLocked: string;
  applyViaTeam: string;
  noResults: string;
};

type PublicTournamentHubProps = {
  tournamentBoards: PublicTournamentBoard[];
  isSignedIn: boolean;
  role?: Role;
  language: TournamentHubLanguage;
  copy: TournamentHubCopy;
};

type TournamentHubCard = {
  id: string;
  name: string;
  city: string;
  venue: string;
  format: string;
  ballType: string;
  startDate?: string;
  endDate?: string;
  totalTeams?: number;
  status: TournamentStatusTone;
  prizeLabel: string;
  entryLabel: string;
  liveCount: number;
  upcomingCount: number;
  finishedCount: number;
  theme: "emerald" | "blue" | "sunset" | "night";
};

function formatDateRange(startDate?: string, endDate?: string) {
  if (!startDate) {
    return "Dates pending";
  }

  const start = new Date(startDate).toLocaleDateString("en-PK", {
    month: "short",
    day: "numeric"
  });

  if (!endDate) {
    return start;
  }

  const end = new Date(endDate).toLocaleDateString("en-PK", {
    month: "short",
    day: "numeric"
  });

  return `${start} - ${end}`;
}

function toCurrencyLabel(value: number) {
  return new Intl.NumberFormat("en-PK", {
    maximumFractionDigits: 0
  }).format(value);
}

function deriveStatus(board: PublicTournamentBoard): TournamentStatusTone {
  if (board.liveMatches.length > 0) {
    return "ongoing";
  }

  const startDate = board.tournament.startDate ? new Date(board.tournament.startDate).getTime() : undefined;
  const now = Date.now();
  const daysUntilStart = startDate ? Math.ceil((startDate - now) / (1000 * 60 * 60 * 24)) : undefined;

  if ((typeof daysUntilStart === "number" && daysUntilStart <= 10) || board.upcomingMatches.length > 0) {
    return "soon";
  }

  return "open";
}

function deriveTheme(format?: string): TournamentHubCard["theme"] {
  if (!format) {
    return "emerald";
  }

  const normalized = format.toLowerCase();
  if (normalized.includes("one")) {
    return "blue";
  }
  if (normalized.includes("10")) {
    return "sunset";
  }
  if (normalized.includes("test")) {
    return "night";
  }
  return "emerald";
}

function derivePrize(totalTeams?: number, format?: string) {
  const teamFactor = (totalTeams ?? 8) * 15000;
  const formatFactor = format?.includes("10") ? 50000 : format?.toLowerCase().includes("one") ? 180000 : 120000;
  return `PKR ${toCurrencyLabel(teamFactor + formatFactor)}`;
}

function deriveEntry(totalTeams?: number, format?: string) {
  const teamFactor = Math.max(4000, (totalTeams ?? 8) * 600);
  const formatFactor = format?.includes("10") ? 2500 : format?.toLowerCase().includes("one") ? 6000 : 4500;
  return `PKR ${toCurrencyLabel(teamFactor + formatFactor)}`;
}

function buildHostHref(role?: Role): Route {
  if (role === "TOURNAMENT_ADMIN") {
    return "/admin/tournament";
  }
  if (role === "SUPER_ADMIN") {
    return "/admin/super";
  }
  return "/register-tournament";
}

function buildApplyHref(isSignedIn: boolean, role?: Role): Route {
  if (!isSignedIn) {
    return "/signup?next=/get-started" as Route;
  }
  if (role === "TEAM_ADMIN") {
    return "/team?tab=tournaments" as Route;
  }
  return "/get-started" as Route;
}

export default function PublicTournamentHub({
  tournamentBoards,
  isSignedIn,
  role,
  language,
  copy
}: PublicTournamentHubProps) {
  const [cityFilter, setCityFilter] = useState("ALL");
  const [formatFilter, setFormatFilter] = useState("ALL");
  const [ballTypeFilter, setBallTypeFilter] = useState("ALL");

  const cards = useMemo(() => {
    return tournamentBoards
      .filter((board) => {
        if (!board.tournament.startDate) {
          return true;
        }

        const endDate = board.tournament.endDate ? new Date(board.tournament.endDate).getTime() : undefined;
        if (!endDate) {
          return true;
        }

        return !(endDate < Date.now() && board.liveMatches.length === 0 && board.upcomingMatches.length === 0);
      })
      .map((board) => ({
        id: board.tournament.id,
        name: board.tournament.name,
        city: board.tournament.city ?? "City pending",
        venue: board.tournament.venue ?? "Venue pending",
        format: board.tournament.format ?? "Format pending",
        ballType: board.tournament.ballType ?? "Ball type pending",
        startDate: board.tournament.startDate,
        endDate: board.tournament.endDate,
        totalTeams: board.tournament.totalTeams,
        status: deriveStatus(board),
        prizeLabel: derivePrize(board.tournament.totalTeams, board.tournament.format),
        entryLabel: deriveEntry(board.tournament.totalTeams, board.tournament.format),
        liveCount: board.liveMatches.length,
        upcomingCount: board.upcomingMatches.length,
        finishedCount: board.finishedMatches.length,
        theme: deriveTheme(board.tournament.format)
      }));
  }, [tournamentBoards]);

  const cityOptions = useMemo(() => ["ALL", ...new Set(cards.map((card) => card.city).filter(Boolean))], [cards]);
  const formatOptions = useMemo(() => ["ALL", ...new Set(cards.map((card) => card.format).filter(Boolean))], [cards]);
  const ballTypeOptions = useMemo(() => ["ALL", ...new Set(cards.map((card) => card.ballType).filter(Boolean))], [cards]);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (cityFilter !== "ALL" && card.city !== cityFilter) {
        return false;
      }
      if (formatFilter !== "ALL" && card.format !== formatFilter) {
        return false;
      }
      if (ballTypeFilter !== "ALL" && card.ballType !== ballTypeFilter) {
        return false;
      }
      return true;
    });
  }, [ballTypeFilter, cards, cityFilter, formatFilter]);

  const previewCard = filteredCards[0] ?? cards[0];
  const applyHref = buildApplyHref(isSignedIn, role);

  function statusLabel(status: TournamentStatusTone) {
    if (status === "ongoing") {
      return copy.ongoing;
    }
    if (status === "soon") {
      return copy.startingSoon;
    }
    return copy.openForEntry;
  }

  return (
    <section className="tournament-hub" id="public-desktop-tournaments">
      <div className="tournament-hub__head">
        <div>
          <p className="desktop-public-dashboard__eyebrow">{copy.eyebrow}</p>
          <h2>{copy.title}</h2>
          <p className="desktop-public-dashboard__muted">{copy.body}</p>
        </div>
        <div className="tournament-hub__toolbar">
          <label className="tournament-hub__filter">
            <span>{copy.city}</span>
            <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
              {cityOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? copy.allCities : option}
                </option>
              ))}
            </select>
          </label>
          <label className="tournament-hub__filter">
            <span>{copy.format}</span>
            <select value={formatFilter} onChange={(event) => setFormatFilter(event.target.value)}>
              {formatOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? copy.allFormats : option}
                </option>
              ))}
            </select>
          </label>
          <label className="tournament-hub__filter">
            <span>{copy.ballType}</span>
            <select value={ballTypeFilter} onChange={(event) => setBallTypeFilter(event.target.value)}>
              {ballTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "ALL" ? copy.allBallTypes : option}
                </option>
              ))}
            </select>
          </label>
          {isSignedIn ? (
            <Link href={buildHostHref(role)} className="tournament-hub__host">
              + {copy.hostTournament}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="tournament-hub__layout">
        <div className="tournament-hub__grid">
          {filteredCards.length === 0 ? (
            <article className="tournament-hub__empty">{copy.noResults}</article>
          ) : (
            filteredCards.map((card) => (
              <article key={card.id} className="tournament-hub__card">
                <div className={`tournament-hub__poster tournament-hub__poster--${card.theme}`}>
                  <div className="tournament-hub__poster-overlay" />
                  <span className={`tournament-hub__status tournament-hub__status--${card.status}`}>{statusLabel(card.status)}</span>
                  <small>{card.city}</small>
                  <strong>{card.name}</strong>
                  <span>{card.format}</span>
                </div>

                <div className="tournament-hub__body">
                  <div className="tournament-hub__meta">
                    <strong>{card.name}</strong>
                    <p>
                      {card.city} | {card.venue}
                    </p>
                    <p>
                      {copy.dates}: {formatDateRange(card.startDate, card.endDate)}
                    </p>
                  </div>

                  <div className="tournament-hub__numbers">
                    <article>
                      <span>{copy.prize}</span>
                      <strong>{card.prizeLabel}</strong>
                    </article>
                    <article>
                      <span>{copy.entry}</span>
                      <strong>{card.entryLabel}</strong>
                    </article>
                  </div>

                  <div className="tournament-hub__chips">
                    <span className="pill">
                      {copy.teams}: {card.totalTeams ?? "-"}
                    </span>
                    <span className="pill">{card.ballType}</span>
                    <span className="pill">{card.liveCount} live</span>
                    <span className="pill">{card.upcomingCount} upcoming</span>
                  </div>

                  {card.status === "open" ? (
                    <Link href={applyHref} className="tournament-hub__apply">
                      {copy.viewDetailsApply}
                    </Link>
                  ) : (
                    <span className="tournament-hub__locked">{copy.registrationLocked}</span>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="tournament-hub__preview">
          <p className="desktop-public-dashboard__eyebrow">{copy.wizardPreview}</p>
          <h3>{previewCard?.name ?? copy.hostTournament}</h3>
          <p>{copy.previewBody}</p>

          {previewCard ? (
            <div className={`tournament-hub__preview-card tournament-hub__preview-card--${previewCard.theme}`}>
              <span className={`tournament-hub__status tournament-hub__status--${previewCard.status}`}>{statusLabel(previewCard.status)}</span>
              <strong>{previewCard.name}</strong>
              <p>
                {previewCard.city} | {previewCard.format} | {previewCard.ballType}
              </p>
              <small>
                {previewCard.prizeLabel} prize pool | {previewCard.entryLabel} entry
              </small>
            </div>
          ) : null}

          <div className="tournament-hub__preview-stats">
            <article>
              <span>{copy.openForEntry}</span>
              <strong>{cards.filter((card) => card.status === "open").length}</strong>
            </article>
            <article>
              <span>{copy.ongoing}</span>
              <strong>{cards.filter((card) => card.status === "ongoing").length}</strong>
            </article>
            <article>
              <span>{copy.startingSoon}</span>
              <strong>{cards.filter((card) => card.status === "soon").length}</strong>
            </article>
          </div>

          <p className="desktop-public-dashboard__muted">{copy.applyViaTeam}</p>
          {isSignedIn ? (
            <Link href={buildHostHref(role)} className="tournament-hub__preview-link">
              + {copy.hostTournament}
            </Link>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
