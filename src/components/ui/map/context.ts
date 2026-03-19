"use client";

import { createContext, useContext } from "react";
import type MapLibreGL from "maplibre-gl";

// ─── Map Context ───────────────────────────────────────────────────

export type MapContextValue = {
  map: MapLibreGL.Map | null;
  isLoaded: boolean;
};

export const MapContext = createContext<MapContextValue | null>(null);

/**
 * Access the MapLibre GL map instance and its loaded state.
 * Must be used within a `<MapCanvas>` component.
 */
export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMap must be used within a MapCanvas component");
  }
  return context;
}

// ─── Marker Context ────────────────────────────────────────────────

export type MarkerContextValue = {
  marker: MapLibreGL.Marker;
  map: MapLibreGL.Map | null;
};

export const MarkerContext = createContext<MarkerContextValue | null>(null);

/**
 * Access the parent MapMarker's marker instance.
 * Must be used within a `<MapMarker>` component.
 */
export function useMarkerContext() {
  const context = useContext(MarkerContext);
  if (!context) {
    throw new Error("Marker sub-components must be used within a MapMarker");
  }
  return context;
}
