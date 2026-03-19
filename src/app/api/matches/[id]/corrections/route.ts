import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { approveCorrectionDb, requestCorrectionDb } from "@/lib/db-store";
import { correctionSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "match:correction:request");
    const payload = await parseJson(request, correctionSchema);
    const { id } = await params;
    const correction = await requestCorrectionDb(id, payload.targetEventId, payload.reason, actorId);
    return ok(correction, { status: 201 });
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "match:correction:approve");
    const { correctionId } = (await request.json()) as { correctionId: string };
    const { id } = await params;
    const correction = await approveCorrectionDb(id, correctionId, actorId);
    return ok(correction);
  });
}
