import { NextRequest } from "next/server";
import { ok, requireCapability, routeGuard } from "@/lib/api";
import { generateMonthlyAwardsCertificate } from "@/lib/monthly-awards";

export async function POST(request: NextRequest) {
  return routeGuard(async () => {
    await requireCapability(request, "tournament:approve");
    const cert = await generateMonthlyAwardsCertificate(new Date());
    return ok({
      generatedAt: new Date().toISOString(),
      certificate: cert
    });
  });
}
