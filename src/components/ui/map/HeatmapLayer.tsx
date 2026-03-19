"use client";

import type MapLibreGL from "maplibre-gl";
import type * as GeoJSON from "geojson";
import { useEffect, useId, useRef } from "react";

import { useMap } from "./context";

// ─── HeatmapLayer ──────────────────────────────────────────────────

type HeatmapLayerProps = {
  /** GeoJSON point data (FeatureCollection or URL) */
  data: string | GeoJSON.FeatureCollection<GeoJSON.Point>;
  /** Property name that holds the weight/intensity value */
  weightProperty?: string;
  /** Heatmap radius in pixels (default: 20) */
  radius?: number;
  /** Heatmap intensity multiplier (default: 1) */
  intensity?: number;
  /** Heatmap opacity (default: 0.8) */
  opacity?: number;
  /** Max zoom to show heatmap (transitions to points above) (default: 15) */
  maxZoom?: number;
  /** Color ramp: array of [stop, color] pairs from low to high density */
  colorRamp?: [number, string][];
};

const defaultColorRamp: [number, string][] = [
  [0, "rgba(33,102,172,0)"],
  [0.2, "rgb(103,169,207)"],
  [0.4, "rgb(209,229,240)"],
  [0.6, "rgb(253,219,120)"],
  [0.8, "rgb(239,138,98)"],
  [1, "rgb(178,24,43)"],
];

function HeatmapLayer({
  data,
  weightProperty,
  radius = 20,
  intensity = 1,
  opacity = 0.8,
  maxZoom = 15,
  colorRamp = defaultColorRamp,
}: HeatmapLayerProps) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `heatmap-source-${id}`;
  const layerId = `heatmap-layer-${id}`;
  const propsRef = useRef({ radius, intensity, opacity, colorRamp });

  useEffect(() => {
    if (!isLoaded || !map) return;

    map.addSource(sourceId, {
      type: "geojson",
      data,
    });

    const colorExpression: unknown[] = ["interpolate", ["linear"], ["heatmap-density"]];
    for (const [stop, color] of colorRamp) {
      colorExpression.push(stop, color);
    }

    map.addLayer({
      id: layerId,
      type: "heatmap",
      source: sourceId,
      maxzoom: maxZoom,
      paint: {
        "heatmap-weight": weightProperty
          ? ["interpolate", ["linear"], ["get", weightProperty], 0, 0, 10, 1]
          : 1,
        "heatmap-intensity": [
          "interpolate", ["linear"], ["zoom"],
          0, 1,
          maxZoom, intensity * 3,
        ],
        "heatmap-color": colorExpression as unknown as MapLibreGL.ExpressionSpecification,
        "heatmap-radius": [
          "interpolate", ["linear"], ["zoom"],
          0, radius / 2,
          maxZoom, radius,
        ],
        "heatmap-opacity": [
          "interpolate", ["linear"], ["zoom"],
          maxZoom - 1, opacity,
          maxZoom, 0,
        ],
      },
    });

    return () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map]);

  // Update data
  useEffect(() => {
    if (!isLoaded || !map || typeof data === "string") return;
    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
    if (source) source.setData(data);
  }, [isLoaded, map, data, sourceId]);

  // Update paint
  useEffect(() => {
    if (!isLoaded || !map || !map.getLayer(layerId)) return;
    const prev = propsRef.current;

    if (prev.radius !== radius) {
      map.setPaintProperty(layerId, "heatmap-radius", [
        "interpolate", ["linear"], ["zoom"], 0, radius / 2, maxZoom, radius,
      ]);
    }
    if (prev.intensity !== intensity) {
      map.setPaintProperty(layerId, "heatmap-intensity", [
        "interpolate", ["linear"], ["zoom"], 0, 1, maxZoom, intensity * 3,
      ]);
    }
    if (prev.opacity !== opacity) {
      map.setPaintProperty(layerId, "heatmap-opacity", [
        "interpolate", ["linear"], ["zoom"], maxZoom - 1, opacity, maxZoom, 0,
      ]);
    }
    propsRef.current = { radius, intensity, opacity, colorRamp };
  }, [isLoaded, map, layerId, maxZoom, radius, intensity, opacity, colorRamp]);

  return null;
}

export { HeatmapLayer };
export type { HeatmapLayerProps };
