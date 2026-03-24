import { StaticPreviewPage } from "@/components/static-preview-page";
import { isStaticExportMode } from "@/lib/runtime-mode";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth";
import { getDashboardPathForRole } from "@/lib/dashboard-paths";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  if (isStaticExportMode()) {
    return (
      <StaticPreviewPage
        eyebrow="Account Preview"
        title="Account center is not active in the static Pages build."
        body="This route remains online as a preview only. Team creation, account switching, and organizer flows need the Worker deployment."
      />
    );
  }

  const session = await getAppSession();

  if (!session?.user?.id || !session.user.role) {
    redirect("/login?next=/account");
  }

  const teams = await prisma.team.findMany({
    where: { ownerUserId: session.user.id },
    select: {
      id: true,
      name: true,
      city: true,
      inviteCode: true,
      leagueAffiliation: true,
      homeGround: true
    },
    orderBy: { name: "asc" }
  });

  const hasTeam = teams.length > 0 || session.user.role === "TEAM_ADMIN";
  const teamHref = hasTeam ? "/team" : "/get-started#register-team";
  const teamLabel = hasTeam ? "Manage My Team" : "Create My Team";
  const teamDescription = hasTeam
    ? "Your team profile already exists. Open the team dashboard to manage roster, fixtures, and club operations."
    : "You do not have a team profile yet. Start with the registration form and your account will move into Team Admin flow.";
  const tournamentHref = session.user.role === "TOURNAMENT_ADMIN" ? "/admin/tournament" : "/register-tournament";
  const tournamentLabel = session.user.role === "TOURNAMENT_ADMIN" ? "Open Tournament Desk" : "Request Tournament";
  const dashboardHref = getDashboardPathForRole(session.user.role);

  return (
    <main className="page-stack account-page">
      <section className="account-hub">
        <div className="account-hub__hero">
          <div>
            <p className="account-hub__eyebrow">Account Center</p>
            <h1>{session.user.name ?? session.user.email ?? "PakScorer User"}</h1>
            <p className="account-hub__body">
              Team registration should stay easy to find for owners, but it should not distract fans. This account center is the signed-in entry point for team creation, team management, and tournament participation.
            </p>
          </div>
          <div className="account-hub__chips">
            <span className="chip">{session.user.role.replaceAll("_", " ")}</span>
            {session.user.email ? <span className="chip">{session.user.email}</span> : null}
            <span className="chip">{teams.length} team profile{teams.length === 1 ? "" : "s"}</span>
          </div>
        </div>

        <div className="account-hub__grid">
          <article className="account-hub__card account-hub__card--primary">
            <p className="account-hub__label">Team Access</p>
            <h2>{teamLabel}</h2>
            <p>{teamDescription}</p>
            <div className="account-hub__actions">
              <Link href={teamHref as Route} className="button-link">
                {teamLabel}
              </Link>
              {!hasTeam ? (
                <Link href="/signup?next=/get-started" className="button-link button-link--ghost">
                  Create Another Public Account
                </Link>
              ) : null}
            </div>
          </article>

          <article className="account-hub__card">
            <p className="account-hub__label">Tournament Access</p>
            <h2>{tournamentLabel}</h2>
            <p>
              Organizer flow stays separate. Send a tournament request for Super Admin review, or open your current tournament operations desk if your account already has tournament access.
            </p>
            <div className="account-hub__actions">
              <Link href={tournamentHref as Route} className="button-link button-link--secondary">
                {tournamentLabel}
              </Link>
              <Link href={dashboardHref as Route} className="button-link button-link--ghost">
                Open My Dashboard
              </Link>
            </div>
          </article>
        </div>

        <section className="account-hub__list-card">
          <div className="account-hub__section-head">
            <div>
              <p className="account-hub__label">My Teams</p>
              <h3>Current team profiles linked to this account</h3>
            </div>
            <Link href={teamHref as Route} className="account-hub__inline-link">
              {teamLabel}
            </Link>
          </div>
          {teams.length === 0 ? (
            <p className="muted">No team profile is linked yet. Use the team creation action above to open the registration form.</p>
          ) : (
            <div className="account-hub__team-list">
              {teams.map((team) => (
                <article key={team.id} className="account-hub__team-card">
                  <div>
                    <strong>{team.name}</strong>
                    <span>{team.city ?? "City pending"}{team.homeGround ? ` · ${team.homeGround}` : ""}</span>
                  </div>
                  <div className="account-hub__team-meta">
                    {team.inviteCode ? <span>Invite {team.inviteCode}</span> : null}
                    {team.leagueAffiliation ? <span>{team.leagueAffiliation}</span> : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
