import { redirect } from "next/navigation";
import AccountLogin from "@/components/account-login";
import { getDashboardPathForRole } from "@/lib/dashboard-paths";
import { getAppSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
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
