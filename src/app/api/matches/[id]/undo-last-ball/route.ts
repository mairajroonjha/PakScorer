import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { undoLastBallDb } from "@/lib/db-store";
import { undoBallSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "match:undo:write");
    const payload = await parseJson(request, undoBallSchema);
    const { id } = await params;
    const result = await undoLastBallDb(id, payload.reason, actorId);
    return ok(result);
  });
}
