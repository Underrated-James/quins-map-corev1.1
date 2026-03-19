"use client";

import type MapLibreGL from "maplibre-gl";
import { useEffect, useId, useState } from "react";

import { useMap } from "./context";

// ─── RoutePreview ──────────────────────────────────────────────────

type RouteProfile = "driving" | "walking" | "cycling";

type RouteInfo = {
  distance: number; // meters
  duration: number; // seconds
  coordinates: [number, number][];
};

type RoutePreviewProps = {
  /** Start coordinates [longitude, latitude] */
  from: [number, number];
  /** End coordinates [longitude, latitude] */
  to: [number, number];
  /** Route profile (default: "driving") */
  profile?: RouteProfile;
  /** OSRM server URL (default: public demo server) */
  osrmUrl?: string;
  /** Line color (default: "#4285F4") */
  color?: string;
  /** Line width (default: 4) */
  width?: number;
  /** Whether to auto-fit bounds to route (default: true) */
  fitBounds?: boolean;
  /** Bounds padding in pixels (default: 60) */
  fitPadding?: number;
  /** Callback with route info when loaded */
  onRouteLoaded?: (info: RouteInfo) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Show route info overlay (default: false) */
  showInfo?: boolean;
};

function RoutePreview({
  from,
  to,
  profile = "driving",
  osrmUrl = "https://router.project-osrm.org",
  color = "#4285F4",
  width = 4,
  fitBounds = true,
  fitPadding = 60,
  onRouteLoaded,
  onError,
  showInfo = false,
}: RoutePreviewProps) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `route-preview-source-${id}`;
  const layerId = `route-preview-layer-${id}`;
  const bgLayerId = `route-preview-bg-${id}`;
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // Add source + layers
  useEffect(() => {
    if (!isLoaded || !map) return;

    map.addSource(sourceId, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    // Background (wider, for outline effect)
    map.addLayer({
      id: bgLayerId,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": "#fff",
        "line-width": width + 3,
        "line-opacity": 0.6,
      },
    });

    map.addLayer({
      id: layerId,
      type: "line",
      source: sourceId,
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": color,
        "line-width": width,
        "line-opacity": 0.9,
      },
    });

    return () => {
      try {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getLayer(bgLayerId)) map.removeLayer(bgLayerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map]);

  // Fetch route
  useEffect(() => {
    if (!isLoaded || !map) return;

    const controller = new AbortController();

    const fetchRoute = async () => {
      try {
        const url = `${osrmUrl}/route/v1/${profile}/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: controller.signal });
        const data = await res.json();

        if (data.code !== "Ok" || !data.routes?.length) {
          throw new Error("No route found");
        }

        const route = data.routes[0];
        const coordinates: [number, number][] = route.geometry.coordinates;
        const info: RouteInfo = {
          distance: route.distance,
          duration: route.duration,
          coordinates,
        };

        setRouteInfo(info);

        // Draw the route
        const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
        if (source) {
          source.setData({
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates },
          });
        }

        // Fit bounds
        if (fitBounds && coordinates.length > 0) {
          let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
          for (const [lng, lat] of coordinates) {
            if (lng < minLng) minLng = lng;
            if (lat < minLat) minLat = lat;
            if (lng > maxLng) maxLng = lng;
            if (lat > maxLat) maxLat = lat;
          }
          map.fitBounds(
            [[minLng, minLat], [maxLng, maxLat]],
            { padding: fitPadding, duration: 1000 }
          );
        }

        onRouteLoaded?.(info);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          onError?.(e as Error);
        }
      }
    };

    fetchRoute();
    return () => controller.abort();
  }, [isLoaded, map, from, to, profile, osrmUrl, sourceId, fitBounds, fitPadding, onRouteLoaded, onError]);

  // Update paint
  useEffect(() => {
    if (!isLoaded || !map) return;
    if (map.getLayer(layerId)) {
      map.setPaintProperty(layerId, "line-color", color);
      map.setPaintProperty(layerId, "line-width", width);
    }
    if (map.getLayer(bgLayerId)) {
      map.setPaintProperty(bgLayerId, "line-width", width + 3);
    }
  }, [isLoaded, map, layerId, bgLayerId, color, width]);

  // Route info overlay
  if (!showInfo || !routeInfo) return null;

  const distanceKm = (routeInfo.distance / 1000).toFixed(1);
  const durationMin = Math.ceil(routeInfo.duration / 60);

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-lg bg-background/95 backdrop-blur-sm border border-border/60 shadow-lg">
      <div className="text-center">
        <p className="text-sm font-semibold">{distanceKm} km</p>
        <p className="text-[10px] text-muted-foreground uppercase">Distance</p>
      </div>
      <div className="w-px h-6 bg-border/60" />
      <div className="text-center">
        <p className="text-sm font-semibold">{durationMin} min</p>
        <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
      </div>
    </div>
  );
}

export { RoutePreview };
export type { RoutePreviewProps, RouteInfo, RouteProfile };
