"use client";

import { useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useSession } from "next-auth/react";
import PublicTournamentHub from "@/components/public-tournament-hub";
import type { PublicCenterMatch, PublicTournamentBoard } from "@/lib/db-store";

type DesktopFilter = "ongoing" | "upcoming" | "results" | "domestic";
type DesktopLanguage = "en" | "ur";

type LeaderboardEntry = {
  id: string;
  label: string;
  metric: string;
  value: number;
};

type NewsItem = {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
};

type FantasyPlayer = {
  id: string;
  name: string;
  teamName: string;
  roleNote: string;
  points: number;
};

type VoteOption = {
  id: string;
  label: string;
  note: string;
};

type PublicDesktopDashboardProps = {
  liveMatches: PublicCenterMatch[];
  upcomingMatches: PublicCenterMatch[];
  finishedMatches: PublicCenterMatch[];
  tournamentBoards: PublicTournamentBoard[];
  news: NewsItem[];
  leaderboard: LeaderboardEntry[];
  spotlight?: PublicCenterMatch;
  voteOptions: VoteOption[];
  fantasyPlayers: FantasyPlayer[];
};

const COPY = {
  en: {
    brand: "PakScorer Live",
    home: "Home",
    matches: "Matches",
    tournaments: "Tournaments",
    predictions: "Predictions",
    fantasy: "Fantasy",
    news: "News",
    login: "Log In / Register",
    hostTournament: "Host Tournament",
    ongoing: "Ongoing",
    upcoming: "Upcoming",
    results: "Results",
    domestic: "Domestic Leagues",
    live: "Live",
    latestNews: "Latest News",
    newNews: "New News",
    playerOfWeek: "Player of the Week",
    upcomingFixture: "Upcoming Fixture",
    dailyPredictions: "Daily Predictions",
    dailyQuestion: "Who will win today?",
    topRunsQuestion: "Who will score the most runs?",
    fantasyFive: "Fantasy 5",
    playNow: "Play Now",
    buildFive: "Build a 5-player squad and track live points.",
    leaderboards: "Leaderboards",
    pointsTable: "Points Table",
    shareWhatsapp: "Share to WhatsApp",
    openMatch: "Open Match Center",
    tossPending: "Toss update in match center",
    noMatches: "No matches available in this view right now.",
    noNews: "No public news published yet.",
    noTable: "Points table activates once matches are completed.",
    rewardLine: "Correct picks can unlock points and small reward draws.",
    selected: "Selected",
    livePoints: "Live Points",
    urdu: "Urdu",
    tournamentHubEyebrow: "Tournament Hub",
    tournamentHubTitle: "Active and upcoming tournaments for teams to browse and join",
    tournamentHubBody:
      "Tournament cards keep prize, entry, format, and location visible so teams can decide quickly. The host action only appears for signed-in users.",
    city: "City",
    formatFilter: "Format",
    ballTypeFilter: "Ball Type",
    allCities: "All cities",
    allFormats: "All formats",
    allBallTypes: "All ball types",
    wizardPreview: "Creator Wizard Preview",
    previewBody: "This live preview shows how a hosted tournament card will look before teams see it in the public hub.",
    openForEntry: "Open for Entry",
    startingSoon: "Starting Soon",
    prize: "Prize",
    entry: "Entry",
    teams: "Teams",
    dates: "Dates",
    viewDetailsApply: "View Details / Apply",
    registrationLocked: "Registration locked",
    applyViaTeam: "Teams apply from their own dashboard, while organizers host tournaments from the registration flow.",
    noTournamentResults: "No tournaments match these filters right now."
  },
  ur: {
    brand: "PakScorer Live",
    home: "Home",
    matches: "Matches",
    tournaments: "Tournament Hub",
    predictions: "Predictions",
    fantasy: "Fantasy",
    news: "News",
    login: "Log In / Register",
    hostTournament: "Host Tournament",
    ongoing: "Live",
    upcoming: "Upcoming",
    results: "Results",
    domestic: "Domestic Leagues",
    live: "Live",
    latestNews: "Latest News",
    newNews: "New News",
    playerOfWeek: "Player of the Week",
    upcomingFixture: "Upcoming Fixture",
    dailyPredictions: "Rozana Predictions",
    dailyQuestion: "Aaj kaun jeetega?",
    topRunsQuestion: "Sab se zyada runs kaun banayega?",
    fantasyFive: "Fantasy 5",
    playNow: "Play Now",
    buildFive: "5 players chunain aur live points track karein.",
    leaderboards: "Leaderboards",
    pointsTable: "Points Table",
    shareWhatsapp: "Share to WhatsApp",
    openMatch: "Open Match Center",
    tossPending: "Toss update match center mein milegi",
    noMatches: "Is view mein abhi koi match nazar nahin aa raha.",
    noNews: "Abhi koi public news publish nahin hui.",
    noTable: "Points table match complete hone par active hogi.",
    rewardLine: "Sahi picks par points aur small reward draws mil sakte hain.",
    selected: "Selected",
    livePoints: "Live Points",
    urdu: "Urdu",
    tournamentHubEyebrow: "Tournament Hub",
    tournamentHubTitle: "Active aur upcoming tournaments jo teams browse aur join kar sakti hain",
    tournamentHubBody:
      "Prize, entry, format, aur location ek hi card par dikhte hain. Host action sirf signed-in users ko nazar aata hai.",
    city: "City",
    formatFilter: "Format",
    ballTypeFilter: "Ball Type",
    allCities: "All cities",
    allFormats: "All formats",
    allBallTypes: "All ball types",
    wizardPreview: "Creator Wizard Preview",
    previewBody: "Ye live preview dikhata hai ke hosted tournament card public hub me kaisa nazar aayega.",
    openForEntry: "Open for Entry",
    startingSoon: "Starting Soon",
    prize: "Prize",
    entry: "Entry",
    teams: "Teams",
    dates: "Dates",
    viewDetailsApply: "View Details / Apply",
    registrationLocked: "Registration locked",
    applyViaTeam: "Teams apne dashboard se apply karti hain, aur organizers registration flow se host karte hain.",
    noTournamentResults: "In filters ke sath abhi koi tournament match nahin karta."
  }
} as const;

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-PK", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatNewsDate(value: string) {
  return new Date(value).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short"
  });
}

