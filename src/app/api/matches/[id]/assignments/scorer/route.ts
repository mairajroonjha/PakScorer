import { NextRequest } from "next/server";
import { assignMatchScorerDb } from "@/lib/db-store";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { scorerAssignmentSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "match:assignment:write");
    const payload = await parseJson(request, scorerAssignmentSchema);
    const { id } = await params;
    const assignment = await assignMatchScorerDb(id, payload.scorerUserId ?? null, actorId);
    return ok(assignment);
  });
}
