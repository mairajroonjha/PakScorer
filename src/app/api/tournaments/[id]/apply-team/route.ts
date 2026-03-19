import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { applyTeamToTournamentDb } from "@/lib/db-store";
import { teamTournamentApplicationSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "team:application:apply");
    const payload = await parseJson(request, teamTournamentApplicationSchema);
    const { id } = await params;
    const application = await applyTeamToTournamentDb(payload.teamId, id, actorId);
    return ok(application, { status: 201 });
  });
}
