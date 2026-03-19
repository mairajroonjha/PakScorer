import { redirect } from "next/navigation";
import { getDashboardPathForRole } from "@/lib/dashboard-paths";
import { getAppSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardRedirectPage() {
  const session = await getAppSession();
  if (!session?.user?.role) {
    redirect("/login");
  }
  redirect(getDashboardPathForRole(session.user.role));
}
