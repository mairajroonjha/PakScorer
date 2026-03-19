import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { reviewTeamApplicationDb } from "@/lib/db-store";
import { teamApplicationDecisionSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "team:application:review");
    const payload = await parseJson(request, teamApplicationDecisionSchema);
    const { id } = await params;
    const application = await reviewTeamApplicationDb(id, "REJECTED", actorId, payload.rejectionReason);
    return ok(application);
  });
}
