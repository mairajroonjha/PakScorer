import { ScorerDashboard } from "@/components/dashboard-pages";
import { StaticPreviewPage } from "@/components/static-preview-page";
import { isStaticExportMode } from "@/lib/runtime-mode";

export default function ScorerPage() {
  if (isStaticExportMode()) {
    return (
      <StaticPreviewPage
        eyebrow="Scorer Console Preview"
        title="Ball-by-ball scoring is disabled on the static Pages build."
        body="Toss updates, lineups, wickets, innings changes, and scorer actions need the Worker deployment."
      />
    );
  }

  return <ScorerDashboard />;
}
