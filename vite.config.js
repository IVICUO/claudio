import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the app at /claudio/, so set base accordingly in production.
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: mode === "production" ? "/claudio/" : "/",
  server: { port: 5173 },
  build: { outDir: "dist", sourcemap: false },
}));
