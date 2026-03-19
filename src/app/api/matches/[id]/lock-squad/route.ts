import { NextRequest } from "next/server";
import { ok, requireCapability, routeGuard } from "@/lib/api";
import { lockMatchSquadDb } from "@/lib/db-store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "match:override-lock");
    const { id } = await params;
    const match = await lockMatchSquadDb(id, actorId);
    return ok(match);
  });
}
