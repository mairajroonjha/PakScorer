import Link from "next/link";
import type { Route } from "next";

type StaticPreviewPageProps = {
  eyebrow: string;
  title: string;
  body: string;
  primaryHref?: Route;
  primaryLabel?: string;
  secondaryHref?: Route;
  secondaryLabel?: string;
};

export function StaticPreviewPage({
  eyebrow,
  title,
  body,
  primaryHref = "/public" as Route,
  primaryLabel = "Open Public Demo",
  secondaryHref = "/public/matches/m-live-demo" as Route,
  secondaryLabel = "Open Live Demo Match"
}: StaticPreviewPageProps) {
  return (
    <main className="page-stack static-preview-page">
      <section className="hero hero--public">
        <div className="hero__copy">
          <p className="hero__eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="hero__body">{body}</p>
        </div>
        <div className="hero__chips">
          <span className="chip">Cloudflare Pages static demo</span>
          <span className="chip">Public surface only</span>
          <span className="chip">Worker required for auth and ops</span>
        </div>
      </section>

      <section className="dashboard-panel static-preview-panel">
        <div className="static-preview-panel__copy">
          <p className="panel-eyebrow">Static Deployment Mode</p>
          <h2>This route is shown as a preview only in the Pages build.</h2>
          <p className="muted">
            Team management, tournament approvals, scorer console, login, signup, and live backend workflows need the
            full Worker deployment. The static Pages build keeps only the public/demo experience online.
          </p>
        </div>
        <div className="public-hero__actions">
          <Link href={primaryHref} className="public-link">
            {primaryLabel}
          </Link>
          <Link href={secondaryHref} className="public-link public-link--soft">
            {secondaryLabel}
          </Link>
        </div>
      </section>
    </main>
  );
}
