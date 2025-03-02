import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [react()],

  // These need to be in to clean up @emotion duplication
  optimizeDeps: {
    include: [
      '@emotion/react', 'ace-linters/build/service-manager',
      // 'ace-linters/build/typescript-service', 'ace-code/src/mode/typescript',
      'ace-code/src/mode/json', 'ace-linters/build/json-service',
      'ace-code/src/mode/jvascript', 'ace-linters/build/javascript-service',
      'ace-code/src/mode/xml', 'ace-linters/build/xml-service',
      'ace-code/src/mode/html', 'ace-linters/build/html-service',
      'ace-code/src/mode/css', 'ace-linters/build/css-service',
      'ace-code/src/mode/text', 'ace-code/src/mode/text'
    ],
  },
  resolve: {
    dedupe: ['@emotion/react']
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available

  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
        protocol: "ws",
        host,
        port: 1421,
      }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
