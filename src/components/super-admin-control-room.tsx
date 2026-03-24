import {
  CorrectionApprovalForm,
  MatchCompletionForm,
  NewsPostForm,
  PlayerRegistrationForm,
  SquadLockOverrideForm,
  TeamApplicationReviewForm,
  UserRoleUpdateForm
} from "@/components/ops-forms";
import TournamentRegistrationReviewQueue from "@/components/tournament-registration-review-queue";
import { getDbDashboardOverview } from "@/lib/db-store";
import { getInfrastructureStatus } from "@/lib/infrastructure";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-PK", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatMatchLabel(teamNameById: Map<string, string>, teamAId: string, teamBId: string) {
  return `${teamNameById.get(teamAId) ?? teamAId} vs ${teamNameById.get(teamBId) ?? teamBId}`;
}

function StatusChip({
  tone,
  children
}: {
  tone: "neutral" | "danger" | "success" | "warning";
  children: React.ReactNode;
}) {
  return <span className={`super-chip super-chip--${tone}`}>{children}</span>;
}

function SuperMetric({
  eyebrow,
  value,
  label,
  tone
}: {
  eyebrow: string;
  value: string;
  label: string;
  tone: "neutral" | "danger" | "success" | "warning";
}) {
  return (
    <article className={`super-metric super-metric--${tone}`}>
      <p className="super-metric__eyebrow">{eyebrow}</p>
      <h3>{value}</h3>
      <p className="muted">{label}</p>
    </article>
  );
}

