import { NextRequest } from "next/server";
import { fail, ok, requireCapability, routeGuard } from "@/lib/api";
import { getPlayerByBcaIdDb } from "@/lib/db-store";

interface Params {
  params: Promise<{ bcaId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    await requireCapability(request, "match:view");
    const { bcaId } = await params;
    const player = await getPlayerByBcaIdDb(bcaId);
    if (!player) {
      return fail("Player not found", 404);
    }
    return ok(player);
  });
}
