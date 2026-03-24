const STATIC_EXPORT =
  process.env.STATIC_EXPORT === "true" ||
  process.env.NEXT_PUBLIC_STATIC_EXPORT === "true" ||
  process.env.CF_PAGES === "1";

export function isStaticExportMode(): boolean {
  return STATIC_EXPORT;
}

export function isClientStaticExportMode(): boolean {
  return process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";
}
