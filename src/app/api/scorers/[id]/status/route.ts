import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { updateScorerStatusDb } from "@/lib/db-store";
import { scorerStatusSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "user:scorer:manage");
    const payload = await parseJson(request, scorerStatusSchema);
    const { id } = await params;
    const user = await updateScorerStatusDb(id, payload.status, actorId);
    return ok(user);
  });
}
