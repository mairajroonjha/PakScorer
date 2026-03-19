import { OverviewPanels } from "@/components/dashboard-panels";
import LiveEventFeed from "@/components/live-event-feed";
import {
  CommentaryForm,
  DirectMatchRequestForm,
  FanVoteForm,
  PlayerRegistrationForm,
  TeamApplicationReviewForm,
  TeamRegistrationForm,
  TeamTournamentApplicationForm,
  TossControlForm,
  TournamentRequestForm
} from "@/components/ops-forms";
import SuperAdminControlRoom from "@/components/super-admin-control-room";
import ScorerPad from "@/components/scorer-pad";

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
        description="These actions stay internal because they affect registration, compliance, and competition fairness."
      >
        <TournamentRequestForm />
        <TeamApplicationReviewForm />
        <PlayerRegistrationForm />
      </ToolSection>
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
      <OverviewPanels role="TEAM_ADMIN" />
      <ToolSection
        eyebrow="Club Actions"
        title="What Team Admins Can Control"
        description="Teams can manage their own profile and requests, but they cannot see platform audit trails or internal approval logs."
      >
        <TeamRegistrationForm />
        <TeamTournamentApplicationForm />
        <DirectMatchRequestForm />
        <PlayerRegistrationForm />
      </ToolSection>
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
        chips={["Button-first input", "Realtime stream", "Low-friction scoring"]}
      />
      <OverviewPanels role="MATCH_SCORER" />
      <section className="scorer-layout">
        <ScorerPad />
        <section className="tool-section tool-section--compact">
          <div className="section-heading">
            <p className="section-heading__eyebrow">Utilities</p>
            <h2>Fast Match Controls</h2>
            <p className="muted">Only tools required during live play are visible here.</p>
          </div>
          <div className="tool-grid">
            <TossControlForm />
            <CommentaryForm />
            <LiveEventFeed />
          </div>
        </section>
      </section>
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
