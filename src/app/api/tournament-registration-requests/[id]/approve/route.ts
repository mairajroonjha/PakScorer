import { NextRequest } from "next/server";
import { ok, requireCapability, routeGuard } from "@/lib/api";
import { approveTournamentRegistrationRequestDb } from "@/lib/db-store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "tournament:approve");
    const { id } = await params;
    const result = await approveTournamentRegistrationRequestDb(id, actorId);
    return ok(result);
  });
}
