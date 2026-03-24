import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { startSecondInningsDb } from "@/lib/db-store";
import { secondInningsSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "match:innings:write");
    const payload = await parseJson(request, secondInningsSchema);
    const { id } = await params;
    const result = await startSecondInningsDb(id, payload.targetRuns, actorId);
    return ok(result);
  });
}
