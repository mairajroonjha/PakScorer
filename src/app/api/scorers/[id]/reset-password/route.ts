import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { resetScorerPasswordDb } from "@/lib/db-store";
import { scorerPasswordResetSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "user:scorer:manage");
    const payload = await parseJson(request, scorerPasswordResetSchema);
    const { id } = await params;
    const user = await resetScorerPasswordDb(id, payload.password, actorId);
    return ok(user);
  });
}
