import { NextRequest } from "next/server";
import { ok, requireCapability, routeGuard } from "@/lib/api";
import { getDbAuditLogs } from "@/lib/db-store";

export async function GET(request: NextRequest) {
  return routeGuard(async () => {
    await requireCapability(request, "tournament:view");
    return ok(await getDbAuditLogs());
  });
}
