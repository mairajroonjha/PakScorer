import { NextRequest } from "next/server";
import { ok, requireCapability, routeGuard } from "@/lib/api";
import { getTop10Db } from "@/lib/db-store";

export async function GET(request: NextRequest) {
  return routeGuard(async () => {
    await requireCapability(request, "leaderboard:view");
    const scope = request.nextUrl.searchParams.get("scope") ?? "global";
    const snapshot = await getTop10Db(scope);
    return ok(snapshot);
  });
}
