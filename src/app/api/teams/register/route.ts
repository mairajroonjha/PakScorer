import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { registerTeamDb } from "@/lib/db-store";
import { teamRegistrationSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "team:register");
    const payload = await parseJson(request, teamRegistrationSchema);
    const team = await registerTeamDb(payload, actorId);
    return ok(team, { status: 201 });
  });
}