function statusTone(match: PublicCenterMatch) {
  if (match.state === "LIVE" || match.state === "INNINGS_BREAK") {
    return "live";
  }
  if (match.state === "COMPLETED") {
    return "finished";
  }
  return "upcoming";
}

function statusLabel(match: PublicCenterMatch, copy: (typeof COPY)[DesktopLanguage]) {
  if (match.state === "LIVE" || match.state === "INNINGS_BREAK") {
    return copy.live;
  }
  if (match.state === "COMPLETED") {
    return copy.results;
  }
  return copy.upcoming;
}

function buildWhatsappHref(match: PublicCenterMatch) {
  const text = `${match.teamAName} vs ${match.teamBName}\n${match.tournamentName}\n${match.scoreText}\n${match.resultText ?? match.statusText}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

function PointsTrendChart({
  rows
}: {
  rows: PublicTournamentBoard["pointsTable"];
}) {
  if (rows.length === 0) {
    return null;
  }

  const chartRows = rows.slice(0, 5);
  const maxPoints = Math.max(...chartRows.map((row) => row.points), 1);

  return (
    <div className="desktop-public-dashboard__points-chart" aria-label="Points chart">
      {chartRows.map((row) => (
        <div key={row.id} className="desktop-public-dashboard__points-row">
          <div className="desktop-public-dashboard__points-label">
            <strong>{row.teamName}</strong>
            <span>{row.points} pts</span>
          </div>
          <div className="desktop-public-dashboard__points-track">
            <span
              className="desktop-public-dashboard__points-fill"
              style={{ width: `${Math.max((row.points / maxPoints) * 100, 12)}%` }}
            />
          </div>
          <small>NRR {row.netRunRate >= 0 ? `+${row.netRunRate.toFixed(2)}` : row.netRunRate.toFixed(2)}</small>
        </div>
      ))}
    </div>
  );
}

export default function PublicDesktopDashboard({
  liveMatches,
  upcomingMatches,
  finishedMatches,
  tournamentBoards,
  news,
  leaderboard,
  spotlight,
  voteOptions,
  fantasyPlayers
}: PublicDesktopDashboardProps) {
  const { data: session, status } = useSession();
  const [filter, setFilter] = useState<DesktopFilter>("ongoing");
  const [language, setLanguage] = useState<DesktopLanguage>("en");
  const [winnerPick, setWinnerPick] = useState("");
  const [runLeaderPick, setRunLeaderPick] = useState("");
  const [fantasyIds, setFantasyIds] = useState<string[]>([]);

  const copy = COPY[language];
  const storageSuffix = spotlight?.id ?? "public";
  const isSignedIn = status === "authenticated";
  const role = session?.user?.role;
  const teamHref = !isSignedIn ? ("/signup?next=/get-started" as Route) : role === "TEAM_ADMIN" ? ("/team" as Route) : ("/account" as Route);
  const hostTournamentHref =
    role === "TOURNAMENT_ADMIN" ? ("/admin/tournament" as Route) : role === "SUPER_ADMIN" ? ("/admin/super" as Route) : ("/register-tournament" as Route);
  const accountHref = isSignedIn ? ("/account" as Route) : ("/login?next=/get-started" as Route);
  const teamLabel = role === "TEAM_ADMIN" ? "Manage My Team" : "Register Team";
  const accountLabel = isSignedIn ? "My Account" : copy.login;

  useEffect(() => {
    const savedLanguage = window.localStorage.getItem("pakscorer-public-language");
    if (savedLanguage === "ur" || savedLanguage === "en") {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("pakscorer-public-language", language);
  }, [language]);

  useEffect(() => {
    const savedPrediction = window.localStorage.getItem(`pakscorer-desktop-prediction-${storageSuffix}`);
    const savedFantasy = window.localStorage.getItem(`pakscorer-desktop-fantasy-${storageSuffix}`);

    if (savedPrediction) {
      try {
        const parsed = JSON.parse(savedPrediction) as { winner?: string; runLeader?: string };
        setWinnerPick(parsed.winner ?? "");
        setRunLeaderPick(parsed.runLeader ?? "");
      } catch {
        setWinnerPick("");
        setRunLeaderPick("");
      }
    } else {
      setWinnerPick("");
      setRunLeaderPick("");
    }

    if (savedFantasy) {
      try {
        const parsed = JSON.parse(savedFantasy) as string[];
        setFantasyIds(parsed.slice(0, 5));
      } catch {
        setFantasyIds([]);
      }
    } else {
      setFantasyIds([]);
    }
  }, [storageSuffix]);

  const filterItems = useMemo(
    () => [
      { id: "ongoing" as const, label: copy.ongoing, count: liveMatches.length },
      { id: "upcoming" as const, label: copy.upcoming, count: upcomingMatches.length },
      { id: "results" as const, label: copy.results, count: finishedMatches.length },
      {
        id: "domestic" as const,
        label: copy.domestic,
        count: tournamentBoards.reduce(
          (sum, board) => sum + board.liveMatches.length + board.upcomingMatches.length + board.finishedMatches.length,
          0
        )
      }
    ],
    [copy, liveMatches.length, upcomingMatches.length, finishedMatches.length, tournamentBoards]
  );

  const visibleMatches = useMemo(() => {
    if (filter === "ongoing") {
      return liveMatches;
    }
    if (filter === "upcoming") {
      return upcomingMatches;
    }
    if (filter === "results") {
      return finishedMatches;
    }
    return tournamentBoards.flatMap((board) => [...board.liveMatches, ...board.upcomingMatches, ...board.finishedMatches]).slice(0, 8);
  }, [filter, liveMatches, upcomingMatches, finishedMatches, tournamentBoards]);

  const featureBoard = tournamentBoards[0];
  const playerOfWeek =
    featureBoard?.rankings.runs[0] ??
    (leaderboard[0]
      ? {
          playerId: leaderboard[0].id,
          playerName: leaderboard[0].label,
          runs: leaderboard[0].value
        }
      : undefined);
  const nextFixture = upcomingMatches[0];
  const selectedFantasyPlayers = fantasyPlayers.filter((player) => fantasyIds.includes(player.id));
  const fantasyPoints = selectedFantasyPlayers.reduce((sum, player) => sum + player.points, 0);

  function persistPrediction(nextWinner: string, nextRunLeader: string) {
    window.localStorage.setItem(
      `pakscorer-desktop-prediction-${storageSuffix}`,
      JSON.stringify({ winner: nextWinner, runLeader: nextRunLeader })
    );
  }

  function handleFantasyToggle(playerId: string) {
    setFantasyIds((current) => {
      let next = current;
      if (current.includes(playerId)) {
        next = current.filter((id) => id !== playerId);
      } else if (current.length < 5) {
        next = [...current, playerId];
      } else {
        return current;
      }

      window.localStorage.setItem(`pakscorer-desktop-fantasy-${storageSuffix}`, JSON.stringify(next));
      return next;
    });
  }

  return (
    <section className="desktop-public-dashboard">
      <header className="desktop-public-dashboard__topbar">
        <div className="desktop-public-dashboard__brand">
          <span className="desktop-public-dashboard__brand-mark" />
          <strong>{copy.brand}</strong>
        </div>

        <nav className="desktop-public-dashboard__nav" aria-label="Public navigation">
          <a href="/public" className="desktop-public-dashboard__nav-link desktop-public-dashboard__nav-link--active">
            {copy.home}
          </a>
          <a href="#public-desktop-matches" className="desktop-public-dashboard__nav-link">
            {copy.matches}
          </a>
          <a href="#public-desktop-tournaments" className="desktop-public-dashboard__nav-link">
            {copy.tournaments}
          </a>
          <a href="#public-desktop-predictions" className="desktop-public-dashboard__nav-link">
            {copy.predictions}
          </a>
          <a href="#public-desktop-fantasy" className="desktop-public-dashboard__nav-link">
            {copy.fantasy}
          </a>
          <a href="#public-desktop-news" className="desktop-public-dashboard__nav-link">
            {copy.news}
          </a>
        </nav>

        <div className="desktop-public-dashboard__top-actions">
          <button
            type="button"
            className={`desktop-public-dashboard__lang${language === "ur" ? " desktop-public-dashboard__lang--active" : ""}`}
            onClick={() => setLanguage((current) => (current === "en" ? "ur" : "en"))}
          >
            {copy.urdu}
          </button>
          <Link href={teamHref} className="desktop-public-dashboard__cta desktop-public-dashboard__cta--primary">
            {teamLabel}
          </Link>
          {isSignedIn ? (
            <Link href={hostTournamentHref} className="desktop-public-dashboard__cta desktop-public-dashboard__cta--soft">
              + {copy.hostTournament}
            </Link>
          ) : null}
          <Link href={accountHref} className="desktop-public-dashboard__auth">
            {accountLabel}
          </Link>
        </div>
      </header>

      <div className="desktop-public-dashboard__grid">
        <aside className="desktop-public-dashboard__sidebar">
          <div className="desktop-public-dashboard__panel">
            <div className="desktop-public-dashboard__sidebar-list">
              {filterItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`desktop-public-dashboard__sidebar-item${filter === item.id ? " desktop-public-dashboard__sidebar-item--active" : ""}`}
                  onClick={() => setFilter(item.id)}
                >
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="desktop-public-dashboard__content" id="public-desktop-matches">
          <div className="desktop-public-dashboard__content-head">
            <div>
              <p className="desktop-public-dashboard__eyebrow">{copy.matches}</p>
              <h1>{filterItems.find((item) => item.id === filter)?.label}</h1>
            </div>
            {spotlight ? (
              <Link href={`/public/matches/${spotlight.id}` as Route} className="desktop-public-dashboard__open-link">
                {copy.openMatch}
              </Link>
            ) : null}
          </div>

          <div className="desktop-public-dashboard__match-list">
            {visibleMatches.length === 0 ? (
              <article className="desktop-public-dashboard__empty">{copy.noMatches}</article>
            ) : (
              visibleMatches.map((match) => (
                <article key={match.id} className="desktop-public-dashboard__match-card">
                  <div className="desktop-public-dashboard__match-meta">
                    <span>{match.tournamentName}</span>
                    <span className={`desktop-public-dashboard__status desktop-public-dashboard__status--${statusTone(match)}`}>
                      {statusLabel(match, copy)}
                    </span>
                  </div>

                  <Link href={`/public/matches/${match.id}` as Route} className="desktop-public-dashboard__match-main">
                    <div className="desktop-public-dashboard__teams">
                      <div>
                        <strong>{match.teamAName}</strong>
                        <span>{match.teamAId}</span>
                      </div>
                      <div>
                        <strong>{match.teamBName}</strong>
                        <span>{match.teamBId}</span>
                      </div>
                    </div>

                    <div className="desktop-public-dashboard__score">
                      <strong>{match.scoreText}</strong>
                      <span>{match.resultText ?? match.statusText}</span>
                    </div>
                  </Link>

                  <div className="desktop-public-dashboard__match-foot">
                    <div>
                      <strong>{match.venue ?? "Venue pending"}</strong>
                      <span>{match.state === "SCHEDULED" ? formatDateTime(match.startAt) : copy.tossPending}</span>
                    </div>
                    <a
                      href={buildWhatsappHref(match)}
                      target="_blank"
                      rel="noreferrer"
                      className="desktop-public-dashboard__share"
                    >
                      {copy.shareWhatsapp}
                    </a>
                  </div>
                </article>
              ))
            )}
          </div>

          <PublicTournamentHub
            tournamentBoards={tournamentBoards}
            isSignedIn={isSignedIn}
            role={role}
            language={language}
            copy={{
              eyebrow: copy.tournamentHubEyebrow,
              title: copy.tournamentHubTitle,
              body: copy.tournamentHubBody,
              city: copy.city,
              format: copy.formatFilter,
              ballType: copy.ballTypeFilter,
              allCities: copy.allCities,
              allFormats: copy.allFormats,
              allBallTypes: copy.allBallTypes,
              hostTournament: copy.hostTournament,
              wizardPreview: copy.wizardPreview,
              previewBody: copy.previewBody,
              openForEntry: copy.openForEntry,
              ongoing: copy.ongoing,
              startingSoon: copy.startingSoon,
              prize: copy.prize,
              entry: copy.entry,
              teams: copy.teams,
              dates: copy.dates,
              viewDetailsApply: copy.viewDetailsApply,
              registrationLocked: copy.registrationLocked,
              applyViaTeam: copy.applyViaTeam,
              noResults: copy.noTournamentResults
            }}
          />
        </section>

        <aside className="desktop-public-dashboard__right">
          <section className="desktop-public-dashboard__widget" id="public-desktop-predictions">
            <div className="desktop-public-dashboard__widget-head">
              <p className="desktop-public-dashboard__eyebrow">{copy.dailyPredictions}</p>
              <h2>{copy.dailyQuestion}</h2>
            </div>
            <div className="desktop-public-dashboard__choice-group">
              {[spotlight?.teamAName, spotlight?.teamBName].filter(Boolean).map((teamName) => (
                <button
                  key={teamName}
                  type="button"
                  className={`desktop-public-dashboard__choice${winnerPick === teamName ? " desktop-public-dashboard__choice--active" : ""}`}
                  onClick={() => {
                    setWinnerPick(teamName!);
                    persistPrediction(teamName!, runLeaderPick);
                  }}
                >
                  {teamName}
                </button>
              ))}
            </div>
            <p className="desktop-public-dashboard__prompt">{copy.topRunsQuestion}</p>
            <div className="desktop-public-dashboard__choice-group desktop-public-dashboard__choice-group--stacked">
              {voteOptions.slice(0, 4).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`desktop-public-dashboard__choice${runLeaderPick === option.label ? " desktop-public-dashboard__choice--active" : ""}`}
                  onClick={() => {
                    setRunLeaderPick(option.label);
                    persistPrediction(winnerPick, option.label);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <small>{copy.rewardLine}</small>
          </section>

          <section className="desktop-public-dashboard__widget" id="public-desktop-fantasy">
            <div className="desktop-public-dashboard__widget-head">
              <p className="desktop-public-dashboard__eyebrow">{copy.fantasyFive}</p>
              <h2>{copy.playNow}</h2>
            </div>
            <p className="desktop-public-dashboard__prompt">{copy.buildFive}</p>
            <div className="desktop-public-dashboard__fantasy-stats">
              <article>
                <span>{copy.selected}</span>
                <strong>{fantasyIds.length}/5</strong>
              </article>
              <article>
                <span>{copy.livePoints}</span>
                <strong>{fantasyPoints}</strong>
              </article>
            </div>
            <div className="desktop-public-dashboard__fantasy-pool">
              {fantasyPlayers.slice(0, 8).map((player) => (
                <button
                  key={player.id}
                  type="button"
                  className={`desktop-public-dashboard__fantasy-player${fantasyIds.includes(player.id) ? " desktop-public-dashboard__fantasy-player--active" : ""}`}
                  onClick={() => handleFantasyToggle(player.id)}
                >
                  <strong>{player.name}</strong>
                  <span>
                    {player.teamName} | {player.roleNote}
                  </span>
                </button>
              ))}
            </div>
            {spotlight ? (
              <Link href={`/public/matches/${spotlight.id}` as Route} className="desktop-public-dashboard__play-link">
                {copy.playNow}
              </Link>
            ) : null}
          </section>

          <section className="desktop-public-dashboard__widget">
            <div className="desktop-public-dashboard__widget-head">
              <p className="desktop-public-dashboard__eyebrow">{copy.leaderboards}</p>
              <h2>{copy.leaderboards}</h2>
            </div>
            <div className="desktop-public-dashboard__leaderboard">
              {leaderboard.slice(0, 5).map((entry, index) => (
                <article key={entry.id} className="desktop-public-dashboard__leader-row">
                  <span>{index + 1}</span>
                  <div>
                    <strong>{entry.label}</strong>
                    <small>{entry.metric}</small>
                  </div>
                  <strong>{entry.value}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="desktop-public-dashboard__widget desktop-public-dashboard__widget--table">
            <div className="desktop-public-dashboard__widget-head">
              <p className="desktop-public-dashboard__eyebrow">{copy.pointsTable}</p>
              <h2>{featureBoard?.tournament.name ?? copy.pointsTable}</h2>
            </div>
            {featureBoard && featureBoard.pointsTable.length > 0 ? (
              <>
                <table className="desktop-public-dashboard__table">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>M</th>
                      <th>W</th>
                      <th>L</th>
                      <th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureBoard.pointsTable.slice(0, 5).map((row) => (
                      <tr key={row.id}>
                        <td>{row.teamName}</td>
                        <td>{row.played}</td>
                        <td>{row.won}</td>
                        <td>{row.lost}</td>
                        <td>{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <PointsTrendChart rows={featureBoard.pointsTable} />
              </>
            ) : (
              <p className="desktop-public-dashboard__muted">{copy.noTable}</p>
            )}
          </section>

          <section className="desktop-public-dashboard__widget" id="public-desktop-news">
            <div className="desktop-public-dashboard__widget-head">
              <p className="desktop-public-dashboard__eyebrow">{copy.latestNews}</p>
              <h2>{copy.latestNews}</h2>
            </div>
            <div className="desktop-public-dashboard__story-list">
              {news.length === 0 ? (
                <p className="desktop-public-dashboard__muted">{copy.noNews}</p>
              ) : (
                news.slice(0, 4).map((item) => (
                  <article key={item.id} className="desktop-public-dashboard__story">
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                    <span>{formatNewsDate(item.publishedAt)}</span>
                  </article>
                ))
              )}
            </div>
          </section>

          <section className="desktop-public-dashboard__widget">
            <div className="desktop-public-dashboard__widget-head">
              <p className="desktop-public-dashboard__eyebrow">{copy.playerOfWeek}</p>
              <h2>{playerOfWeek?.playerName ?? "-"}</h2>
            </div>
            <p className="desktop-public-dashboard__muted">
              {playerOfWeek ? `${playerOfWeek.runs} runs and current public momentum.` : "Weekly standouts will appear here from rankings."}
            </p>
          </section>

          <section className="desktop-public-dashboard__widget">
            <div className="desktop-public-dashboard__widget-head">
              <p className="desktop-public-dashboard__eyebrow">{copy.upcomingFixture}</p>
              <h2>{nextFixture ? `${nextFixture.teamAName} vs ${nextFixture.teamBName}` : "-"}</h2>
            </div>
            {nextFixture ? (
              <div className="desktop-public-dashboard__fixture">
                <strong>{nextFixture.tournamentName}</strong>
                <span>{nextFixture.venue ?? "Venue pending"}</span>
                <span>{formatDateTime(nextFixture.startAt)}</span>
              </div>
            ) : (
              <p className="desktop-public-dashboard__muted">Fixture will appear once scheduling is published.</p>
            )}
          </section>
        </aside>
      </div>

    </section>
  );
}


