import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ["vue"],
          element: ["element-plus", "@element-plus/icons-vue"],
          echarts: ["echarts"]
        }
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 5173
  }
});
