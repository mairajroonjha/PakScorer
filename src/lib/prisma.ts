import { PrismaClient } from "@prisma/client";

declare global {
  var __cricbelaPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__cricbelaPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__cricbelaPrisma = prisma;
}
