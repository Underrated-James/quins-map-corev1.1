import type { Theme } from "./types";

/** Built-in tile style presets */
export const tilePresets = {
  "carto-light":
    "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  "carto-dark":
    "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  "carto-voyager":
    "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  osm: "https://tiles.openfreemap.org/styles/liberty",
  "high-contrast":
    "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
} as const;

/** Default light/dark style pair */
export const defaultStyles = {
  dark: tilePresets["carto-dark"],
  light: tilePresets["carto-light"],
};

// ─── Theme Detection ───────────────────────────────────────────────

/** Check document class for theme (works with next-themes, etc.) */
export function getDocumentTheme(): Theme | null {
  if (typeof document === "undefined") return null;
  if (document.documentElement.classList.contains("dark")) return "dark";
  if (document.documentElement.classList.contains("light")) return "light";
  return null;
}

/** Get system preference */
export function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
