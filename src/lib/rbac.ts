import { Role } from "@/types/domain";

const rolePolicies: Record<Role, Set<string>> = {
  SUPER_ADMIN: new Set([
    "user:role:write",
    "tournament:create",
    "tournament:approve",
    "tournament:reject",
    "tournament:request",
    "tournament:view",
    "team:register",
    "team:manage",
    "team:application:apply",
    "team:application:review",
    "match:direct:create",
    "match:correction:approve",
    "match:correction:request",
    "match:override-lock",
    "match:toss:write",
    "match:ball:write",
    "match:commentary:write",
    "team:squad:write",
    "fanvote:write",
    "news:read",
    "news:write",
    "match:view",
    "leaderboard:view"
  ]),
  TOURNAMENT_ADMIN: new Set([
    "tournament:request",
    "tournament:view",
    "team:squad:write",
    "team:application:review",
    "match:toss:write",
    "match:correction:request",
    "match:view",
    "news:read",
    "news:write",
    "leaderboard:view"
  ]),
  TEAM_ADMIN: new Set([
    "team:register",
    "team:manage",
    "team:squad:write",
    "team:application:apply",
    "match:direct:create",
    "match:view",
    "leaderboard:view",
    "news:read"
  ]),
  MATCH_SCORER: new Set([
    "match:toss:write",
    "match:ball:write",
    "match:commentary:write",
    "match:view",
    "news:read",
    "leaderboard:view"
  ]),
  PUBLIC_VIEWER: new Set(["match:view", "leaderboard:view", "news:read", "fanvote:write"])
};

export function can(role: Role, capability: string): boolean {
  return rolePolicies[role].has(capability);
}

export function assertCan(role: Role, capability: string): void {
  if (!can(role, capability)) {
    throw new Error(`Forbidden: ${role} cannot ${capability}`);
  }
}
