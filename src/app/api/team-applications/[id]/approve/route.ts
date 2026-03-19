import { NextRequest } from "next/server";
import { ok, requireCapability, routeGuard } from "@/lib/api";
import { reviewTeamApplicationDb } from "@/lib/db-store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "team:application:review");
    const { id } = await params;
    const application = await reviewTeamApplicationDb(id, "APPROVED", actorId);
    return ok(application);
  });
}
