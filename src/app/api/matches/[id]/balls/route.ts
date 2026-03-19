import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { addBallEventDb, getScoreDb } from "@/lib/db-store";
import { ballEventSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "match:ball:write");
    const payload = await parseJson(request, ballEventSchema);
    const { id } = await params;
    const event = await addBallEventDb(id, { ...payload, createdBy: actorId });
    const score = await getScoreDb(id);
    return ok({ event, score }, { status: 201 });
  });
}
