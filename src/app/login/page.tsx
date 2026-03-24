import { redirect } from "next/navigation";
import AccountLogin from "@/components/account-login";
import { StaticPreviewPage } from "@/components/static-preview-page";
import { getDashboardPathForRole } from "@/lib/dashboard-paths";
import { getAppSession } from "@/lib/auth";
import { isStaticExportMode } from "@/lib/runtime-mode";

export default async function LoginPage() {
  if (isStaticExportMode()) {
    return (
      <StaticPreviewPage
        eyebrow="Login Preview"
        title="Login is disabled in the static Pages build."
        body="Cloudflare Pages is serving a public demo only. Real sign-in, Google auth, and protected dashboards need the Worker deployment."
      />
    );
  }

  const session = await getAppSession();
  if (session?.user?.role) {
    redirect(getDashboardPathForRole(session.user.role));
  }

  return (
    <main className="login-page">
      <AccountLogin />
    </main>
  );
}
