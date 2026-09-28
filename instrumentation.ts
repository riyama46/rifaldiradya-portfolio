// Runs once when the Next.js server starts. In production, fail fast with a readable message
// instead of random runtime errors when an environment variable is missing (SDD section 9).
export async function register() {
  const isProductionServer =
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build";

  // SKIP_ENV_VALIDATION=1 is only for trying a production build locally without real secrets.
  if (isProductionServer && process.env.SKIP_ENV_VALIDATION !== "1") {
    const { assertServerEnv } = await import("./lib/env");
    assertServerEnv();
  }
}
