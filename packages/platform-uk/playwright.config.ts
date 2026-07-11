import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /patient-dashboard\.spec\.ts/,
    },
    {
      name: "mobile",
      use: { ...devices["iPhone 14"], browserName: "chromium" },
      testMatch: /patient-dashboard\.spec\.ts/,
    },
  ],
  globalSetup: "./e2e/global-setup.ts",
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "local-e2e-nextauth-secret",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? baseURL,
      SKIP_EMAIL_SEND: "true",
      DISABLE_RATE_LIMIT: process.env.DISABLE_RATE_LIMIT ?? "true",
      CI: process.env.CI ?? "",
    },
  },
});
