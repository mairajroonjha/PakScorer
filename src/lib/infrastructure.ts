export function getInfrastructureStatus() {
  return {
    database: process.env.DATABASE_URL ? "configured" : "missing",
    redis: process.env.REDIS_URL ? "configured" : "missing",
    authSecret: process.env.AUTH_SECRET ? "configured" : "missing"
  };
}
