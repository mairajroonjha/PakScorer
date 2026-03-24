import { SuperAdminDashboard } from "@/components/dashboard-pages";
import { StaticPreviewPage } from "@/components/static-preview-page";
import { isStaticExportMode } from "@/lib/runtime-mode";

export default function AdminSuperPage() {
  if (isStaticExportMode()) {
    return (
      <StaticPreviewPage
        eyebrow="Super Admin Preview"
        title="Super Admin console is disabled on the static Pages build."
        body="Approvals, audits, scorer control, and platform governance need the full Worker deployment."
      />
    );
  }

  return <SuperAdminDashboard />;
}
