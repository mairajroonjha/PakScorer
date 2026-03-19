import { NextRequest } from "next/server";
import { ok, parseJson, routeGuard } from "@/lib/api";
import { submitTournamentRegistrationRequestDb } from "@/lib/db-store";
import { tournamentRegistrationRequestSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  return routeGuard(async () => {
    const payload = await parseJson(request, tournamentRegistrationRequestSchema);
    const registration = await submitTournamentRegistrationRequestDb(payload);
    return ok(registration, { status: 201 });
  });
}
