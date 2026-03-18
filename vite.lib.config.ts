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
        routing: path.resolve(__dirname, "src/routing.ts"),
      },
      formats: ["es", "cjs"],
      name: "LeafletKit",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "leaflet",
        "leaflet-routing-machine",
        "leaflet-draw",
        "leaflet.markercluster",
        "leaflet.heat",
        "leaflet.vectorgrid",
      ],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          leaflet: "L",
        },
      },
    },
  },
});
