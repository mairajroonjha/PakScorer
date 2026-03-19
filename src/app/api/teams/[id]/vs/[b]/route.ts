import { NextRequest } from "next/server";
import { ok, requireCapability, routeGuard } from "@/lib/api";
import { headToHeadDb } from "@/lib/db-store";

interface Params {
  params: Promise<{ id: string; b: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    await requireCapability(request, "match:view");
    const { id, b } = await params;
    return ok(await headToHeadDb(id, b));
  });
}
