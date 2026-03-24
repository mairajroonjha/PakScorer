import { NextRequest } from "next/server";
import { getAppSession } from "@/lib/auth";
import { ok, parseJson, routeGuard } from "@/lib/api";
import { getDbAuthUserById, submitTournamentRegistrationRequestDb } from "@/lib/db-store";
import { tournamentRegistrationRequestSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  return routeGuard(async () => {
    const session = await getAppSession();
    const actorId = session?.user?.id;

    if (!actorId || session.user.role !== "PUBLIC_VIEWER") {
      throw new Error("Sign in with an organizer account before requesting a tournament");
    }

    const organizer = await getDbAuthUserById(actorId);
    if (!organizer?.email || !organizer.passwordHash) {
      throw new Error("Organizer account must use email and password login before requesting a tournament");
    }

    if (!organizer.phone) {
      throw new Error("Organizer account must include a phone number before requesting a tournament");
    }

    const payload = await parseJson(request, tournamentRegistrationRequestSchema);
    const registration = await submitTournamentRegistrationRequestDb({
      ...payload,
      regionId: organizer.regionId,
      organizerName: organizer.name,
      organizerPhone: organizer.phone,
      adminName: organizer.name,
      adminEmail: organizer.email,
      adminPhone: organizer.phone,
      adminPasswordHash: organizer.passwordHash,
      requestedBy: actorId,
      sponsorName: undefined,
      tournamentType: "League",
      ruleSummary: "Basic playing conditions will be finalized after Super Admin review."
    });
    return ok(registration, { status: 201 });
  });
}
