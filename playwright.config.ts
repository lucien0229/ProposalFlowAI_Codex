import { defineConfig } from "@playwright/test";

const webBaseURL = "http://127.0.0.1:3000";
const adminBaseURL = "http://127.0.0.1:3001";

export default defineConfig({
  testDir: "./tests/smoke",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "pnpm --dir apps/web dev -- --port 3000",
      url: webBaseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm --dir apps/admin dev -- --port 3001",
      url: adminBaseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "web-shell",
      use: {
        baseURL: webBaseURL,
      },
    },
    {
      name: "admin-shell",
      use: {
        baseURL: adminBaseURL,
      },
    },
  ],
});
