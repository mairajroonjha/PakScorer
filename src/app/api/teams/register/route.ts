import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { getDbRoleForUser, registerTeamDb, updateUserRoleDb } from "@/lib/db-store";
import { teamRegistrationSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "team:register");
    const payload = await parseJson(request, teamRegistrationSchema);
    const role = await getDbRoleForUser(actorId);
    const team = await registerTeamDb(payload, actorId);
    const promotedRole =
      role === "PUBLIC_VIEWER" ? (await updateUserRoleDb(actorId, "TEAM_ADMIN", actorId)).role : role;

    return ok(
      {
        team,
        promotedRole
      },
      { status: 201 }
    );
  });
}
