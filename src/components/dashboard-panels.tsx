import { getAppSession } from "@/lib/auth";
import { getDbDashboardOverview } from "@/lib/db-store";
import type { Role } from "@/types/domain";

type DashboardSurface = Role | "HOME";
type DashboardOverview = Awaited<ReturnType<typeof getDbDashboardOverview>>;
type DashboardMatch = DashboardOverview["matches"][number];

interface MetricItem {
  label: string;
  value: string;
  hint?: string;
}

interface ListItem {
  title: string;
  meta?: string;
  body?: string;
}

function formatStart(value: string): string {
  return new Date(value).toLocaleString("en-PK", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function matchLabel(match: DashboardMatch, teamNameById: Map<string, string>): string {
  return `${teamNameById.get(match.teamAId) ?? match.teamAId} vs ${teamNameById.get(match.teamBId) ?? match.teamBId}`;
}

function formatMatchState(match: DashboardMatch): string {
  if (match.state === "LIVE") {
    return `${match.score.runs}/${match.score.wickets} in ${match.score.balls} balls`;
  }
  if (match.state === "COMPLETED") {
    return `Completed at ${match.score.runs}/${match.score.wickets}`;
  }
  return `Starts ${formatStart(match.startAt)}`;
}

function renderEmpty(message: string) {
  return <p className="muted">{message}</p>;
}

function MetricStrip({ items }: { items: MetricItem[] }) {
  return (
    <section className="metric-strip">
      {items.map((item) => (
        <article key={`${item.label}-${item.value}`} className="metric-card">
          <p className="metric-label">{item.label}</p>
          <h3 className="metric-value">{item.value}</h3>
          {item.hint ? <p className="metric-hint">{item.hint}</p> : null}
        </article>
      ))}
    </section>
  );
}

function InsightPanel({ title, eyebrow, items, empty }: { title: string; eyebrow: string; items: ListItem[]; empty: string }) {
  return (
    <section className="dashboard-panel">
      <div className="panel-head">
        <p className="panel-eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
      </div>
      {items.length === 0 ? (
        renderEmpty(empty)
      ) : (
        <div className="panel-list">
          {items.map((item) => (
            <article key={`${title}-${item.title}-${item.meta ?? ""}`} className="panel-item">
              <div className="panel-item__row">
                <strong>{item.title}</strong>
                {item.meta ? <span className="pill">{item.meta}</span> : null}
              </div>
              {item.body ? <p className="muted">{item.body}</p> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

async function getViewerId(): Promise<string | undefined> {
  const session = await getAppSession();
  return session?.user?.id;
}

function buildHomePanels(overview: DashboardOverview, teamNameById: Map<string, string>) {
  const spotlightMatch = overview.matches.find((match) => match.state === "LIVE") ?? overview.matches[0];
  const newsItems = overview.news.slice(0, 3).map((post) => ({
    title: post.title,
    meta: new Date(post.publishedAt).toLocaleDateString("en-PK"),
    body: post.body
  }));
  const leaderboardItems = overview.leaderboard.entries.slice(0, 5).map((entry, index) => ({
    title: `${index + 1}. ${entry.label}`,
    meta: `${entry.value} ${entry.metric.toLowerCase()}`,
    body: "Live rankings update automatically after match finalization."
  }));
  const teamItems = overview.teams.slice(0, 4).map((team) => ({
    title: team.name,
    meta: team.city ?? "Regional club",
    body: team.sponsorName ? `Sponsor: ${team.sponsorName}` : "Available for direct matches and tournaments."
  }));

  return (
    <>
      <MetricStrip
        items={[
          { label: "Approved Tournaments", value: String(overview.tournaments.filter((item) => item.status === "APPROVED").length) },
          { label: "Registered Teams", value: String(overview.counts.teams), hint: "Platform-wide clubs and tournament teams" },
          { label: "Live Matches", value: String(overview.counts.liveMatches), hint: "Real-time score visibility" },
          { label: "Verified Players", value: String(overview.counts.players), hint: "Unique IDs stop duplicate participation" }
        ]}
      />
      <div className="dashboard-grid">
        <InsightPanel
          eyebrow="Match Center"
          title="Live Cricket Window"
          empty="No match has been scheduled yet."
          items={
            spotlightMatch
              ? [
                  {
                    title: matchLabel(spotlightMatch, teamNameById),
                    meta: spotlightMatch.state,
                    body: formatMatchState(spotlightMatch)
                  }
                ]
              : []
          }
        />
        <InsightPanel eyebrow="Top Form" title="Public Leaderboard" empty="No leaderboard data yet." items={leaderboardItems} />
        <InsightPanel eyebrow="Community" title="Featured Teams" empty="No teams registered yet." items={teamItems} />
        <InsightPanel eyebrow="Updates" title="News Feed" empty="No announcements published yet." items={newsItems} />
      </div>
    </>
  );
}

function buildSuperAdminPanels(overview: DashboardOverview, teamNameById: Map<string, string>, tournamentNameById: Map<string, string>) {
  const pendingTournaments = overview.tournaments
    .filter((tournament) => tournament.status === "PENDING")
    .slice(0, 4)
    .map((tournament) => ({
      title: tournament.name,
      meta: tournament.regionId.toUpperCase(),
      body: `Requested by ${tournament.requestedBy}`
    }));
  const auditItems = overview.audits.slice(0, 5).map((audit) => ({
    title: audit.action,
    meta: audit.actorId,
    body: `Entity ${audit.entityId}`
  }));
  const applicationItems = overview.teamApplications.slice(0, 4).map((application) => ({
    title: `${teamNameById.get(application.teamId) ?? application.teamId} -> ${tournamentNameById.get(application.tournamentId) ?? application.tournamentId}`,
    meta: application.status,
    body: application.rejectionReason ?? "Awaiting operational action or already processed."
  }));
  const directMatchItems = overview.directMatchRequests.slice(0, 4).map((request) => ({
    title: `${teamNameById.get(request.requesterTeamId) ?? request.requesterTeamId} vs ${teamNameById.get(request.opponentTeamId) ?? request.opponentTeamId}`,
    meta: request.status,
    body: `${request.format} at ${request.venue}`
  }));

  return (
    <>
      <MetricStrip
        items={[
          { label: "Pending Tournaments", value: String(overview.tournaments.filter((item) => item.status === "PENDING").length), hint: "Requires approval or rejection" },
          { label: "Team Applications", value: String(overview.counts.teamApplications), hint: "Tournament entry queue" },
          { label: "Direct Match Requests", value: String(overview.counts.directMatchRequests), hint: "Independent club mode activity" },
          { label: "Audit Events", value: String(overview.audits.length), hint: "Latest integrity trail" }
        ]}
      />
      <div className="dashboard-grid">
        <InsightPanel eyebrow="Approvals" title="Pending Tournament Queue" empty="No pending tournament requests." items={pendingTournaments} />
        <InsightPanel eyebrow="Integrity" title="Recent Audit Trail" empty="No audit events recorded yet." items={auditItems} />
        <InsightPanel eyebrow="Competition" title="Team Application Flow" empty="No team applications yet." items={applicationItems} />
        <InsightPanel eyebrow="Clubs" title="Direct Match Activity" empty="No direct match requests yet." items={directMatchItems} />
      </div>
    </>
  );
}

function buildTournamentAdminPanels(
  overview: DashboardOverview,
  teamNameById: Map<string, string>,
  tournamentNameById: Map<string, string>
) {
  const applicationItems = overview.teamApplications.slice(0, 6).map((application) => ({
    title: teamNameById.get(application.teamId) ?? application.teamId,
    meta: application.status,
    body: `${tournamentNameById.get(application.tournamentId) ?? application.tournamentId} · requested by ${application.requestedBy}`
  }));
  const matchItems = overview.matches.slice(0, 4).map((match) => ({
    title: matchLabel(match, teamNameById),
    meta: match.mode,
    body: formatMatchState(match)
  }));
  const leaderboardItems = overview.leaderboard.entries.slice(0, 5).map((entry) => ({
    title: entry.label,
    meta: `${entry.value} ${entry.metric.toLowerCase()}`,
    body: "Performance snapshot across completed scoring."
  }));
  const tournamentItems = overview.tournaments.slice(0, 4).map((tournament) => ({
    title: tournament.name,
    meta: tournament.status,
    body: `${tournament.regionId.toUpperCase()} region`
  }));

  return (
    <>
      <MetricStrip
        items={[
          { label: "Total Tournaments", value: String(overview.counts.tournaments), hint: "Active regional competition footprint" },
          { label: "Team Applications", value: String(overview.counts.teamApplications), hint: "Entries to review" },
          { label: "Scheduled Matches", value: String(overview.counts.matches), hint: "Tournament and direct format" },
          { label: "Verified Players", value: String(overview.counts.players), hint: "Eligibility cleared by unique ID" }
        ]}
      />
      <div className="dashboard-grid">
        <InsightPanel eyebrow="Operations" title="Tournament Roster Queue" empty="No team applications yet." items={applicationItems} />
        <InsightPanel eyebrow="Fixtures" title="Match Schedule Pulse" empty="No matches scheduled yet." items={matchItems} />
        <InsightPanel eyebrow="Performance" title="Top Performers" empty="No leaderboard data yet." items={leaderboardItems} />
        <InsightPanel eyebrow="Inventory" title="Managed Tournaments" empty="No tournaments available." items={tournamentItems} />
      </div>
    </>
  );
}

function buildTeamAdminPanels(
  overview: DashboardOverview,
  actorId: string | undefined,
  teamNameById: Map<string, string>,
  tournamentNameById: Map<string, string>
) {
  const ownedTeams = overview.teams.filter((team) => team.ownerUserId === actorId);
  const ownedTeamIds = new Set(ownedTeams.map((team) => team.id));
  const teamApplications = overview.teamApplications.filter((application) => ownedTeamIds.has(application.teamId));
  const directRequests = overview.directMatchRequests.filter(
    (request) => ownedTeamIds.has(request.requesterTeamId) || ownedTeamIds.has(request.opponentTeamId)
  );
  const myMatches = overview.matches.filter(
    (match) => ownedTeamIds.has(match.teamAId) || ownedTeamIds.has(match.teamBId)
  );

  const teamItems = ownedTeams.map((team) => ({
    title: team.name,
    meta: team.city ?? "City pending",
    body: team.contactPhone ? `Captain ${team.captainName ?? "TBD"} · ${team.contactPhone}` : "Complete club profile to improve tournament approvals."
  }));
  const applicationItems = teamApplications.map((application) => ({
    title: tournamentNameById.get(application.tournamentId) ?? application.tournamentId,
    meta: application.status,
    body: application.rejectionReason ?? `Submitted ${new Date(application.createdAt).toLocaleDateString("en-PK")}`
  }));
  const requestItems = directRequests.map((request) => ({
    title: `${teamNameById.get(request.requesterTeamId) ?? request.requesterTeamId} vs ${teamNameById.get(request.opponentTeamId) ?? request.opponentTeamId}`,
    meta: request.status,
    body: `${request.format} · ${request.venue} · ${formatStart(request.startAt)}`
  }));
  const matchItems = myMatches.map((match) => ({
    title: matchLabel(match, teamNameById),
    meta: match.state,
    body: formatMatchState(match)
  }));

  return (
    <>
      <MetricStrip
        items={[
          { label: "My Teams", value: String(ownedTeams.length), hint: "Clubs linked to your login" },
          { label: "Applications", value: String(teamApplications.length), hint: "Tournament requests from your clubs" },
          { label: "Challenges", value: String(directRequests.length), hint: "Direct match activity" },
          { label: "Fixtures", value: String(myMatches.length), hint: "Matches involving your teams" }
        ]}
      />
      <div className="dashboard-grid">
        <InsightPanel eyebrow="Clubs" title="Owned Team Profiles" empty="No teams linked to this account yet." items={teamItems} />
        <InsightPanel eyebrow="Tournaments" title="Application Status" empty="No tournament applications sent yet." items={applicationItems} />
        <InsightPanel eyebrow="Challenges" title="Direct Match Requests" empty="No direct match requests yet." items={requestItems} />
        <InsightPanel eyebrow="Matchday" title="Team Fixtures" empty="No matches assigned yet." items={matchItems} />
      </div>
    </>
  );
}

function buildScorerPanels(overview: DashboardOverview, teamNameById: Map<string, string>) {
  const currentMatch = overview.matches.find((match) => match.state === "LIVE") ?? overview.matches[0];
  const commentaryPrompt = currentMatch
    ? [
        {
          title: matchLabel(currentMatch, teamNameById),
          meta: currentMatch.state,
          body: `${formatMatchState(currentMatch)} · Toss ${currentMatch.tossWinnerTeamId ?? "pending"}`
        }
      ]
    : [];
  const leaderboardItems = overview.leaderboard.entries.slice(0, 4).map((entry) => ({
    title: entry.label,
    meta: `${entry.value} ${entry.metric.toLowerCase()}`,
    body: "Keep score tight so rankings remain trusted."
  }));
  const checklistItems = [
    { title: "Toss locked", meta: "Step 1", body: "Confirm toss winner and bat/bowl decision before the first ball." },
    { title: "Ball stream clean", meta: "Step 2", body: "Use button-only scoring for pace and reduce manual typing." },
    { title: "Commentary short", meta: "Step 3", body: "Keep fan updates punchy: wicket, boundary, milestone, injury." }
  ];

  return (
    <>
      <MetricStrip
        items={[
          { label: "Live Matches", value: String(overview.counts.liveMatches), hint: "Realtime scoring sessions" },
          { label: "Selected Match", value: currentMatch ? currentMatch.id : "-", hint: currentMatch ? matchLabel(currentMatch, teamNameById) : "No active match" },
          { label: "Runs Logged", value: currentMatch ? String(currentMatch.score.runs) : "0", hint: "Current score total" },
          { label: "Balls Logged", value: currentMatch ? String(currentMatch.score.balls) : "0", hint: "Ball-by-ball event count" }
        ]}
      />
      <div className="dashboard-grid">
        <InsightPanel eyebrow="Live" title="Match Focus" empty="No match available for scoring." items={commentaryPrompt} />
        <InsightPanel eyebrow="Workflow" title="Scorer Checklist" empty="Checklist unavailable." items={checklistItems} />
        <InsightPanel eyebrow="Pressure" title="Leaderboard Pulse" empty="No ranking impact yet." items={leaderboardItems} />
      </div>
    </>
  );
}

function buildPublicPanels(overview: DashboardOverview, teamNameById: Map<string, string>) {
  const publicMatch = overview.matches.find((match) => match.state === "LIVE") ?? overview.matches[0];
  const leaderboardItems = overview.leaderboard.entries.slice(0, 5).map((entry, index) => ({
    title: `${index + 1}. ${entry.label}`,
    meta: `${entry.value} ${entry.metric.toLowerCase()}`,
    body: "Public ranking visible to fans after verified scoring."
  }));
  const teamItems = overview.teams.slice(0, 4).map((team) => ({
    title: team.name,
    meta: team.city ?? "Local club",
    body: team.captainName ? `Captain ${team.captainName}` : "PakScorer registered team"
  }));
  const newsItems = overview.news.slice(0, 3).map((post) => ({
    title: post.title,
    meta: new Date(post.publishedAt).toLocaleDateString("en-PK"),
    body: post.body
  }));

  return (
    <>
      <MetricStrip
        items={[
          { label: "Live Matches", value: String(overview.counts.liveMatches), hint: "Current ground action" },
          { label: "Approved Tournaments", value: String(overview.tournaments.filter((item) => item.status === "APPROVED").length), hint: "Official competitions on platform" },
          { label: "Active Teams", value: String(overview.counts.teams), hint: "Clubs visible to the public" },
          { label: "Top Runs", value: overview.leaderboard.entries[0] ? String(overview.leaderboard.entries[0].value) : "0", hint: overview.leaderboard.entries[0]?.label ?? "Leaderboard waiting for data" }
        ]}
      />
      <div className="dashboard-grid">
        <InsightPanel
          eyebrow="Live Match"
          title="Score Spotlight"
          empty="No public match is available right now."
          items={
            publicMatch
              ? [
                  {
                    title: matchLabel(publicMatch, teamNameById),
                    meta: publicMatch.state,
                    body: formatMatchState(publicMatch)
                  }
                ]
              : []
          }
        />
        <InsightPanel eyebrow="Leaderboard" title="Who Is Leading" empty="No ranking data yet." items={leaderboardItems} />
        <InsightPanel eyebrow="Teams" title="Featured Clubs" empty="No clubs published yet." items={teamItems} />
        <InsightPanel eyebrow="News" title="Ground Updates" empty="No public announcements yet." items={newsItems} />
      </div>
    </>
  );
}

export async function OverviewPanels({ role }: { role: DashboardSurface }) {
  const overview = await getDbDashboardOverview();
  const actorId = await getViewerId();
  const teamNameById = new Map(overview.teams.map((team) => [team.id, team.name]));
  const tournamentNameById = new Map(overview.tournaments.map((tournament) => [tournament.id, tournament.name]));

  if (role === "HOME") {
    return buildHomePanels(overview, teamNameById);
  }
  if (role === "SUPER_ADMIN") {
    return buildSuperAdminPanels(overview, teamNameById, tournamentNameById);
  }
  if (role === "TOURNAMENT_ADMIN") {
    return buildTournamentAdminPanels(overview, teamNameById, tournamentNameById);
  }
  if (role === "TEAM_ADMIN") {
    return buildTeamAdminPanels(overview, actorId, teamNameById, tournamentNameById);
  }
  if (role === "MATCH_SCORER") {
    return buildScorerPanels(overview, teamNameById);
  }
  return buildPublicPanels(overview, teamNameById);
}
