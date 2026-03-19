import "next-auth";
import "next-auth/jwt";
import type { DefaultSession } from "next-auth";
import type { Role } from "@/types/domain";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      regionId: string;
    };
  }

  interface User {
    id: string;
    role: Role;
    regionId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    regionId?: string;
  }
}
