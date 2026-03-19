import { NextRequest } from "next/server";
import { ok, parseJson, requireCapability, routeGuard } from "@/lib/api";
import { updateUserRoleDb } from "@/lib/db-store";
import { roleUpdateSchema } from "@/lib/validation";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  return routeGuard(async () => {
    const actorId = await requireCapability(request, "user:role:write");
    const payload = await parseJson(request, roleUpdateSchema);
    const { id } = await params;
    const user = await updateUserRoleDb(id, payload.role, actorId);
    return ok(user);
  });
}
