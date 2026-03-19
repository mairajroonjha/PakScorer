import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { updateSquadDb } from "@/lib/db-store";
import { squadUpdateSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "team:squad:write");
    const { id } = await params;
    const payload = await parseJson(request, squadUpdateSchema);
    const squad = await updateSquadDb(id, payload.tournamentId, payload.playerBcaIds, actorId);
    return ok(squad);
  });
}
