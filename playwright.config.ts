import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

// E2E smoke (SDD section 11): a production build (`next start`) on its own port against the local
// Docker database. Uses the installed Microsoft Edge by default, so no Playwright browser download
// is needed; set PW_CHANNEL=chrome (or chromium after `npx playwright install`) to switch.
if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  // One database and one login rate limit: run tests one at a time.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  timeout: 60_000,
  use: {
    baseURL: BASE_URL,
    channel: process.env.PW_CHANNEL ?? "msedge",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
    {
      name: "mobile",
      use: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `${BASE_URL}/admin/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    // The API's Origin check compares against SITE_URL, so it must be this server's address.
    env: { SITE_URL: BASE_URL },
  },
});