function SuperListPanel({
  eyebrow,
  title,
  subtitle,
  children
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="dashboard-panel super-panel">
      <div className="panel-head">
        <p className="panel-eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
        <p className="muted">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="muted">{text}</p>;
}

export default async function SuperAdminControlRoom() {
  const overview = await getDbDashboardOverview();
  const infrastructure = getInfrastructureStatus();

  const teamNameById = new Map(overview.teams.map((team) => [team.id, team.name]));
  const tournamentNameById = new Map(overview.tournaments.map((tournament) => [tournament.id, tournament.name]));
  const userNameById = new Map(overview.users.map((user) => [user.id, user.name]));

  const pendingRegistrationRequests = overview.tournamentRegistrationRequests.filter((request) => request.status === "PENDING");
  const pendingTournaments = overview.tournaments.filter((tournament) => tournament.status === "PENDING");
  const pendingApplications = overview.teamApplications.filter((application) => application.status === "PENDING");
  const pendingCorrections = overview.corrections.filter((correction) => !correction.approvedBy);
  const liveMatches = overview.matches.filter((match) => match.state === "LIVE");
  const internalUsers = overview.users.filter((user) => user.role !== "PUBLIC_VIEWER");
  const recentCompletedMatches = overview.matches.filter((match) => match.state === "COMPLETED").slice(0, 4);
  const recentNews = overview.news.slice(0, 3);
  const recentAudits = overview.audits.slice(0, 6);
  const directMatchQueue = overview.directMatchRequests.slice(0, 5);

  const approvalLoad = pendingRegistrationRequests.length + pendingTournaments.length + pendingApplications.length;
  const disputeLoad = pendingCorrections.length;

  return (
    <div className="super-admin-stack">
      <section className="super-command-board">
        <div className="super-command-board__hero">
          <p className="super-command-board__eyebrow">Platform Authority</p>
          <h2>Super Admin Command Center</h2>
          <p className="super-command-board__body">
            This workspace controls tournament legitimacy, dispute resolution, role governance, audit integrity, and emergency overrides.
          </p>
          <div className="super-command-board__chips">
            <StatusChip tone={approvalLoad > 0 ? "warning" : "success"}>{approvalLoad} approvals waiting</StatusChip>
            <StatusChip tone={disputeLoad > 0 ? "danger" : "success"}>{disputeLoad} dispute actions</StatusChip>
            <StatusChip tone={liveMatches.length > 0 ? "neutral" : "warning"}>{liveMatches.length} live operations</StatusChip>
          </div>
        </div>
        <div className="super-command-board__side">
          <SuperMetric
            eyebrow="Registration Queue"
            value={String(pendingRegistrationRequests.length)}
            label="Tournament requests submitted by organizers and waiting for final review."
            tone={pendingRegistrationRequests.length > 0 ? "warning" : "success"}
          />
          <SuperMetric
            eyebrow="Integrity Alerts"
            value={String(pendingCorrections.length)}
            label="Score corrections and exception handling that need final oversight."
            tone={pendingCorrections.length > 0 ? "danger" : "success"}
          />
          <SuperMetric
            eyebrow="Internal Staff"
            value={String(internalUsers.length)}
            label="Current platform, tournament, team, and scorer accounts."
            tone="neutral"
          />
        </div>
      </section>

      <section className="super-layout">
        <div className="super-layout__main">
          <div className="super-grid">
            <SuperListPanel
              eyebrow="Incoming Requests"
              title="Tournament Registration Requests"
              subtitle="Organizers fill one simple form. Review the request here, then approve or disapprove it."
            >
              <TournamentRegistrationReviewQueue requests={pendingRegistrationRequests} />
            </SuperListPanel>

            <SuperListPanel
              eyebrow="Approvals"
              title="Legacy Tournament Approval Queue"
              subtitle="Older direct tournament requests remain visible here until they are cleared."
            >
              {pendingTournaments.length === 0 ? (
                <EmptyState text="No direct tournament records are pending." />
              ) : (
                <div className="panel-list">
                  {pendingTournaments.map((tournament) => (
                    <article key={tournament.id} className="panel-item">
                      <div className="panel-item__row">
                        <strong>{tournament.name}</strong>
                        <StatusChip tone="warning">{tournament.regionId.toUpperCase()}</StatusChip>
                      </div>
                      <p className="muted">
                        Requested by {userNameById.get(tournament.requestedBy) ?? tournament.requestedBy}
                        {tournament.city ? ` - ${tournament.city}` : ""}
                        {tournament.format ? ` - ${tournament.format}` : ""}
                      </p>
                      <p className="super-meta-line">Tournament ID: {tournament.id}</p>
                    </article>
                  ))}
                </div>
              )}
            </SuperListPanel>

            <SuperListPanel
              eyebrow="Entry Governance"
              title="Team Applications Requiring Review"
              subtitle="Clubs should not enter tournaments without controlled approval history."
            >
              {pendingApplications.length === 0 ? (
                <EmptyState text="No team applications are waiting for review." />
              ) : (
                <div className="panel-list">
                  {pendingApplications.map((application) => (
                    <article key={application.id} className="panel-item">
                      <div className="panel-item__row">
                        <strong>{teamNameById.get(application.teamId) ?? application.teamId}</strong>
                        <StatusChip tone="warning">Pending</StatusChip>
                      </div>
                      <p className="muted">
                        {tournamentNameById.get(application.tournamentId) ?? application.tournamentId} - requested by{" "}
                        {userNameById.get(application.requestedBy) ?? application.requestedBy}
                      </p>
                      <p className="super-meta-line">Application ID: {application.id}</p>
                    </article>
                  ))}
                </div>
              )}
            </SuperListPanel>

            <SuperListPanel
              eyebrow="Dispute Desk"
              title="Pending Score Corrections"
              subtitle="No silent score changes. Every correction remains auditable and requires explicit approval."
            >
              {pendingCorrections.length === 0 ? (
                <EmptyState text="No correction approvals are pending." />
              ) : (
                <div className="panel-list">
                  {pendingCorrections.map((correction) => (
                    <article key={correction.id} className="panel-item">
                      <div className="panel-item__row">
                        <strong>{correction.reason}</strong>
                        <StatusChip tone="danger">Review</StatusChip>
                      </div>
                      <p className="muted">
                        Match {correction.matchId} - target event {correction.targetEventId}
                      </p>
                      <p className="super-meta-line">Correction ID: {correction.id}</p>
                    </article>
                  ))}
                </div>
              )}
            </SuperListPanel>

            <SuperListPanel
              eyebrow="Integrity Trail"
              title="Recent Audit Activity"
              subtitle="Platform-level actions should always leave a trail. This panel surfaces the latest operational footprint."
            >
              {recentAudits.length === 0 ? (
                <EmptyState text="No audit activity has been recorded yet." />
              ) : (
                <div className="panel-list">
                  {recentAudits.map((audit) => (
                    <article key={audit.id} className="panel-item">
                      <div className="panel-item__row">
                        <strong>{audit.action}</strong>
                        <StatusChip tone="neutral">{userNameById.get(audit.actorId) ?? audit.actorId}</StatusChip>
                      </div>
                      <p className="muted">Entity {audit.entityId}</p>
                      <p className="super-meta-line">{new Date(audit.createdAt).toLocaleString("en-PK")}</p>
                    </article>
                  ))}
                </div>
              )}
            </SuperListPanel>

            <SuperListPanel
              eyebrow="Platform Controls"
              title="Infrastructure And Staff Control"
              subtitle="Super Admin owns environment readiness and privileged user governance."
            >
              <div className="super-status-grid">
                <article className="super-status-card">
                  <p className="super-status-card__label">Database</p>
                  <StatusChip tone={infrastructure.database === "configured" ? "success" : "danger"}>{infrastructure.database}</StatusChip>
                </article>
                <article className="super-status-card">
                  <p className="super-status-card__label">Redis</p>
                  <StatusChip tone={infrastructure.redis === "configured" ? "success" : "danger"}>{infrastructure.redis}</StatusChip>
                </article>
                <article className="super-status-card">
                  <p className="super-status-card__label">Auth Secret</p>
                  <StatusChip tone={infrastructure.authSecret === "configured" ? "success" : "danger"}>{infrastructure.authSecret}</StatusChip>
                </article>
              </div>
              <div className="panel-list">
                {internalUsers.map((user) => (
                  <article key={user.id} className="panel-item">
                    <div className="panel-item__row">
                      <strong>{user.name}</strong>
                      <StatusChip tone="neutral">{user.role.replaceAll("_", " ")}</StatusChip>
                    </div>
                    <p className="muted">{user.email ?? "No email"} - User ID: {user.id}</p>
                  </article>
                ))}
              </div>
            </SuperListPanel>

            <SuperListPanel
              eyebrow="Operations Report"
              title="Live And Recent Match Activity"
              subtitle="Use this view to monitor what is currently active and what just closed out across the platform."
            >
              <div className="super-report-section">
                <h4>Live Matches</h4>
                {liveMatches.length === 0 ? (
                  <EmptyState text="No matches are live right now." />
                ) : (
                  <div className="panel-list">
                    {liveMatches.map((match) => (
                      <article key={match.id} className="panel-item">
                        <div className="panel-item__row">
                          <strong>{formatMatchLabel(teamNameById, match.teamAId, match.teamBId)}</strong>
                          <StatusChip tone="neutral">LIVE</StatusChip>
                        </div>
                        <p className="muted">
                          {match.score.runs}/{match.score.wickets} in {match.score.balls} balls
                        </p>
                        <p className="super-meta-line">Match ID: {match.id}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
              <div className="super-report-section">
                <h4>Recent Completed Matches</h4>
                {recentCompletedMatches.length === 0 ? (
                  <EmptyState text="No completed matches yet." />
                ) : (
                  <div className="panel-list">
                    {recentCompletedMatches.map((match) => (
                      <article key={match.id} className="panel-item">
                        <div className="panel-item__row">
                          <strong>{formatMatchLabel(teamNameById, match.teamAId, match.teamBId)}</strong>
                          <StatusChip tone="success">Completed</StatusChip>
                        </div>
                        <p className="muted">
                          {match.score.runs}/{match.score.wickets} - {formatDateTime(match.startAt)}
                        </p>
                        <p className="super-meta-line">Mode: {match.mode}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </SuperListPanel>

            <SuperListPanel
              eyebrow="Community Broadcast"
              title="News And Direct Match Watch"
              subtitle="Super Admin can communicate official notices and monitor independent activity across the platform."
            >
              <div className="super-report-section">
                <h4>Recent News Posts</h4>
                {recentNews.length === 0 ? (
                  <EmptyState text="No official notices published yet." />
                ) : (
                  <div className="panel-list">
                    {recentNews.map((post) => (
                      <article key={post.id} className="panel-item">
                        <div className="panel-item__row">
                          <strong>{post.title}</strong>
                          <StatusChip tone="success">{new Date(post.publishedAt).toLocaleDateString("en-PK")}</StatusChip>
                        </div>
                        <p className="muted">{post.body}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
              <div className="super-report-section">
                <h4>Direct Match Queue</h4>
                {directMatchQueue.length === 0 ? (
                  <EmptyState text="No direct match activity is queued." />
                ) : (
                  <div className="panel-list">
                    {directMatchQueue.map((request) => (
                      <article key={request.id} className="panel-item">
                        <div className="panel-item__row">
                          <strong>{formatMatchLabel(teamNameById, request.requesterTeamId, request.opponentTeamId)}</strong>
                          <StatusChip tone={request.status === "PENDING" ? "warning" : "neutral"}>{request.status}</StatusChip>
                        </div>
                        <p className="muted">
                          {request.format} - {request.venue} - {formatDateTime(request.startAt)}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </SuperListPanel>
          </div>
        </div>

        <aside className="super-layout__rail">
          <section className="tool-section super-tool-section">
            <div className="section-heading">
              <p className="section-heading__eyebrow">Action Rail</p>
              <h2>Governance Controls</h2>
              <p className="muted">Use these tools for exception handling that does not belong in the request queue.</p>
            </div>
            <div className="super-tool-stack">
              <TeamApplicationReviewForm />
              <CorrectionApprovalForm />
              <SquadLockOverrideForm />
            </div>
          </section>

          <section className="tool-section super-tool-section">
            <div className="section-heading">
              <p className="section-heading__eyebrow">Platform Control</p>
              <h2>Accounts, News, And Records</h2>
              <p className="muted">Use these tools for role governance, official notices, player IDs, and final match closure.</p>
            </div>
            <div className="super-tool-stack">
              <UserRoleUpdateForm />
              <PlayerRegistrationForm />
              <NewsPostForm />
              <MatchCompletionForm />
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
