import Link from "next/link";
import { isStaticExportMode } from "@/lib/runtime-mode";

export default function PublicMatchesIndexPage() {
  if (isStaticExportMode()) {
    return (
      <main className="page-stack static-preview-page">
        <section className="dashboard-panel static-preview-panel">
          <div className="static-preview-panel__copy">
            <p className="panel-eyebrow">Matches Index</p>
            <h2>Open the public match center from here.</h2>
            <p className="muted">Static Pages build keeps match routes exported individually, so the index stays as a simple jump page.</p>
          </div>
          <div className="public-hero__actions">
            <Link href="/public#matches" className="public-link">
              Back To Match Center
            </Link>
            <Link href="/public/matches/m-live-demo" className="public-link public-link--soft">
              Open Live Demo Match
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return null;
}
