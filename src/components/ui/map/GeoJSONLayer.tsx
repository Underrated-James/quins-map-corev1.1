"use client";

import type MapLibreGL from "maplibre-gl";
import type * as GeoJSON from "geojson";
import { useEffect, useId, useRef } from "react";

import { useMap } from "./context";

// ─── GeoJSONLayer ──────────────────────────────────────────────────

type GeoJSONLayerProps = {
  /** GeoJSON data object or URL to fetch */
  data: string | GeoJSON.GeoJSON;
  /** Fill color for polygon features (default: "#3b82f6") */
  fillColor?: string;
  /** Fill opacity (default: 0.3) */
  fillOpacity?: number;
  /** Stroke/line color (default: "#2563eb") */
  strokeColor?: string;
  /** Stroke width for lines and polygon borders (default: 2) */
  strokeWidth?: number;
  /** Stroke opacity (default: 0.8) */
  strokeOpacity?: number;
  /** Point circle radius (default: 5) */
  pointRadius?: number;
  /** Point circle color (default: "#3b82f6") */
  pointColor?: string;
  /** Whether features are interactive (default: true) */
  interactive?: boolean;
  /** Callback when a feature is clicked */
  onClick?: (feature: GeoJSON.Feature, coordinates: [number, number]) => void;
  /** Callback on mouse enter */
  onMouseEnter?: (feature: GeoJSON.Feature) => void;
  /** Callback on mouse leave */
  onMouseLeave?: () => void;
};

function GeoJSONLayer({
  data,
  fillColor = "#3b82f6",
  fillOpacity = 0.3,
  strokeColor = "#2563eb",
  strokeWidth = 2,
  strokeOpacity = 0.8,
  pointRadius = 5,
  pointColor = "#3b82f6",
  interactive = true,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: GeoJSONLayerProps) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const safeId = id.replace(/:/g, "");
  const sourceId = `geojson-source-${safeId}`;
  const fillLayerId = `geojson-fill-${safeId}`;
  const lineLayerId = `geojson-line-${safeId}`;
  const pointLayerId = `geojson-point-${safeId}`;
  const propsRef = useRef({ fillColor, fillOpacity, strokeColor, strokeWidth, strokeOpacity, pointRadius, pointColor });

  // Add source and layers
  useEffect(() => {
    if (!isLoaded || !map) return;

    map.addSource(sourceId, {
      type: "geojson",
      data: typeof data === "string" ? data : data,
    });

    // Fill layer for polygons
    map.addLayer({
      id: fillLayerId,
      type: "fill",
      source: sourceId,
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: {
        "fill-color": fillColor,
        "fill-opacity": fillOpacity,
      },
    });

    // Line layer for lines and polygon borders
    map.addLayer({
      id: lineLayerId,
      type: "line",
      source: sourceId,
      filter: ["any",
        ["==", ["geometry-type"], "LineString"],
        ["==", ["geometry-type"], "Polygon"]
      ],
      paint: {
        "line-color": strokeColor,
        "line-width": strokeWidth,
        "line-opacity": strokeOpacity,
      },
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
    });

    // Point layer for points
    map.addLayer({
      id: pointLayerId,
      type: "circle",
      source: sourceId,
      filter: ["==", ["geometry-type"], "Point"],
      paint: {
        "circle-color": pointColor,
        "circle-radius": pointRadius,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#fff",
      },
    });

    return () => {
      try {
        if (map.getLayer(pointLayerId)) map.removeLayer(pointLayerId);
        if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
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

  // Update paint properties
  useEffect(() => {
    if (!isLoaded || !map) return;
    const prev = propsRef.current;

    if (map.getLayer(fillLayerId)) {
      if (prev.fillColor !== fillColor) map.setPaintProperty(fillLayerId, "fill-color", fillColor);
      if (prev.fillOpacity !== fillOpacity) map.setPaintProperty(fillLayerId, "fill-opacity", fillOpacity);
    }
    if (map.getLayer(lineLayerId)) {
      if (prev.strokeColor !== strokeColor) map.setPaintProperty(lineLayerId, "line-color", strokeColor);
      if (prev.strokeWidth !== strokeWidth) map.setPaintProperty(lineLayerId, "line-width", strokeWidth);
      if (prev.strokeOpacity !== strokeOpacity) map.setPaintProperty(lineLayerId, "line-opacity", strokeOpacity);
    }
    if (map.getLayer(pointLayerId)) {
      if (prev.pointColor !== pointColor) map.setPaintProperty(pointLayerId, "circle-color", pointColor);
      if (prev.pointRadius !== pointRadius) map.setPaintProperty(pointLayerId, "circle-radius", pointRadius);
    }
    propsRef.current = { fillColor, fillOpacity, strokeColor, strokeWidth, strokeOpacity, pointRadius, pointColor };
  }, [isLoaded, map, fillLayerId, lineLayerId, pointLayerId, fillColor, fillOpacity, strokeColor, strokeWidth, strokeOpacity, pointRadius, pointColor]);

  // Click/hover
  useEffect(() => {
    if (!isLoaded || !map || !interactive) return;

    const layers = [fillLayerId, lineLayerId, pointLayerId];

    const handleClick = (e: MapLibreGL.MapMouseEvent & { features?: MapLibreGL.MapGeoJSONFeature[] }) => {
      if (!onClick || !e.features?.length) return;
      const feature = e.features[0];
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      onClick(feature as unknown as GeoJSON.Feature, coords);
    };

    const handleEnter = (e: MapLibreGL.MapMouseEvent & { features?: MapLibreGL.MapGeoJSONFeature[] }) => {
      map.getCanvas().style.cursor = "pointer";
      if (onMouseEnter && e.features?.length) {
        onMouseEnter(e.features[0] as unknown as GeoJSON.Feature);
      }
    };

    const handleLeave = () => {
      map.getCanvas().style.cursor = "";
      onMouseLeave?.();
    };

    for (const layerId of layers) {
      map.on("click", layerId, handleClick);
      map.on("mouseenter", layerId, handleEnter);
      map.on("mouseleave", layerId, handleLeave);
    }

    return () => {
      for (const layerId of layers) {
        map.off("click", layerId, handleClick);
        map.off("mouseenter", layerId, handleEnter);
        map.off("mouseleave", layerId, handleLeave);
      }
    };
  }, [isLoaded, map, fillLayerId, lineLayerId, pointLayerId, interactive, onClick, onMouseEnter, onMouseLeave]);

  return null;
}

export { GeoJSONLayer };
export type { GeoJSONLayerProps };
