// SPDX-License-Identifier: MIT

import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/a11y",
  use: {
    baseURL: "http://127.0.0.1:4174",
  },
  webServer: {
    command: "pnpm preview --port 4174",
    reuseExistingServer: true,
    timeout: 30_000,
    url: "http://127.0.0.1:4174",
  },
});
