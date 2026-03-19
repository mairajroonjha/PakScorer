import { NextRequest } from "next/server";
import { ok, requireCapability, routeGuard } from "@/lib/api";
import { getWagonWheelDb } from "@/lib/db-store";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    await requireCapability(request, "match:view");
    const { id } = await params;
    return ok(await getWagonWheelDb(id));
  });
}
