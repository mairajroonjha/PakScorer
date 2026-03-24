import { redirect } from "next/navigation";
import PublicParticipationPanel from "@/components/public-participation-panel";
import { StaticPreviewPage } from "@/components/static-preview-page";
import { getDashboardPathForRole } from "@/lib/dashboard-paths";
import { getAppSession } from "@/lib/auth";
import { isStaticExportMode } from "@/lib/runtime-mode";

export default async function GetStartedPage() {
  if (isStaticExportMode()) {
    return (
      <StaticPreviewPage
        eyebrow="Starter Flow Preview"
        title="Team and tournament starter actions are disabled on Pages."
        body="The static Cloudflare Pages build is public/demo only. Real team registration and tournament request flows need the Worker deployment."
      />
    );
  }

  const session = await getAppSession();

  if (!session?.user?.role) {
    redirect("/login?next=/get-started");
  }

  if (session.user.role !== "PUBLIC_VIEWER") {
    redirect(getDashboardPathForRole(session.user.role));
  }

  return (
    <main className="page-stack">
      <section className="hero hero--public">
        <div className="hero__copy">
          <p className="hero__eyebrow">Participation Entry</p>
          <h1>Choose your first step after sign in.</h1>
          <p className="hero__body">
            Create your team profile if you are joining as a club, or move to tournament request if you are organizing a competition.
          </p>
        </div>
        <div className="hero__chips">
          <span className="chip">Signed-in users only</span>
          <span className="chip">Register team</span>
          <span className="chip">Request tournament</span>
        </div>
      </section>

      <PublicParticipationPanel />
    </main>
  );
}
