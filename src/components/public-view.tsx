import Link from "next/link";
import PublicBottomNav from "@/components/public-bottom-nav";
import PublicDesktopDashboard from "@/components/public-desktop-dashboard";
import PublicHomeFlashDeck from "@/components/public-home-flash-deck";
import PublicMobileHeader from "@/components/public-mobile-header";
import PublicMatchRail from "@/components/public-match-rail";
import PublicMatchHub from "@/components/public-match-hub";
import {
  PublicFantasyPanel,
  PublicLiveFeed,
  PublicPredictionPanel,
  PublicSharePanel,
  PublicVotePanel,
  type PublicVoteOption
} from "@/components/public-interactions";
import { getPublicMatchCenterData, getPublicMatchDetailData } from "@/lib/db-store";

type PublicCenterData = Awaited<ReturnType<typeof getPublicMatchCenterData>>;
type PublicMatchDetailData = NonNullable<Awaited<ReturnType<typeof getPublicMatchDetailData>>>;

function formatKickoff(value: string) {
  return new Date(value).toLocaleString("en-PK", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatHomeTime(value: string) {
  return new Date(value).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  });
}

function describeMatch(match?: PublicCenterData["liveMatches"][number]) {
  if (!match) {
    return "No public match available";
  }

  return `${match.teamAName} vs ${match.teamBName}`;
}

function buildVoteOptions(data: PublicCenterData): PublicVoteOption[] {
  const firstTournamentWithRuns = data.tournamentBoards.find((board) => board.rankings.runs.length > 0);
  if (firstTournamentWithRuns) {
    return firstTournamentWithRuns.rankings.runs.slice(0, 2).map((entry, index) => ({
      id: entry.playerId,
      label: entry.playerName,
      note: index === 0 ? "Leading the tournament run chart." : "Close enough to change the match swing."
    }));
  }

  const fallback = data.overview.leaderboard.entries.slice(0, 2);
  if (fallback.length === 2) {
    return fallback.map((entry, index) => ({
      id: entry.subjectId,
      label: entry.label,
      note: index === 0 ? "Setting the pace on the public ladder." : "Still in the live spotlight."
    }));
  }

  return [
    { id: "batter-1", label: "Impact Batter", note: "Boundary pressure and clean timing." },
    { id: "bowler-1", label: "Strike Bowler", note: "Wicket threat and economy control." }
  ];
}

