import { TeamAdminDashboard } from "@/components/dashboard-pages";
import { StaticPreviewPage } from "@/components/static-preview-page";
import { isStaticExportMode } from "@/lib/runtime-mode";

export default function TeamPage() {
  if (isStaticExportMode()) {
    return (
      <StaticPreviewPage
        eyebrow="Team Dashboard Preview"
        title="Team management is disabled on the static Pages build."
        body="Roster changes, tournament applications, and challenge inbox features need the full Worker deployment."
      />
    );
  }

  return <TeamAdminDashboard />;
}
