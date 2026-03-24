import { OverviewPanels } from "@/components/dashboard-panels";
import {
  FanVoteForm,
  PlayerRegistrationForm,
  TeamApplicationReviewForm,
} from "@/components/ops-forms";
import ScorerConsole from "@/components/scorer-console";
import SuperAdminControlRoom from "@/components/super-admin-control-room";
import TeamOwnerWorkspace from "@/components/team-owner-workspace";
import TournamentMatchOps from "@/components/tournament-match-ops";

function DashboardHero({
  theme,
  eyebrow,
  title,
  description,
  chips
}: {
  theme: "super" | "tournament" | "team" | "scorer" | "public";
  eyebrow: string;
  title: string;
  description: string;
  chips: string[];
}) {
  return (
    <section className={`hero hero--${theme}`}>
      <div className="hero__copy">
        <p className="hero__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="hero__body">{description}</p>
      </div>
      <div className="hero__chips">
        {chips.map((chip) => (
          <span key={chip} className="chip">
            {chip}
          </span>
        ))}
      </div>
    </section>
  );
}

function ToolSection({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="tool-section">
      <div className="section-heading">
        <p className="section-heading__eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p className="muted">{description}</p>
      </div>
      <div className="tool-grid">{children}</div>
    </section>
  );
}

export function SuperAdminDashboard() {
  return (
    <main className="page-stack">
      <DashboardHero
        theme="super"
        eyebrow="Platform Authority"
        title="Super Admin Control Room"
        description="Govern tournament legitimacy, privileged accounts, disputes, score integrity, and emergency platform controls from one command surface."
        chips={["Approval queue", "Integrity trail", "Override powers"]}
      />
      <SuperAdminControlRoom />
    </main>
  );
}

export function TournamentAdminDashboard() {
  return (
    <main className="page-stack">
      <DashboardHero
        theme="tournament"
        eyebrow="Competition Desk"
        title="Tournament Operations Dashboard"
        description="Manage team intake, player eligibility, and fixture readiness without exposing organizer-only details to fans."
        chips={["Entry review", "Fixture readiness", "Player verification"]}
      />
      <OverviewPanels role="TOURNAMENT_ADMIN" />
      <ToolSection
        eyebrow="Tournament Setup"
        title="Organizer Workflow"
        description="Keep the organizer view focused on entry review, player verification, and scorer operations. Tournament requests now start from the public registration flow."
      >
        <TeamApplicationReviewForm />
        <PlayerRegistrationForm />
      </ToolSection>
      <TournamentMatchOps />
    </main>
  );
}

export function TeamAdminDashboard() {
  return (
    <main className="page-stack">
      <DashboardHero
        theme="team"
        eyebrow="Club Mode"
        title="Team Management Dashboard"
        description="A club can create its identity once, apply to tournaments, and issue direct-match challenges without relying on tournament organizers for every step."
        chips={["Profile ownership", "Tournament applications", "Direct challenges"]}
      />
      <TeamOwnerWorkspace />
    </main>
  );
}

export function ScorerDashboard() {
  return (
    <main className="page-stack">
      <DashboardHero
        theme="scorer"
        eyebrow="Ground Console"
        title="Scorer Matchday Interface"
        description="Fast buttons, short commentary, and the minimum required context. The scorer should not be distracted by admin workflows."
        chips={["Button-first input", "Lineup control", "Low-friction scoring"]}
      />
      <ScorerConsole />
    </main>
  );
}

export function PublicDashboard() {
  return (
    <main className="page-stack">
      <DashboardHero
        theme="public"
        eyebrow="Fan View"
        title="Public Match Center"
        description="Fans should see live scores, rankings, teams, and public news only. Internal approvals, audit logs, and private contact details stay hidden."
        chips={["Live scores", "Leaderboards", "Fan voting"]}
      />
      <OverviewPanels role="PUBLIC_VIEWER" />
      <ToolSection
        eyebrow="Engagement"
        title="Public Interactions"
        description="This section remains lightweight on purpose: consume results, vote, and share. No operational controls belong here."
      >
        <FanVoteForm />
      </ToolSection>
    </main>
  );
}