function buildFantasyPlayers(detail: PublicMatchDetailData) {
  const scoreByPlayerId = new Map<
    string,
    {
      batting?: PublicMatchDetailData["matchCenter"]["scorecard"]["batting"][number];
      bowling?: PublicMatchDetailData["matchCenter"]["scorecard"]["bowling"][number];
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
}

function PublicSpotlight({
  title,
  eyebrow,
  body,
  metricLabel,
  metricValue,
  meta
}: {
  title: string;
  eyebrow: string;
  body: string;
  metricLabel: string;
  metricValue: string;
  meta: string;
}) {
  return (
    <section className="public-command-board">
      <div className="public-command-board__copy">
        <p className="public-hero__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="public-hero__body">{body}</p>
      </div>
      <div className="public-command-board__signal">
        <span className="public-tag public-tag--live">{metricLabel}</span>
        <h2>{metricValue}</h2>
        <p>{meta}</p>
        <small>Public viewers only see match, tournament, standings, ranking, and news data. Internal admin data stays hidden.</small>
      </div>
    </section>
  );
}

function PublicTicker({ items }: { items: string[] }) {
  return (
    <section className="public-ribbon" aria-label="Live ticker">
      <div className={`public-ribbon__track${items.length <= 5 ? " public-ribbon__track--static" : ""}`}>
        {items.map((item) => (
          <span key={item} className="public-ribbon__pill">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function PublicTrafficBoard({ data }: { data: PublicCenterData }) {
  const bars = [
    { label: "Live", value: data.liveMatches.length, tone: "live" },
    { label: "Upcoming", value: data.upcomingMatches.length, tone: "upcoming" },
    { label: "Finished", value: data.finishedMatches.length, tone: "finished" },
    { label: "Tournaments", value: data.tournamentBoards.length, tone: "neutral" }
  ] as const;
  const maxValue = Math.max(...bars.map((item) => item.value), 1);

  return (
    <section className="public-traffic-board public-board">
      <div className="public-section__head">
        <p className="public-section__eyebrow">Platform Pulse</p>
        <h2>Match traffic and board coverage</h2>
        <p className="muted">The public side should explain what is active right now without making the home page noisy.</p>
      </div>
      <div className="public-traffic-board__grid">
        {bars.map((bar) => (
          <article key={bar.label} className={`public-traffic-board__card public-traffic-board__card--${bar.tone}`}>
            <div className="public-traffic-board__head">
              <span>{bar.label}</span>
              <strong>{bar.value}</strong>
            </div>
            <div className="public-traffic-board__track">
              <span className="public-traffic-board__fill" style={{ width: `${Math.max((bar.value / maxValue) * 100, 10)}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export async function PublicLandingView() {
  const data = await getPublicMatchCenterData();
  const liveSpotlight = data.liveMatches[0];
  const upcomingSpotlight = data.upcomingMatches[0];
  const finishedSpotlight = data.finishedMatches[0];
  const spotlight = liveSpotlight ?? upcomingSpotlight ?? finishedSpotlight;
  const spotlightDetail = spotlight ? await getPublicMatchDetailData(spotlight.id) : null;
  const voteOptions = buildVoteOptions(data);
  const fantasyPlayers = spotlightDetail ? buildFantasyPlayers(spotlightDetail) : [];
  const featuredTournament = data.tournamentBoards[0];
  const topRunLeader = featuredTournament?.rankings.runs[0]
    ? {
        label: featuredTournament.rankings.runs[0].playerName,
        value: featuredTournament.rankings.runs[0].runs
      }
    : (() => {
        const fallbackLeader = data.overview.leaderboard.entries.find((entry) => entry.metric === "RUNS");
        return fallbackLeader
          ? {
              label: fallbackLeader.label,
              value: fallbackLeader.value
            }
          : undefined;
      })();

  const flashCards = [
    {
      id: "flash-live",
      tone: "live" as const,
      eyebrow: liveSpotlight ? "Live Match" : "Live Center",
      title: describeMatch(liveSpotlight ?? spotlight),
      value: liveSpotlight?.scoreText ?? `${data.liveMatches.length} live matches`,
      meta: liveSpotlight
        ? `${liveSpotlight.tournamentName} - ${liveSpotlight.venue ?? "Ground pending"}`
        : "As soon as a match goes live, the public board highlights it here.",
      note: liveSpotlight ? "Ball-by-ball state with tournament context." : "Public live cards appear automatically.",
      href: "/public#matches" as const
    },
    {
      id: "flash-upcoming",
      tone: "upcoming" as const,
      eyebrow: "Upcoming",
      title: describeMatch(upcomingSpotlight),
      value: upcomingSpotlight ? formatHomeTime(upcomingSpotlight.startAt) : `${data.upcomingMatches.length} scheduled`,
      meta: upcomingSpotlight
        ? `${upcomingSpotlight.tournamentName} - ${upcomingSpotlight.venue ?? "Venue pending"}`
        : "Upcoming fixtures will show their tournament and start time here.",
      note: "Tomorrow's and later fixtures stay grouped under the tournament schedule.",
      href: "/public#matches" as const
    },
    {
      id: "flash-finished",
      tone: "finished" as const,
      eyebrow: "Finished",
      title: describeMatch(finishedSpotlight),
      value: finishedSpotlight?.resultText ?? `${data.finishedMatches.length} completed`,
      meta: finishedSpotlight
        ? `${finishedSpotlight.tournamentName} - ${finishedSpotlight.statusText}`
        : "Finished results stay public with winner visibility.",
      note: "Result blocks stay visible after the match ends.",
      href: "/public#matches" as const
    },
    {
      id: "flash-ranking",
      tone: "ranking" as const,
      eyebrow: "Ranking Watch",
      title: topRunLeader?.label ?? featuredTournament?.tournament.name ?? "Tournament Ladder",
      value: topRunLeader ? `${topRunLeader.value} runs` : `${featuredTournament?.pointsTable.length ?? 0} teams`,
      meta: featuredTournament
        ? `${featuredTournament.tournament.name} - ${featuredTournament.liveMatches.length} live, ${featuredTournament.upcomingMatches.length} upcoming`
        : "Approved tournaments get standings and rankings on the public board.",
      note: "Top performers and points tables refresh from match data.",
      href: "/public#rankings" as const
    }
  ];

  const tickerItems = [
    `${data.liveMatches.length} live matches on the public center`,
    upcomingSpotlight
      ? `Next up: ${describeMatch(upcomingSpotlight)} at ${formatHomeTime(upcomingSpotlight.startAt)}`
      : "Upcoming fixtures appear as soon as schedules are published",
    finishedSpotlight?.resultText ?? "Finished results remain visible with winner context",
    `${data.tournamentBoards.length} approved tournaments now have public boards`,
    topRunLeader ? `${topRunLeader.label} is leading the run charts` : "Player rankings activate from ball-by-ball data"
  ];

  const homeMatches = [liveSpotlight, upcomingSpotlight, ...data.upcomingMatches.slice(1, 3), finishedSpotlight].filter(
    (match): match is NonNullable<typeof match> => Boolean(match)
  );

  const homeTournamentBoards = data.tournamentBoards.slice(0, 3);

  return (
    <>
      <PublicDesktopDashboard
        liveMatches={data.liveMatches}
        upcomingMatches={data.upcomingMatches}
        finishedMatches={data.finishedMatches}
        tournamentBoards={data.tournamentBoards}
        news={data.overview.news}
        leaderboard={data.overview.leaderboard.entries.map((entry) => ({
          id: entry.subjectId,
          label: entry.label,
          metric: entry.metric,
          value: entry.value
        }))}
        spotlight={spotlight}
        voteOptions={voteOptions}
        fantasyPlayers={fantasyPlayers}
      />
      <main className="page-stack public-page public-page--landing public-landing-mobile-shell">
      <PublicMobileHeader showHomeLink />
      <section className="public-home-hero">
        <div className="public-home-hero__copy">
          <p className="public-hero__eyebrow">Pakistan Cricket Public Board</p>
          <h1>Live scores, series schedules, results, and rankings on one fast public surface.</h1>
          <p className="public-hero__body">
            PakScorer turns regional cricket into a proper public experience: live matches, upcoming fixtures, finished winners, tournament boards, points tables, and ranking ladders without exposing any internal operations.
          </p>
          <div className="public-home-hero__badges">
            <span className="site-badge site-badge--live">Live center active</span>
            <span className="site-badge">{data.tournamentBoards.length} tournaments public</span>
            <span className="site-badge">{data.upcomingMatches.length} upcoming fixtures</span>
          </div>
          <div className="public-hero__actions">
            <Link href="/public#matches" className="public-link">
              Open Match Center
            </Link>
            <Link href="/signup?next=/get-started" className="public-link public-link--ghost">
              Create Account
            </Link>
            <Link href="/login?next=/get-started" className="public-link public-link--soft">
              Sign In
            </Link>
          </div>
        </div>

        <PublicHomeFlashDeck cards={flashCards} />
      </section>

      <PublicMatchRail
        liveMatches={data.liveMatches}
        upcomingMatches={data.upcomingMatches}
        finishedMatches={data.finishedMatches}
        title="Top scrolling matches"
        subtitle="Live, scheduled, and upcoming matches appear first with tournament or series labels. Open any card for full match detail."
      />

      <PublicTicker items={tickerItems} />
      <PublicTrafficBoard data={data} />

      <section className="public-home-grid">
        <section className="public-board public-home-panel">
          <div className="public-section__head">
            <p className="public-section__eyebrow">Today On PakScorer</p>
            <h2>Fast public snapshots across live, upcoming, and finished fixtures</h2>
            <p className="muted">Every card stays tied to its tournament or series so the context never gets lost.</p>
          </div>
          <div className="public-home-panel__list">
            {homeMatches.length === 0 ? (
              <p className="muted">No matches are visible yet. As soon as fixtures are approved, they will appear here.</p>
            ) : (
              homeMatches.map((match) => (
                <article key={`${match.id}-home`} className="public-home-match">
                  <div className="public-home-match__copy">
                    <strong>
                      {match.teamAName} vs {match.teamBName}
                    </strong>
                    <p>
                      {match.tournamentName} - {match.venue ?? "Venue pending"}
                    </p>
                  </div>
                  <div className="public-home-match__meta">
                    <span>{match.state === "SCHEDULED" ? formatHomeTime(match.startAt) : match.statusText}</span>
                    <strong>{match.state === "COMPLETED" ? match.resultText ?? "Finished" : match.scoreText}</strong>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="public-board public-home-panel public-home-panel--stacked">
          <div className="public-section__head">
            <p className="public-section__eyebrow">Tournament Watch</p>
            <h2>Series boards with schedule, standings, and leaders</h2>
            <p className="muted">Approved tournaments automatically surface their match load, rankings, and points table visibility.</p>
          </div>
          <div className="public-home-panel__stack">
            {homeTournamentBoards.length === 0 ? (
              <p className="muted">No approved public tournaments yet.</p>
            ) : (
              homeTournamentBoards.map((board) => (
                <article key={board.tournament.id} className="public-home-tournament">
                  <div className="public-home-tournament__row">
                    <strong>{board.tournament.name}</strong>
                    <span>{board.tournament.format ?? "Format pending"}</span>
                  </div>
                  <div className="public-home-tournament__chips">
                    <span className="public-tag">{board.liveMatches.length} live</span>
                    <span className="public-tag">{board.upcomingMatches.length} upcoming</span>
                    <span className="public-tag">{board.finishedMatches.length} finished</span>
                  </div>
                  <p>
                    {board.pointsTable.length} teams on the table
                    {board.rankings.runs[0] ? ` - ${board.rankings.runs[0].playerName} leads with ${board.rankings.runs[0].runs} runs` : " - rankings will appear from score data"}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
      </main>
    </>
  );
}

export async function PublicCenterView() {
  const data = await getPublicMatchCenterData();
  const spotlight = data.liveMatches[0] ?? data.upcomingMatches[0] ?? data.finishedMatches[0];
  const spotlightDetail = spotlight ? await getPublicMatchDetailData(spotlight.id) : null;
  const voteOptions = buildVoteOptions(data);
  const fantasyPlayers = spotlightDetail ? buildFantasyPlayers(spotlightDetail) : [];

  return (
    <main className="public-app-shell">
      <PublicDesktopDashboard
        liveMatches={data.liveMatches}
        upcomingMatches={data.upcomingMatches}
        finishedMatches={data.finishedMatches}
        tournamentBoards={data.tournamentBoards}
        news={data.overview.news}
        leaderboard={data.overview.leaderboard.entries.map((entry) => ({
          id: entry.subjectId,
          label: entry.label,
          metric: entry.metric,
          value: entry.value
        }))}
        spotlight={spotlight}
        voteOptions={voteOptions}
        fantasyPlayers={fantasyPlayers}
      />
      <div className="public-mobile-app">
        <PublicMobileHeader />

        <section className="public-app-hero">
          <div className="public-app-hero__copy">
            <p className="public-section__eyebrow">Public Match Center</p>
            <h1>Live, upcoming, and finished matches in one clean mobile board.</h1>
            <p>
              Har match ke sath tournament ya series ka naam, venue, live score, result, schedule, aur deeper detail page attached rehta hai.
            </p>
          </div>
          <div className="public-app-hero__stats">
            <article>
              <span>Live</span>
              <strong>{data.liveMatches.length}</strong>
            </article>
            <article>
              <span>Upcoming</span>
              <strong>{data.upcomingMatches.length}</strong>
            </article>
            <article>
              <span>Finished</span>
              <strong>{data.finishedMatches.length}</strong>
            </article>
          </div>
          {spotlight ? (
            <div className="public-app-hero__spotlight">
              <small>{spotlight.tournamentName}</small>
              <strong>
                {spotlight.teamAName} vs {spotlight.teamBName}
              </strong>
              <span>{spotlight.state === "SCHEDULED" ? formatKickoff(spotlight.startAt) : spotlight.scoreText}</span>
              <p>{spotlight.resultText ?? spotlight.statusText}</p>
            </div>
          ) : null}
        </section>

        <div className="public-app-body">
          <PublicMatchRail
            liveMatches={data.liveMatches}
            upcomingMatches={data.upcomingMatches}
            finishedMatches={data.finishedMatches}
            title="Featured Matches"
            subtitle="Open any live, upcoming, or finished match to view its full public match center."
          />

          <section className="public-app-card public-entry-strip">
            <div className="public-section__head public-section__head--compact">
              <p className="public-section__eyebrow">Participate</p>
              <h3>Sign in first, then register a team or request a tournament.</h3>
              <p className="muted">Public users get a starter page after login with both options.</p>
            </div>
            <div className="public-hero__actions">
              <Link href="/signup?next=/get-started" className="public-link">
                Create Account
              </Link>
              <Link href="/login?next=/get-started" className="public-link public-link--soft">
                Sign In And Start
              </Link>
            </div>
          </section>

          <section className="public-app-card">
            <div className="public-section__head public-section__head--compact">
              <p className="public-section__eyebrow">Boards</p>
              <h3>Series, points table, schedules, and rankings</h3>
              <p className="muted">Approved tournaments automatically open their own public blocks below.</p>
            </div>
            <PublicMatchHub
              liveMatches={data.liveMatches}
              upcomingMatches={data.upcomingMatches}
              finishedMatches={data.finishedMatches}
              tournamentBoards={data.tournamentBoards}
            />
          </section>

          <section className="public-app-card public-app-card--split">
            {spotlight ? (
              <PublicPredictionPanel
                matchId={spotlight.id}
                teamAName={spotlight.teamAName}
                teamBName={spotlight.teamBName}
                tournamentName={spotlight.tournamentName}
                powerHitOptions={voteOptions.map((option) => option.label)}
              />
            ) : null}
            {spotlight ? (
              <PublicFantasyPanel
                matchId={spotlight.id}
                tournamentName={spotlight.tournamentName}
                players={fantasyPlayers}
              />
            ) : null}
            <PublicVotePanel matchId={spotlight?.id ?? "m-1"} options={voteOptions} />
            <PublicLiveFeed />
            {spotlight ? (
              <PublicSharePanel
                matchId={spotlight.id}
                title={`${spotlight.teamAName} vs ${spotlight.teamBName} - ${spotlight.tournamentName}`}
              />
            ) : null}
          </section>

          <section id="news" className="public-app-card">
            <div className="public-section__head public-section__head--compact">
              <p className="public-section__eyebrow">News</p>
              <h3>Ground updates and tournament announcements</h3>
              <p className="muted">Only public-facing updates appear here. Internal approvals and operations stay hidden.</p>
            </div>
            <div className="public-story-list">
              {data.overview.news.length === 0 ? (
                <p className="muted">No public updates have been published yet.</p>
              ) : (
                data.overview.news.map((post) => (
                  <article key={post.id} className="public-story">
                    <div className="public-story__row">
                      <strong>{post.title}</strong>
                      <span>
                        {new Date(post.publishedAt).toLocaleDateString("en-PK", {
                          day: "numeric",
                          month: "short"
                        })}
                      </span>
                    </div>
                    <p>{post.body}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <PublicBottomNav />
      </div>
    </main>
  );
}
