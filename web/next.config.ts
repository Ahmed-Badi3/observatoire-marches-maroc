import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Au build, les pages se préparent une par une dans chaque processus : elles partagent une seule
  // connexion à la base (lib/db.ts), et plusieurs pages en même temps se bloquaient mutuellement.
  experimental: {
    staticGenerationMaxConcurrency: 1,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
