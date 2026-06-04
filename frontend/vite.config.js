import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:5000",
      "/_/backend": {
        target: "http://127.0.0.1:5000",
        rewrite: (path) => path.replace(/^\/_\/backend/, ""),
      },
    },
  },
  preview: {
    proxy: {
      "/api": "http://127.0.0.1:5000",
      "/_/backend": {
        target: "http://127.0.0.1:5000",
        rewrite: (path) => path.replace(/^\/_\/backend/, ""),
      },
    },
  },
})
