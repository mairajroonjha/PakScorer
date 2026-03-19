import Link from "next/link";
import { OverviewPanels } from "@/components/dashboard-panels";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="page-stack">
      <section className="hero hero--public hero--home">
        <div className="hero__copy">
          <p className="hero__eyebrow">PakScorer Platform</p>
          <h1>Regional cricket operations with clean role separation.</h1>
          <p className="hero__body">
            Tournaments, team mode, live scoring, leaderboards, and fan engagement in one system. Public users only see public cricket data while internal workflows stay behind role-based access.
          </p>
        </div>
        <div className="hero__chips">
          <span className="chip">Live scoring</span>
          <span className="chip">Tournaments</span>
          <span className="chip">Teams</span>
          <span className="chip">Leaderboards</span>
          <span className="chip">Fan engagement</span>
        </div>
        <div className="hero__actions">
          <Link href="/register-tournament" className="action-link">
            Register Tournament
          </Link>
          <Link href="/login" className="action-link">
            Staff Login
          </Link>
          <Link href="/public" className="action-link action-link--ghost">
            Open Public Center
          </Link>
        </div>
      </section>
      <OverviewPanels role="HOME" />
    </main>
  );
}
