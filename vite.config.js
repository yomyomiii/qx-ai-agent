import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: '/qx-ai-agent/',
  plugins: [react()],
  server: {
    port: 3003,
    proxy: {
      '/api/claude': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/claude/, ''),
      }
    }
  },
  optimizeDeps: {
    entries: [],
    include: ["react", "react-dom", "react/jsx-runtime"],
  },
});
