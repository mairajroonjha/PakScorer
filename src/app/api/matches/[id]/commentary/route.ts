import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { addCommentaryDb } from "@/lib/db-store";
import { commentarySchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "match:commentary:write");
    const payload = await parseJson(request, commentarySchema);
    const { id } = await params;
    const event = await addCommentaryDb(id, payload.text, actorId);
    return ok(event);
  });
}
