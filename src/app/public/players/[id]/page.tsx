import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicPlayerProfileData, getStaticPublicExportIds } from "@/lib/db-store";

export const dynamicParams = false;

export function generateStaticParams() {
  return getStaticPublicExportIds().playerIds.map((id) => ({ id }));
}

function formatProfileDate(value: string) {
  return new Date(value).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short"
  });
}

export default async function PublicPlayerProfilePage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getPublicPlayerProfileData(id);

  if (!profile) {
    notFound();
  }

  return (
    <main className="page-stack public-page public-page--detail">
      <section className="public-match-stage public-match-stage--player">
        <div className="public-match-stage__top">
          <p className="public-hero__eyebrow">Player Profile</p>
          <span>{profile.player.bcaId}</span>
        </div>

        <div className="public-match-stage__board">
          <div className="public-match-stage__team public-match-stage__team--left">
            <small>Verification</small>
            <strong>{profile.player.fullName}</strong>
            <span>{profile.player.verificationStatus}</span>
          </div>

          <div className="public-match-stage__center">
            <span>{profile.summary.roleLabel}</span>
            <h1>{profile.summary.runs}</h1>
            <p>Career runs tracked on PakScorer</p>
          </div>

          <div className="public-match-stage__team public-match-stage__team--right">
            <small>All-round output</small>
            <strong>{profile.summary.wickets} wkts</strong>
            <span>Best bowling {profile.summary.bestBowling}</span>
          </div>
        </div>

        <div className="public-detail-tabs">
          <Link href="/public#rankings" className="public-detail-tabs__tab">
            Back To Rankings
          </Link>
          <Link href="/public#matches" className="public-detail-tabs__tab public-detail-tabs__tab--ghost">
            Back To Matches
          </Link>
        </div>
      </section>

      <section className="public-detail-layout">
        <div className="public-detail-main">
          <section className="public-board public-detail-section">
            <div className="public-section__head">
              <p className="public-section__eyebrow">Career Summary</p>
              <h2>Numbers that matter</h2>
              <p className="muted">Runs, strike rate, wickets, economy, and best outputs aggregated from recorded PakScorer matches.</p>
            </div>
            <div className="public-detail-info-grid">
              <article className="public-detail-info-card">
                <span>Matches</span>
                <strong>{profile.summary.matchesPlayed}</strong>
              </article>
              <article className="public-detail-info-card">
                <span>Strike Rate</span>
                <strong>{profile.summary.strikeRate.toFixed(1)}</strong>
              </article>
              <article className="public-detail-info-card">
                <span>Fours / Sixes</span>
                <strong>
                  {profile.summary.fours} / {profile.summary.sixes}
                </strong>
              </article>
              <article className="public-detail-info-card">
                <span>Best Score</span>
                <strong>{profile.summary.bestScore}</strong>
              </article>
              <article className="public-detail-info-card">
                <span>Overs Bowled</span>
                <strong>{profile.summary.oversBowled}</strong>
              </article>
              <article className="public-detail-info-card">
                <span>Economy</span>
                <strong>{profile.summary.economy.toFixed(2)}</strong>
              </article>
            </div>
          </section>

          <section className="public-board public-detail-section">
            <div className="public-section__head">
              <p className="public-section__eyebrow">Recent Matches</p>
              <h2>Latest performances</h2>
              <p className="muted">Recent batting and bowling output from the matches already recorded on the platform.</p>
            </div>
            <div className="public-detail-history">
              {profile.recentMatches.length === 0 ? (
                <p className="muted">No recorded match activity for this player yet.</p>
              ) : (
                profile.recentMatches.map((entry) => (
                  <Link
                    key={entry.matchId}
                    href={`/public/matches/${entry.matchId}` as Route}
                    className="public-detail-history__item"
                  >
                    <div>
                      <strong>{entry.title}</strong>
                      <span>{formatProfileDate(entry.date)}</span>
                    </div>
                    <p>
                      {entry.runs} ({entry.ballsFaced}) with the bat, {entry.wickets}/{entry.runsConceded} with the ball
                    </p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="public-detail-side">
          <section className="public-board public-detail-section">
            <div className="public-section__head public-section__head--compact">
              <p className="public-section__eyebrow">Teams</p>
              <h3>Registered squads</h3>
            </div>
            <div className="public-detail-squad">
              {profile.teams.length === 0 ? (
                <p className="muted">No team registration is linked yet.</p>
              ) : (
                profile.teams.map((team) => (
                  <div key={team.id} className="public-detail-squad__player">
                    <span>{team.name}</span>
                    <small>Team</small>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="public-board public-detail-section">
            <div className="public-section__head public-section__head--compact">
              <p className="public-section__eyebrow">Tournaments</p>
              <h3>Competition history</h3>
            </div>
            <div className="public-detail-squad">
              {profile.tournaments.length === 0 ? (
                <p className="muted">No tournament squad history is linked yet.</p>
              ) : (
                profile.tournaments.map((tournament) => (
                  <div key={tournament.id} className="public-detail-squad__player">
                    <span>{tournament.name}</span>
                    <small>Tournament</small>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
