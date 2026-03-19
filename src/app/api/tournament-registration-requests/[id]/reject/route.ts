import { NextRequest } from "next/server";
import { ok, requireCapability, routeGuard } from "@/lib/api";
import { rejectTournamentRegistrationRequestDb } from "@/lib/db-store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "tournament:reject");
    const payload = (await request.json()) as { rejectionReason?: string };
    const { id } = await params;
    const registration = await rejectTournamentRegistrationRequestDb(
      id,
      payload.rejectionReason ?? "Registration request rejected by Super Admin",
      actorId
    );
    return ok(registration);
  });
}
