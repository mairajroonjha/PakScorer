import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { createTournamentWithAdminDb } from "@/lib/db-store";
import { superTournamentCreateSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "tournament:create");
    const payload = await parseJson(request, superTournamentCreateSchema);
    const result = await createTournamentWithAdminDb(payload, actorId);
    return ok(result, { status: 201 });
  });
}
