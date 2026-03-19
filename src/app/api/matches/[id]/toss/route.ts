import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { applyTossDb } from "@/lib/db-store";
import { tossSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "match:toss:write");
    const payload = await parseJson(request, tossSchema);
    const { id } = await params;
    const match = await applyTossDb(id, payload.tossWinnerTeamId, payload.electedTo, actorId);
    return ok(match);
  });
}
