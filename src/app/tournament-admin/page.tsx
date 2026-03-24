import Link from "next/link";
import { isStaticExportMode } from "@/lib/runtime-mode";
import { redirect } from "next/navigation";

export default function LegacyTournamentAdminPage() {
  if (isStaticExportMode()) {
    return <Link href="/admin/tournament">Open Tournament Admin Preview</Link>;
  }

  redirect("/admin/tournament");
}
