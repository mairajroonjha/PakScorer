import { NextRequest } from "next/server";
import { createScorerUserDb } from "@/lib/db-store";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { scorerCreateSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "user:scorer:create");
    const payload = await parseJson(request, scorerCreateSchema);
    const user = await createScorerUserDb(payload, actorId);
    return ok(user, { status: 201 });
  });
}
