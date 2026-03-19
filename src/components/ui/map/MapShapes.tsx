"use client";

import type MapLibreGL from "maplibre-gl";
import { useEffect, useId } from "react";

import { useMap } from "./context";

// ─── Circle ────────────────────────────────────────────────────────

type CircleProps = {
  /** Center longitude */
  longitude: number;
  /** Center latitude */
  latitude: number;
  /** Radius in meters */
  radius: number;
  /** Fill color (default: "#3b82f6") */
  fillColor?: string;
  /** Fill opacity (default: 0.2) */
  fillOpacity?: number;
  /** Stroke color (default: "#2563eb") */
  strokeColor?: string;
  /** Stroke width (default: 2) */
  strokeWidth?: number;
  /** Number of polygon points to approximate circle (default: 64) */
  steps?: number;
  /** Click handler */
  onClick?: () => void;
};

/** Create a GeoJSON polygon approximating a circle */
function createCirclePolygon(
  lng: number,
  lat: number,
  radiusMeters: number,
  steps = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const coords: [number, number][] = [];
  const earthRadius = 6371000;

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dx = radiusMeters * Math.cos(angle);
    const dy = radiusMeters * Math.sin(angle);
    const dLng = (dx / (earthRadius * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
    const dLat = (dy / earthRadius) * (180 / Math.PI);
    coords.push([lng + dLng, lat + dLat]);
  }

  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [coords] },
  };
}

