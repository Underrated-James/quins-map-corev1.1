import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, "src/lib.ts"),
      },
      formats: ["es", "cjs"],
      name: "QuinsMap",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "maplibre-gl",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "maplibre-gl": "maplibregl",
        },
      },
    },
  },
});
