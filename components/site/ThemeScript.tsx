import { themeScript } from "@/lib/theme";

// O-04 / D-23: sets <html data-theme> before first paint so there is never a flash of the wrong
// theme. Inline, so it is covered by the existing script-src 'unsafe-inline' (Delta SDD section 6).
// Rendered right after CspMeta in <head>; <html> needs suppressHydrationWarning for this attribute.
export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
}
