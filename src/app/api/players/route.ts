import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { createPlayerDb } from "@/lib/db-store";
import { playerCreateSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "team:squad:write");
    const payload = await parseJson(request, playerCreateSchema);
    const player = await createPlayerDb(payload.fullName, actorId, payload.phone);
    return ok(player, { status: 201 });
  });
}
