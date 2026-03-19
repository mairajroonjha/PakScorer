import { NextRequest } from "next/server";
import { fail, ok, requireCapability, routeGuard } from "@/lib/api";
import { getDbDashboardOverview, getDbRoleForUser } from "@/lib/db-store";

export async function GET(request: NextRequest) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "match:view");
    const role = await getDbRoleForUser(actorId);
    if (role === "PUBLIC_VIEWER") {
      return fail("Public users cannot access internal dashboard data", 403);
    }
    return ok(await getDbDashboardOverview());
  });
}
