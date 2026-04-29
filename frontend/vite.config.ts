import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        // 127.0.0.1: avoid Windows resolving "localhost" to ::1 while API listens on IPv4;
        // long timeouts + explicit proxyTimeout reduce spurious ECONNRESET from http-proxy.
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
        secure: false,
        timeout: 60_000,
        proxyTimeout: 60_000,
        configure(proxy) {
          proxy.on("error", (err) => {
            console.error("[vite proxy]", err.message);
          });
        },
      },
    },
  },
});
