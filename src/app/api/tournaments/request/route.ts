import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { requestTournamentDb } from "@/lib/db-store";
import { tournamentRequestSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "tournament:request");
    const payload = await parseJson(request, tournamentRequestSchema);
    const tournament = await requestTournamentDb(payload.name, payload.regionId, actorId);
    return ok(tournament, { status: 201 });
  });
}
