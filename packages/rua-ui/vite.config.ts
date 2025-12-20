import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      filename: "./dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "RuaUI",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        // Mark all dependencies as external to avoid bundling them
        "@tanstack/react-virtual",
        "fuse.js",
        /^motion/,  // Motion animation library
        "pinyin-match",
        "react-markdown",
        "date-fns",
        // Base UI components (used by animate-ui)
        /^@base-ui-components/,
        /^@base-ui/,
        // Iconify (used for icons)
        /^@iconify/,
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") return "style.css";
          return assetInfo.name || "asset";
        },
      },
    },
    cssCodeSplit: false,
    // Use hidden source maps to reduce file size while maintaining debugging capability
    sourcemap: "hidden",
    // Enable minification for smaller bundle
    minify: "esbuild",
    target: "es2020",
  },
});
