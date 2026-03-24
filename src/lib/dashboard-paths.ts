import type { Role } from "@/types/domain";

const allRoles: Role[] = ["SUPER_ADMIN", "TOURNAMENT_ADMIN", "TEAM_ADMIN", "MATCH_SCORER", "PUBLIC_VIEWER"];

export const protectedRoutePolicies: Array<{ prefix: string; roles: Role[] }> = [
  { prefix: "/admin/super", roles: ["SUPER_ADMIN"] },
  { prefix: "/admin/tournament", roles: ["SUPER_ADMIN", "TOURNAMENT_ADMIN"] },
  { prefix: "/team", roles: ["TEAM_ADMIN", "SUPER_ADMIN"] },
  { prefix: "/scorer", roles: ["MATCH_SCORER", "SUPER_ADMIN", "TOURNAMENT_ADMIN"] },
  { prefix: "/get-started", roles: ["PUBLIC_VIEWER"] },
  { prefix: "/account", roles: allRoles }
];

export function getDashboardPathForRole(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/admin/super";
    case "TOURNAMENT_ADMIN":
      return "/admin/tournament";
    case "TEAM_ADMIN":
      return "/team";
    case "MATCH_SCORER":
      return "/scorer";
    case "PUBLIC_VIEWER":
    default:
      return "/get-started";
  }
}

export function canRoleAccessPath(role: Role, pathname: string): boolean {
  const protectedRoute = protectedRoutePolicies.find((entry) => pathname.startsWith(entry.prefix));
  if (!protectedRoute) {
    return true;
  }
  return protectedRoute.roles.includes(role);
}
