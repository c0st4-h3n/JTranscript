import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Tauri 2 convenciona porta 1420 pro dev server.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: "127.0.0.1",
  },
  envPrefix: ["VITE_", "TAURI_ENV_*"],
  build: {
    target: "es2022",
    minify: process.env["TAURI_ENV_DEBUG"] ? false : "esbuild",
    sourcemap: !!process.env["TAURI_ENV_DEBUG"],
  },
});
