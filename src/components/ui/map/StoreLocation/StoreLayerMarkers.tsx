"use client";

import { SmartMarkers } from "../SmartMarkers";
import type { StoreLayerMarkersConfig } from "./types";

/**
 * Renders many markers using the MapLibre engine instead of React nodes
 * for very high performance rendering. Falls back to clusters automatically if threshold exceeds.
 */
export function StoreLayerMarkers({ config }: { config: StoreLayerMarkersConfig }) {
  if (!config.data?.features?.length) return null;

  return (
    <SmartMarkers
      data={config.data}
      pointColor={config.pointColor ?? "#3b82f6"}
      pointRadius={config.pointRadius ?? 6}
      onPointClick={config.onPointClick}
      // Force high perf by setting domthreshold extremely low
      domThreshold={0} 
      clusterThreshold={0} // Disable clustering by default, rely purely on geojson engine
    />
  );
}
