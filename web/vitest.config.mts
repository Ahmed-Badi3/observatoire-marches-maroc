import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Les tests lisent les fichiers de lib/ ; l'alias « @ » fonctionne comme dans le site.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    include: ["lib/**/*.test.ts"],
  },
});
