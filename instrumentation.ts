// Runs once when the Next.js server starts, whatever start command the host uses (Hostinger
// starts Next.js directly, not `npm start`).
//   1. Fail fast with a readable message when a required environment variable is missing.
//   2. Apply pending database migrations. If the DB is unreachable or a migration fails, log it and
//      keep serving: public pages are static and must stay up (SDD NFR "Ketersediaan").
export async function register() {
  const isProductionServer =
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build";
  if (!isProductionServer) return;

  const { assertServerEnv, databaseEnv } = await import("./lib/env");

  // SKIP_ENV_VALIDATION=1 is only for trying a production build locally without real secrets.
  if (process.env.SKIP_ENV_VALIDATION !== "1") assertServerEnv();

  if (process.env.SKIP_MIGRATIONS === "1") return;

  const { isUnreachable, runMigrations } = await import("./lib/db/migrate");
  try {
    await runMigrations(databaseEnv());
    console.log("[migrate] database is up to date");
  } catch (error) {
    if (isUnreachable(error)) {
      console.warn("[migrate] database unreachable; skipping migrations until the next start");
    } else {
      console.error("[migrate] failed:", (error as Error).message);
    }
  }
}
