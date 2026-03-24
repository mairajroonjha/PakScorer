import { TournamentAdminDashboard } from "@/components/dashboard-pages";
import { StaticPreviewPage } from "@/components/static-preview-page";
import { isStaticExportMode } from "@/lib/runtime-mode";

export default function AdminTournamentPage() {
  if (isStaticExportMode()) {
    return (
      <StaticPreviewPage
        eyebrow="Tournament Admin Preview"
        title="Tournament operations are disabled on the static Pages build."
        body="Scorer pools, team approvals, fixtures, and tournament ops need the full Worker deployment."
      />
    );
  }

  return <TournamentAdminDashboard />;
}
