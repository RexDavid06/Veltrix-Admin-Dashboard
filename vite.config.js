import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The admin app talks to the same Django API as the customer frontend.
// In dev, requests to /api and /health are proxied to the local backend so no
// CORS preflight is needed; in production the built assets call VITE_API_BASE_URL
// (or same-origin) directly over HTTPS.
const backendTarget = process.env.VITE_BACKEND_PROXY_TARGET || "http://127.0.0.1:3000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: "0.0.0.0",
    proxy: {
      "/api": { target: backendTarget, changeOrigin: true },
      "/health": { target: backendTarget, changeOrigin: true },
    },
  },
  preview: {
    port: 5174,
  },
});
