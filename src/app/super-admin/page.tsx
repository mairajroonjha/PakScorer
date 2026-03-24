import Link from "next/link";
import { isStaticExportMode } from "@/lib/runtime-mode";
import { redirect } from "next/navigation";

export default function LegacySuperAdminPage() {
  if (isStaticExportMode()) {
    return <Link href="/admin/super">Open Super Admin Preview</Link>;
  }

  redirect("/admin/super");
}
