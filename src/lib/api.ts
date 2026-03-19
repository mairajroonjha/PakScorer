import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { getAppSession } from "@/lib/auth";
import { assertCan } from "@/lib/rbac";
import { getDbRoleForUser } from "@/lib/db-store";

export async function getActorId(request: NextRequest): Promise<string> {
  const session = await getAppSession();
  if (session?.user?.id) {
    return session.user.id;
  }
  if (process.env.NODE_ENV === "test") {
    return request.headers.get("x-user-id") ?? "u-public";
  }
  return "u-public";
}

export async function requireCapability(request: NextRequest, capability: string): Promise<string> {
  const actorId = await getActorId(request);
  const role = await getDbRoleForUser(actorId);
  assertCan(role, capability);
  return actorId;
}

export async function parseJson<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  const input = await request.json();
  return schema.parse(input);
}

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function routeGuard(handler: () => Promise<NextResponse> | NextResponse): Promise<NextResponse> {
  try {
    return Promise.resolve(handler()).catch((error) =>
      fail(error instanceof Error ? error.message : "Unexpected error", 400)
    );
  } catch (error) {
    return Promise.resolve(fail(error instanceof Error ? error.message : "Unexpected error", 400));
  }
}
