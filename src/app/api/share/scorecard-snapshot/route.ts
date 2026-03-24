import { NextRequest } from "next/server";
import { ok, requireCapability, routeGuard } from "@/lib/api";
import { getScoreDb } from "@/lib/db-store";

export async function POST(request: NextRequest) {
  return routeGuard(async () => {
    await requireCapability(request, "match:view");
    const payload = (await request.json()) as { matchId: string };
    const score = await getScoreDb(payload.matchId);
    const snapshotUrl = `https://cdn.cricbela.local/share/${payload.matchId}-${Date.now()}.png`;
    return ok({
      snapshotUrl,
      social: {
        title: "PakScorer Live Scorecard",
        description: `Runs: ${score.runs}, Wickets: ${score.wickets}`
      }
    });
  });
}
