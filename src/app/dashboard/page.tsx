import { redirect } from "next/navigation";
import { StaticPreviewPage } from "@/components/static-preview-page";
import { getDashboardPathForRole } from "@/lib/dashboard-paths";
import { getAppSession } from "@/lib/auth";
import { isStaticExportMode } from "@/lib/runtime-mode";

export default async function DashboardRedirectPage() {
  if (isStaticExportMode()) {
    return (
      <StaticPreviewPage
        eyebrow="Dashboard Preview"
        title="Protected dashboards are preview-only on Pages."
        body="Use the Worker deployment if you want role-based routing, live auth, scorer tools, or tournament operations."
      />
    );
  }

  const session = await getAppSession();
  if (!session?.user?.role) {
    redirect("/login");
  }
  redirect(getDashboardPathForRole(session.user.role));
}
