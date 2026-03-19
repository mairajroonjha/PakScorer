import { NextRequest } from "next/server";
import { ok, requireCapability, routeGuard } from "@/lib/api";
import { completeMatchDb } from "@/lib/db-store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "match:correction:approve");
    const { id } = await params;
    const match = await completeMatchDb(id, actorId);
    return ok(match);
  });
}
