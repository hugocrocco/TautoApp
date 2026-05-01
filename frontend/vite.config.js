import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// NOTE: no importes package.json aquí.

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});