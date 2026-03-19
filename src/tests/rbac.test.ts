import { describe, expect, test } from "vitest";
import { can } from "@/lib/rbac";

describe("RBAC", () => {
  test("super admin can approve tournaments", () => {
    expect(can("SUPER_ADMIN", "tournament:approve")).toBe(true);
  });

  test("public viewer cannot score balls", () => {
    expect(can("PUBLIC_VIEWER", "match:ball:write")).toBe(false);
  });

  test("team admin can create direct matches", () => {
    expect(can("TEAM_ADMIN", "match:direct:create")).toBe(true);
  });
});
