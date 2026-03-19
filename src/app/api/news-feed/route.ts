import { NextRequest } from "next/server";
import { ok, requireCapability, routeGuard } from "@/lib/api";
import { addNewsDb, listNewsDb } from "@/lib/db-store";

export async function GET(request: NextRequest) {
  return routeGuard(async () => {
    await requireCapability(request, "news:read");
    return ok(await listNewsDb());
  });
}

export async function POST(request: NextRequest) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "news:write");
    const payload = (await request.json()) as { title: string; body: string };
    return ok(await addNewsDb(payload.title, payload.body, actorId), { status: 201 });
  });
}
