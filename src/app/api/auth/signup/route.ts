import { NextRequest } from "next/server";
import { ok, parseJson, routeGuard } from "@/lib/api";
import { createPublicUserDb } from "@/lib/db-store";
import { publicSignupSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  return routeGuard(async () => {
    const payload = await parseJson(request, publicSignupSchema);
    const user = await createPublicUserDb(payload);
    return ok(user, { status: 201 });
  });
}
