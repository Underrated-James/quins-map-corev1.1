"use client";

import type MapLibreGL from "maplibre-gl";
import { useEffect, useId, useRef } from "react";

import { useMap } from "./context";

// ─── LiveTracker ───────────────────────────────────────────────────

type TrackerPosition = {
  /** Unique ID for this tracked entity */
  id: string;
  /** Longitude */
  longitude: number;
  /** Latitude */
  latitude: number;
  /** Heading / bearing in degrees (optional) */
  heading?: number;
  /** Custom properties for rendering */
  properties?: Record<string, unknown>;
};

type LiveTrackerProps = {
  /** Array of current positions to track */
  positions: TrackerPosition[];
  /** Whether to show movement trail (default: false) */
  showTrail?: boolean;
  /** Trail color (default: "#3b82f6") */
  trailColor?: string;
  /** Trail opacity (default: 0.4) */
  trailOpacity?: number;
  /** Trail max points per tracker (default: 50) */
  trailMaxPoints?: number;
  /** Marker color (default: "#3b82f6") */
  markerColor?: string;
  /** Marker size in pixels (default: 10) */
  markerSize?: number;
  /** Whether to show heading indicator (default: true) */
  showHeading?: boolean;
  /** Smooth animation duration in ms (default: 1000) */
  animationDuration?: number;
  /** Callback when a tracker is clicked */
  onClick?: (tracker: TrackerPosition) => void;
};

function LiveTracker({
  positions,
  showTrail = false,
  trailColor = "#3b82f6",
  trailOpacity = 0.4,
  trailMaxPoints = 50,
  markerColor = "#3b82f6",
  markerSize = 10,
  showHeading = true,
  animationDuration = 1000,
  onClick,
}: LiveTrackerProps) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `tracker-source-${id}`;
  const layerId = `tracker-layer-${id}`;
  const headingLayerId = `tracker-heading-${id}`;
  const trailSourceId = `tracker-trail-${id}`;
  const trailLayerId = `tracker-trail-layer-${id}`;
  const trailHistory = useRef<Map<string, [number, number][]>>(new Map());
  const animFrameRef = useRef<number>(0);
  const prevPositions = useRef<Map<string, { lng: number; lat: number }>>(new Map());

  // Setup source + layers
  useEffect(() => {
    if (!isLoaded || !map) return;

    // Tracker points source
    map.addSource(sourceId, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    // Tracker circles
    map.addLayer({
      id: layerId,
      type: "circle",
      source: sourceId,
      paint: {
        "circle-color": markerColor,
        "circle-radius": markerSize,
        "circle-stroke-width": 3,
        "circle-stroke-color": "#fff",
        "circle-opacity": 0.95,
      },
    });

    // Heading indicator (rendered as rotated triangle via CSS on tracker circle)
    if (showHeading) {
      map.addLayer({
        id: headingLayerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-color": markerColor,
          "circle-radius": markerSize * 0.4,
          "circle-translate": [0, -(markerSize * 0.8)],
          "circle-opacity": 0.7,
        },
      });
    }

    // Trail
    if (showTrail) {
      map.addSource(trailSourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: trailLayerId,
        type: "line",
        source: trailSourceId,
        paint: {
          "line-color": trailColor,
          "line-width": 2,
          "line-opacity": trailOpacity,
        },
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
      });
    }

    // Click handler
    const handleClick = (e: MapLibreGL.MapMouseEvent & { features?: MapLibreGL.MapGeoJSONFeature[] }) => {
      if (!onClick || !e.features?.length) return;
      const feature = e.features[0];
      const pos = positions.find((p) => p.id === feature.properties?.trackerId);
      if (pos) onClick(pos);
    };

    map.on("click", layerId, handleClick);
    map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; });

    return () => {
      cancelAnimationFrame(animFrameRef.current!);
      try {
        map.off("click", layerId, handleClick);
        if (showHeading && map.getLayer(headingLayerId)) map.removeLayer(headingLayerId);
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
        if (showTrail) {
          if (map.getLayer(trailLayerId)) map.removeLayer(trailLayerId);
          if (map.getSource(trailSourceId)) map.removeSource(trailSourceId);
        }
      } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map]);

  // Animate position updates
  useEffect(() => {
    if (!isLoaded || !map) return;

    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
    if (!source) return;

    // Smooth animate to new positions
    const startTime = performance.now();
    const startPositions = new Map(prevPositions.current);

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      const features: GeoJSON.Feature<GeoJSON.Point>[] = positions.map((pos) => {
        const prev = startPositions.get(pos.id);
        let lng = pos.longitude;
        let lat = pos.latitude;

        if (prev && progress < 1) {
          lng = prev.lng + (pos.longitude - prev.lng) * eased;
          lat = prev.lat + (pos.latitude - prev.lat) * eased;
        }

        return {
          type: "Feature",
          properties: { trackerId: pos.id, heading: pos.heading ?? 0, ...pos.properties },
          geometry: { type: "Point", coordinates: [lng, lat] },
        };
      });

      source.setData({ type: "FeatureCollection", features });

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Save final positions
        positions.forEach((p) => {
          prevPositions.current.set(p.id, { lng: p.longitude, lat: p.latitude });
        });
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Update trails
    if (showTrail) {
      const trailSource = map.getSource(trailSourceId) as MapLibreGL.GeoJSONSource;
      if (trailSource) {
        positions.forEach((pos) => {
          const trail = trailHistory.current.get(pos.id) ?? [];
          trail.push([pos.longitude, pos.latitude]);
          if (trail.length > trailMaxPoints) trail.shift();
          trailHistory.current.set(pos.id, trail);
        });

        const trailFeatures: GeoJSON.Feature<GeoJSON.LineString>[] = [];
        trailHistory.current.forEach((coords, trackerId) => {
          if (coords.length >= 2) {
            trailFeatures.push({
              type: "Feature",
              properties: { trackerId },
              geometry: { type: "LineString", coordinates: coords },
            });
          }
        });

        trailSource.setData({ type: "FeatureCollection", features: trailFeatures });
      }
    }

    return () => cancelAnimationFrame(animFrameRef.current!);
  }, [isLoaded, map, positions, sourceId, trailSourceId, showTrail, trailMaxPoints, animationDuration]);

  return null;
}

export { LiveTracker };
export type { LiveTrackerProps, TrackerPosition };
