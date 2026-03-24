import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { respondToDirectMatchRequestDb } from "@/lib/db-store";
import { directMatchResponseSchema } from "@/lib/validation";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "match:direct:review");
    const payload = await parseJson(request, directMatchResponseSchema);
    const { id } = await context.params;
    const result = await respondToDirectMatchRequestDb(id, payload, actorId);
    return ok(result);
  });
}
