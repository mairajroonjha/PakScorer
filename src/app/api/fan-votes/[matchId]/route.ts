import { createHash } from "crypto";
import { NextRequest } from "next/server";
import { fail, ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { submitFanVoteDb } from "@/lib/db-store";
import { fanVoteSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ matchId: string }>;
}

function hashIdentity(deviceId: string, ip: string): string {
  return createHash("sha256").update(`${deviceId}:${ip}`).digest("hex");
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    await requireCapability(request, "fanvote:write");
    const payload = await parseJson(request, fanVoteSchema);
    if (!payload.otpVerified) {
      return fail("OTP verification required", 403);
    }
    const { matchId } = await params;
    const ip = request.headers.get("x-forwarded-for") ?? "0.0.0.0";
    const voterHash = hashIdentity(payload.deviceId, ip);
    const vote = await submitFanVoteDb(matchId, payload.playerId, voterHash);
    return ok(vote, { status: 201 });
  });
}
