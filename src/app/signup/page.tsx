import { redirect } from "next/navigation";
import AccountSignup from "@/components/account-signup";
import { StaticPreviewPage } from "@/components/static-preview-page";
import { getAppSession } from "@/lib/auth";
import { getDashboardPathForRole } from "@/lib/dashboard-paths";
import { isStaticExportMode } from "@/lib/runtime-mode";

export default async function SignupPage() {
  if (isStaticExportMode()) {
    return (
      <StaticPreviewPage
        eyebrow="Signup Preview"
        title="Signup is disabled in the static Pages build."
        body="The Pages deployment is meant to show the public product surface. Account creation, team registration, and tournament request flows require the Worker deployment."
      />
    );
  }

  const session = await getAppSession();
  if (session?.user?.role) {
    redirect(getDashboardPathForRole(session.user.role));
  }

  return (
    <main className="login-page">
      <AccountSignup />
    </main>
  );
}
