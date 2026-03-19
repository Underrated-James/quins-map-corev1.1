"use client";

import { useEffect, useState } from "react";
import type MapLibreGL from "maplibre-gl";
import { useMap } from "./context";
import type { MapViewport, Theme } from "./types";
import { getDocumentTheme, getSystemTheme } from "./themes";

// ─── useViewport ───────────────────────────────────────────────────

/**
 * Reactively track the current map viewport (center, zoom, bearing, pitch).
 * Updates on every `move` event.
 */
export function useViewport(): MapViewport | null {
  const { map } = useMap();
  const [viewport, setViewport] = useState<MapViewport | null>(null);

  useEffect(() => {
    if (!map) return;

    const update = () => {
      const center = map.getCenter();
      setViewport({
        center: [center.lng, center.lat],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    };

    update();
    map.on("move", update);
    return () => {
      map.off("move", update);
    };
  }, [map]);

  return viewport;
}

// ─── useMapEvents ──────────────────────────────────────────────────

type MapEventHandlers = {
  onClick?: (e: MapLibreGL.MapMouseEvent) => void;
  onDblClick?: (e: MapLibreGL.MapMouseEvent) => void;
  onMouseMove?: (e: MapLibreGL.MapMouseEvent) => void;
  onMoveStart?: () => void;
  onMoveEnd?: () => void;
  onZoomStart?: () => void;
  onZoomEnd?: () => void;
  onLoad?: () => void;
  onIdle?: () => void;
};

/**
 * Declaratively bind map event listeners.
 *
 * ```tsx
 * useMapEvents({
 *   onClick: (e) => console.log("Clicked at", e.lngLat),
 *   onZoomEnd: () => console.log("Zoom complete"),
 * });
 * ```
 */
export function useMapEvents(handlers: MapEventHandlers) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;

    const entries: [string, (...args: unknown[]) => void][] = [];

    if (handlers.onClick) entries.push(["click", handlers.onClick as (...args: unknown[]) => void]);
    if (handlers.onDblClick) entries.push(["dblclick", handlers.onDblClick as (...args: unknown[]) => void]);
    if (handlers.onMouseMove) entries.push(["mousemove", handlers.onMouseMove as (...args: unknown[]) => void]);
    if (handlers.onMoveStart) entries.push(["movestart", handlers.onMoveStart as (...args: unknown[]) => void]);
    if (handlers.onMoveEnd) entries.push(["moveend", handlers.onMoveEnd as (...args: unknown[]) => void]);
    if (handlers.onZoomStart) entries.push(["zoomstart", handlers.onZoomStart as (...args: unknown[]) => void]);
    if (handlers.onZoomEnd) entries.push(["zoomend", handlers.onZoomEnd as (...args: unknown[]) => void]);
    if (handlers.onLoad) entries.push(["load", handlers.onLoad as (...args: unknown[]) => void]);
    if (handlers.onIdle) entries.push(["idle", handlers.onIdle as (...args: unknown[]) => void]);

    for (const [event, handler] of entries) {
      map.on(event as keyof MapLibreGL.MapEventType, handler as () => void);
    }

    return () => {
      for (const [event, handler] of entries) {
        map.off(event as keyof MapLibreGL.MapEventType, handler as () => void);
      }
    };
  }, [map, handlers]);
}

// ─── useResolvedTheme ──────────────────────────────────────────────

/**
 * Resolve the current theme, respecting prop override → document class → system preference.
 * Reactively watches for changes.
 */
export function useResolvedTheme(themeProp?: Theme): Theme {
  const [detectedTheme, setDetectedTheme] = useState<Theme>(
    () => getDocumentTheme() ?? getSystemTheme()
  );

  useEffect(() => {
    if (themeProp) return;

    const observer = new MutationObserver(() => {
      const docTheme = getDocumentTheme();
      if (docTheme) setDetectedTheme(docTheme);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (!getDocumentTheme()) {
        setDetectedTheme(e.matches ? "dark" : "light");
      }
    };
    mediaQuery.addEventListener("change", handleSystemChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleSystemChange);
    };
  }, [themeProp]);

  return themeProp ?? detectedTheme;
}

// ─── getViewport (utility) ─────────────────────────────────────────

/** Extract viewport state from a MapLibre map instance */
export function getViewport(map: MapLibreGL.Map): MapViewport {
  const center = map.getCenter();
  return {
    center: [center.lng, center.lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
}
