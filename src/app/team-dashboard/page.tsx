import Link from "next/link";
import { isStaticExportMode } from "@/lib/runtime-mode";
import { redirect } from "next/navigation";

export default function LegacyTeamDashboardPage() {
  if (isStaticExportMode()) {
    return <Link href="/team">Open Team Dashboard Preview</Link>;
  }

  redirect("/team");
}
