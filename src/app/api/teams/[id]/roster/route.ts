import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { manageTeamRosterDb } from "@/lib/db-store";
import { teamRosterManageSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "team:squad:write");
    const { id } = await params;
    const payload = await parseJson(request, teamRosterManageSchema);
    const roster = await manageTeamRosterDb(
      id,
      payload.tournamentId,
      payload.players.map((player) => ({
        bcaId: player.bcaId,
        roleTag: player.roleTag,
        availabilityStatus: player.availabilityStatus ?? "AVAILABLE",
        isSubstitute: player.isSubstitute ?? false
      })),
      actorId
    );
    return ok(roster);
  });
}
