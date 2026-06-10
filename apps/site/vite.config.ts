// SPDX-License-Identifier: MIT

import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, "index.html"),
        invalid: resolve(import.meta.dirname, "invalid.html"),
      },
    },
  },
});