function Circle({
  longitude,
  latitude,
  radius,
  fillColor = "#3b82f6",
  fillOpacity = 0.2,
  strokeColor = "#2563eb",
  strokeWidth = 2,
  steps = 64,
  onClick,
}: CircleProps) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `circle-source-${id}`;
  const fillLayerId = `circle-fill-${id}`;
  const lineLayerId = `circle-line-${id}`;

  useEffect(() => {
    if (!isLoaded || !map) return;

    const data = createCirclePolygon(longitude, latitude, radius, steps);

    map.addSource(sourceId, { type: "geojson", data });
    map.addLayer({
      id: fillLayerId,
      type: "fill",
      source: sourceId,
      paint: { "fill-color": fillColor, "fill-opacity": fillOpacity },
    });
    map.addLayer({
      id: lineLayerId,
      type: "line",
      source: sourceId,
      paint: { "line-color": strokeColor, "line-width": strokeWidth },
    });

    return () => {
      try {
        if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map]);

  // Update circle geometry on position/radius change
  useEffect(() => {
    if (!isLoaded || !map) return;
    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
    if (source) source.setData(createCirclePolygon(longitude, latitude, radius, steps));
  }, [isLoaded, map, sourceId, longitude, latitude, radius, steps]);

  // Update paint
  useEffect(() => {
    if (!isLoaded || !map) return;
    if (map.getLayer(fillLayerId)) {
      map.setPaintProperty(fillLayerId, "fill-color", fillColor);
      map.setPaintProperty(fillLayerId, "fill-opacity", fillOpacity);
    }
    if (map.getLayer(lineLayerId)) {
      map.setPaintProperty(lineLayerId, "line-color", strokeColor);
      map.setPaintProperty(lineLayerId, "line-width", strokeWidth);
    }
  }, [isLoaded, map, fillLayerId, lineLayerId, fillColor, fillOpacity, strokeColor, strokeWidth]);

  // Click
  useEffect(() => {
    if (!isLoaded || !map || !onClick) return;
    const handleClick = () => onClick();
    map.on("click", fillLayerId, handleClick);
    map.on("mouseenter", fillLayerId, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", fillLayerId, () => { map.getCanvas().style.cursor = ""; });
    return () => { map.off("click", fillLayerId, handleClick); };
  }, [isLoaded, map, fillLayerId, onClick]);

  return null;
}

// ─── Polygon ───────────────────────────────────────────────────────

type PolygonProps = {
  /** Polygon coordinates — [[lng, lat], ...] for outer ring */
  coordinates: [number, number][];
  /** Fill color (default: "#3b82f6") */
  fillColor?: string;
  /** Fill opacity (default: 0.25) */
  fillOpacity?: number;
  /** Stroke color (default: "#2563eb") */
  strokeColor?: string;
  /** Stroke width (default: 2) */
  strokeWidth?: number;
  /** Click handler */
  onClick?: () => void;
};

function Polygon({
  coordinates,
  fillColor = "#3b82f6",
  fillOpacity = 0.25,
  strokeColor = "#2563eb",
  strokeWidth = 2,
  onClick,
}: PolygonProps) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `polygon-source-${id}`;
  const fillLayerId = `polygon-fill-${id}`;
  const lineLayerId = `polygon-line-${id}`;

  useEffect(() => {
    if (!isLoaded || !map || coordinates.length < 3) return;

    const closed = [...coordinates];
    if (closed[0][0] !== closed[closed.length - 1][0] || closed[0][1] !== closed[closed.length - 1][1]) {
      closed.push(closed[0]);
    }

    const data: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: [closed] },
    };

    map.addSource(sourceId, { type: "geojson", data });
    map.addLayer({
      id: fillLayerId, type: "fill", source: sourceId,
      paint: { "fill-color": fillColor, "fill-opacity": fillOpacity },
    });
    map.addLayer({
      id: lineLayerId, type: "line", source: sourceId,
      paint: { "line-color": strokeColor, "line-width": strokeWidth },
      layout: { "line-join": "round" },
    });

    return () => {
      try {
        if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map]);

  // Update coordinates
  useEffect(() => {
    if (!isLoaded || !map || coordinates.length < 3) return;
    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
    if (!source) return;
    const closed = [...coordinates];
    if (closed[0][0] !== closed[closed.length - 1][0] || closed[0][1] !== closed[closed.length - 1][1]) {
      closed.push(closed[0]);
    }
    source.setData({
      type: "Feature", properties: {},
      geometry: { type: "Polygon", coordinates: [closed] },
    });
  }, [isLoaded, map, sourceId, coordinates]);

  // Click
  useEffect(() => {
    if (!isLoaded || !map || !onClick) return;
    map.on("click", fillLayerId, onClick);
    map.on("mouseenter", fillLayerId, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", fillLayerId, () => { map.getCanvas().style.cursor = ""; });
    return () => { map.off("click", fillLayerId, onClick); };
  }, [isLoaded, map, fillLayerId, onClick]);

  return null;
}

// ─── Polyline ──────────────────────────────────────────────────────

type PolylineProps = {
  /** Array of [lng, lat] coordinate pairs */
  coordinates: [number, number][];
  /** Line color (default: "#3b82f6") */
  color?: string;
  /** Line width (default: 3) */
  width?: number;
  /** Line opacity (default: 0.8) */
  opacity?: number;
  /** Dash pattern [dash, gap] */
  dashArray?: [number, number];
  /** Click handler */
  onClick?: () => void;
};

function Polyline({
  coordinates,
  color = "#3b82f6",
  width = 3,
  opacity = 0.8,
  dashArray,
  onClick,
}: PolylineProps) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `polyline-source-${id}`;
  const layerId = `polyline-layer-${id}`;

  useEffect(() => {
    if (!isLoaded || !map) return;

    map.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature", properties: {},
        geometry: { type: "LineString", coordinates },
      },
    });
    map.addLayer({
      id: layerId, type: "line", source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": color, "line-width": width, "line-opacity": opacity,
        ...(dashArray && { "line-dasharray": dashArray }),
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

  useEffect(() => {
    if (!isLoaded || !map || coordinates.length < 2) return;
    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
    if (source) {
      source.setData({
        type: "Feature", properties: {},
        geometry: { type: "LineString", coordinates },
      });
    }
  }, [isLoaded, map, sourceId, coordinates]);

  useEffect(() => {
    if (!isLoaded || !map || !onClick) return;
    map.on("click", layerId, onClick);
    map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; });
    return () => { map.off("click", layerId, onClick); };
  }, [isLoaded, map, layerId, onClick]);

  return null;
}

export { Circle, Polygon, Polyline };
export type { CircleProps, PolygonProps, PolylineProps };
