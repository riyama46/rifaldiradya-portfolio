// GA4 Measurement ID, inlined at build time (NEXT_PUBLIC_*). Empty or malformed → analytics and the
// consent banner are not rendered at all (SDD section 9), e.g. in development and until Pal sets
// the ID in Hostinger (a redeploy is needed because the value is baked into the build).
const raw = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

export const GA_MEASUREMENT_ID: string | null = /^G-[A-Z0-9]+$/.test(raw) ? raw : null;

export const analyticsEnabled = GA_MEASUREMENT_ID !== null;
