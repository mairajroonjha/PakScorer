import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { createDirectMatchRequestDb } from "@/lib/db-store";
import { directMatchRequestSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "match:direct:create");
    const payload = await parseJson(request, directMatchRequestSchema);
    const directMatch = await createDirectMatchRequestDb(payload, actorId);
    return ok(directMatch, { status: 201 });
  });
}
