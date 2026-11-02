import { defineConfig } from "astro/config";

const base = process.env.BASE_PATH || "/";

export default defineConfig({
  site: process.env.SITE_URL || undefined,
  base,
  trailingSlash: "ignore",
  build: {
    format: "directory",
    inlineStylesheets: "auto",
  },
  devToolbar: { enabled: false },
});
