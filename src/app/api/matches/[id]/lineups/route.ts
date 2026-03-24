import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { submitMatchLineupDb } from "@/lib/db-store";
import { matchLineupSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "match:lineup:write");
    const payload = await parseJson(request, matchLineupSchema);
    const { id } = await params;
    const lineup = await submitMatchLineupDb(id, payload.teamId, payload.playerIds, actorId);
    return ok(lineup);
  });
}
