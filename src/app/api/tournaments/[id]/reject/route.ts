import { NextRequest } from "next/server";
import { ok, requireCapability, routeGuard } from "@/lib/api";
import { updateTournamentStatusDb } from "@/lib/db-store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "tournament:reject");
    const { id } = await params;
    const tournament = await updateTournamentStatusDb(id, "REJECTED", actorId);
    return ok(tournament);
  });
}
