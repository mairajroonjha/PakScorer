import Link from "next/link";
import type { Route } from "next";
import TournamentRequestForm from "@/components/tournament-request-form";
import { StaticPreviewPage } from "@/components/static-preview-page";
import { getAppSession } from "@/lib/auth";
import { getDashboardPathForRole } from "@/lib/dashboard-paths";
import { getDbUserById } from "@/lib/db-store";
import { isStaticExportMode } from "@/lib/runtime-mode";

export default async function RegisterTournamentPage() {
  if (isStaticExportMode()) {
    return (
      <StaticPreviewPage
        eyebrow="Tournament Request Preview"
        title="Tournament request form is disabled in the static Pages build."
        body="This public Pages deployment is meant to showcase the product. Real tournament submission and approval flows need the Worker deployment with auth and database access."
      />
    );
  }

  const session = await getAppSession();
  const user = session?.user?.id ? await getDbUserById(session.user.id) : undefined;
  const currentDashboardPath = session?.user?.role ? (getDashboardPathForRole(session.user.role) as Route) : "/";

  if (!session?.user?.id) {
    return (
      <main className="page-stack">
        <section className="hero hero--tournament">
          <div className="hero__copy">
            <p className="hero__eyebrow">Tournament Registration</p>
            <h1>Create an organizer account first, then submit your tournament.</h1>
            <p className="hero__body">
              Tournament requests are now tied to a real organizer account. Sign up or sign in first, then submit the simple tournament form for Super Admin review.
            </p>
          </div>
          <div className="hero__chips">
            <span className="chip">Account required</span>
            <span className="chip">Simple form</span>
            <span className="chip">Super Admin review</span>
          </div>
        </section>

        <section className="dashboard-panel super-panel simple-request-form">
          <div className="simple-request-form__head">
            <div>
              <p className="panel-eyebrow">Start With Access</p>
              <h2>You need a real organizer account before you can request a tournament.</h2>
              <p className="muted">That same account becomes the tournament admin account once Super Admin approves the request.</p>
            </div>
            <div className="simple-request-form__note">
              <strong>Next step</strong>
              <p>Create a public account or sign in with an existing organizer account.</p>
            </div>
          </div>

          <div className="public-hero__actions">
            <Link href="/signup?next=/register-tournament" className="public-link">
              Create Account
            </Link>
            <Link href="/login?next=/register-tournament" className="public-link public-link--soft">
              Sign In
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (session.user.role !== "PUBLIC_VIEWER") {
    return (
      <main className="page-stack">
        <section className="hero hero--tournament">
          <div className="hero__copy">
            <p className="hero__eyebrow">Tournament Registration</p>
            <h1>This request flow is reserved for organizer starter accounts.</h1>
            <p className="hero__body">
              Your current account is already assigned to an operational role. Use a dedicated public organizer account for tournament requests, or return to your current dashboard.
            </p>
          </div>
          <div className="hero__chips">
            <span className="chip">Current role: {session.user.role.replaceAll("_", " ")}</span>
            <span className="chip">Organizer-only flow</span>
          </div>
        </section>

        <section className="dashboard-panel super-panel simple-request-form">
          <div className="public-hero__actions">
            <Link href={currentDashboardPath} className="public-link">
              Open Current Dashboard
            </Link>
            <Link href="/public" className="public-link public-link--soft">
              Back To Public Center
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!user?.email || !user.phone) {
    return (
      <main className="page-stack">
        <section className="hero hero--tournament">
          <div className="hero__copy">
            <p className="hero__eyebrow">Tournament Registration</p>
            <h1>Your organizer account is missing required contact details.</h1>
            <p className="hero__body">
              Tournament requests need a real organizer name, email, and phone number because the same account becomes the tournament admin account after approval.
            </p>
          </div>
          <div className="hero__chips">
            <span className="chip">Missing contact details</span>
            <span className="chip">Organizer account required</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-stack">
      <section className="hero hero--tournament">
        <div className="hero__copy">
          <p className="hero__eyebrow">Tournament Registration</p>
          <h1>Fill a simple form and send it to Super Admin.</h1>
          <p className="hero__body">
            Tournament details come from this form. Organizer identity and future tournament admin access come from your signed-in PakScorer account.
          </p>
        </div>
        <div className="hero__chips">
          <span className="chip">Signed in as {user.name}</span>
          <span className="chip">{user.email}</span>
          <span className="chip">Super Admin review</span>
        </div>
      </section>
      <section className="dashboard-panel super-panel">
        <TournamentRequestForm organizerName={user.name} organizerEmail={user.email} organizerPhone={user.phone} />
      </section>
    </main>
  );
}
