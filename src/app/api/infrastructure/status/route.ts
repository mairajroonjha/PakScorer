import { ok, routeGuard } from "@/lib/api";
import { getInfrastructureStatus } from "@/lib/infrastructure";

export async function GET() {
  return routeGuard(async () => ok(getInfrastructureStatus()));
}
