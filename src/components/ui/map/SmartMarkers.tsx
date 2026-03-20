"use client";

import MapLibreGL from "maplibre-gl";
import type * as GeoJSON from "geojson";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { useMap } from "./context";

// ─── SmartMarkers ──────────────────────────────────────────────────

type SmartMarkersProps<P extends GeoJSON.GeoJsonProperties = GeoJSON.GeoJsonProperties> = {
  /** Array of point features or FeatureCollection */
  data: GeoJSON.FeatureCollection<GeoJSON.Point, P>;
  /** Render function for DOM markers (used when count < domThreshold) */
  renderMarker?: (feature: GeoJSON.Feature<GeoJSON.Point, P>, index: number) => ReactNode;
  /** Point count threshold for switching to clustering (default: 200) */
  domThreshold?: number;
  /** Point count threshold for switching to GeoJSON circles (default: 2000) */
  clusterThreshold?: number;
  /** Cluster settings */
  clusterRadius?: number;
  clusterMaxZoom?: number;
  clusterColors?: [string, string, string];
  /** Point color for GeoJSON mode (default: "#3b82f6") */
  pointColor?: string;
  /** Point radius for GeoJSON mode (default: 5) */
  pointRadius?: number;
  /** Callback when a point/marker is clicked */
  onPointClick?: (feature: GeoJSON.Feature<GeoJSON.Point, P>, coordinates: [number, number]) => void;
};

type RenderMode = "dom" | "cluster" | "geojson";

function SmartMarkers<P extends GeoJSON.GeoJsonProperties = GeoJSON.GeoJsonProperties>({
  data,
  renderMarker,
  domThreshold = 200,
  clusterThreshold = 2000,
  clusterRadius = 50,
  clusterMaxZoom = 14,
  clusterColors = ["#22c55e", "#eab308", "#ef4444"],
  pointColor = "#3b82f6",
  pointRadius = 5,
  onPointClick,
}: SmartMarkersProps<P>) {
  useMap(); // ensure we're inside a MapCanvas
  const count = data.features.length;

  // Auto-choose rendering mode
  const mode: RenderMode = useMemo(() => {
    if (count <= domThreshold) return "dom";
    if (count <= clusterThreshold) return "cluster";
    return "geojson";
  }, [count, domThreshold, clusterThreshold]);

  return (
    <>
      {mode === "dom" && (
        <DOMMarkers
          data={data}
          renderMarker={renderMarker}
          onPointClick={onPointClick}
        />
      )}
      {mode === "cluster" && (
        <ClusterMode
          data={data}
          clusterRadius={clusterRadius}
          clusterMaxZoom={clusterMaxZoom}
          clusterColors={clusterColors}
          pointColor={pointColor}
          onPointClick={onPointClick}
        />
      )}
      {mode === "geojson" && (
        <GeoJSONMode
          data={data}
          pointColor={pointColor}
          pointRadius={pointRadius}
          onPointClick={onPointClick}
        />
      )}
    </>
  );
}

function DOMMarkers<P extends GeoJSON.GeoJsonProperties>({
  data,
  renderMarker,
  onPointClick,
}: {
  data: GeoJSON.FeatureCollection<GeoJSON.Point, P>;
  renderMarker?: (feature: GeoJSON.Feature<GeoJSON.Point, P>, index: number) => ReactNode;
  onPointClick?: (feature: GeoJSON.Feature<GeoJSON.Point, P>, coordinates: [number, number]) => void;
}) {
  const { map } = useMap();
  const markersRef = useRef<MapLibreGL.Marker[]>([]);
  const containersRef = useRef<HTMLDivElement[]>([]);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    containersRef.current = [];

    // Create DOM markers via dynamic import
    const Marker = MapLibreGL.Marker;
    if (!Marker) return;

    data.features.forEach((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      const el = document.createElement("div");
      el.style.cursor = "pointer";

      if (onPointClick) {
        el.addEventListener("click", () => {
          onPointClick(feature, [lng, lat]);
        });
      }

      const marker = new Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);

      markersRef.current.push(marker);
      containersRef.current.push(el);
    });

    setRevision((n) => n + 1);

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      containersRef.current = [];
    };
  }, [map, data, onPointClick]);

  // Render custom content via portals
  if (!renderMarker || containersRef.current.length === 0) return null;

  return (
    <>
      {containersRef.current.map((container, i) => {
        const feature = data.features[i];
        if (!feature || !container) return null;
        return createPortal(
          <div key={`${i}-${revision}`}>{renderMarker(feature, i)}</div>,
          container
        );
      })}
    </>
  );
}


// ─── Cluster Mode (MapLibre native) ────────────────────────────────

function ClusterMode<P extends GeoJSON.GeoJsonProperties>({
  data,
  clusterRadius,
  clusterMaxZoom,
  clusterColors,
  pointColor,
  onPointClick,
}: {
  data: GeoJSON.FeatureCollection<GeoJSON.Point, P>;
  clusterRadius: number;
  clusterMaxZoom: number;
  clusterColors: [string, string, string];
  pointColor: string;
  onPointClick?: (feature: GeoJSON.Feature<GeoJSON.Point, P>, coordinates: [number, number]) => void;
}) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `smart-cluster-${id}`;
  const clusterLayerId = `smart-clusters-${id}`;
  const countLayerId = `smart-cluster-count-${id}`;
  const pointLayerId = `smart-unclustered-${id}`;

  useEffect(() => {
    if (!isLoaded || !map) return;

    map.addSource(sourceId, {
      type: "geojson",
      data,
      cluster: true,
      clusterMaxZoom,
      clusterRadius,
    });

    map.addLayer({
      id: clusterLayerId, type: "circle", source: sourceId,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": ["step", ["get", "point_count"], clusterColors[0], 100, clusterColors[1], 750, clusterColors[2]],
        "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40],
        "circle-stroke-width": 2, "circle-stroke-color": "#fff", "circle-opacity": 0.85,
      },
    });

    map.addLayer({
      id: countLayerId, type: "symbol", source: sourceId,
      filter: ["has", "point_count"],
      layout: { "text-field": "{point_count_abbreviated}", "text-size": 12 },
      paint: { "text-color": "#fff" },
    });

    map.addLayer({
      id: pointLayerId, type: "circle", source: sourceId,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": pointColor, "circle-radius": 6,
        "circle-stroke-width": 2, "circle-stroke-color": "#fff",
      },
    });

    // Cluster click → zoom
    const handleClusterClick = async (e: MapLibreGL.MapMouseEvent & { features?: MapLibreGL.MapGeoJSONFeature[] }) => {
      const features = map.queryRenderedFeatures(e.point, { layers: [clusterLayerId] });
      if (!features.length) return;
      const clusterId = features[0].properties?.cluster_id as number;
      const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
      const zoom = await source.getClusterExpansionZoom(clusterId);
      const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number];
      map.easeTo({ center: coords, zoom });
    };

    // Point click
    const handlePointClick = (e: MapLibreGL.MapMouseEvent & { features?: MapLibreGL.MapGeoJSONFeature[] }) => {
      if (!onPointClick || !e.features?.length) return;
      const feature = e.features[0];
      const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
      onPointClick(feature as unknown as GeoJSON.Feature<GeoJSON.Point, P>, coords);
    };

    map.on("click", clusterLayerId, handleClusterClick);
    map.on("click", pointLayerId, handlePointClick);
    const cursorEnter = () => { map.getCanvas().style.cursor = "pointer"; };
    const cursorLeave = () => { map.getCanvas().style.cursor = ""; };
    map.on("mouseenter", clusterLayerId, cursorEnter);
    map.on("mouseleave", clusterLayerId, cursorLeave);
    map.on("mouseenter", pointLayerId, cursorEnter);
    map.on("mouseleave", pointLayerId, cursorLeave);

    return () => {
      try {
        map.off("click", clusterLayerId, handleClusterClick);
        map.off("click", pointLayerId, handlePointClick);
        [countLayerId, pointLayerId, clusterLayerId].forEach((l) => {
          if (map.getLayer(l)) map.removeLayer(l);
        });
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map]);

  useEffect(() => {
    if (!isLoaded || !map) return;
    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
    if (source) source.setData(data);
  }, [isLoaded, map, data, sourceId]);

  return null;
}

// ─── GeoJSON Circle Mode (high performance) ───────────────────────

function GeoJSONMode<P extends GeoJSON.GeoJsonProperties>({
  data,
  pointColor,
  pointRadius,
  onPointClick,
}: {
  data: GeoJSON.FeatureCollection<GeoJSON.Point, P>;
  pointColor: string;
  pointRadius: number;
  onPointClick?: (feature: GeoJSON.Feature<GeoJSON.Point, P>, coordinates: [number, number]) => void;
}) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `smart-geojson-${id}`;
  const layerId = `smart-geojson-layer-${id}`;

  useEffect(() => {
    if (!isLoaded || !map) return;

    map.addSource(sourceId, { type: "geojson", data });
    map.addLayer({
      id: layerId, type: "circle", source: sourceId,
      paint: {
        "circle-color": pointColor, "circle-radius": pointRadius,
        "circle-stroke-width": 1, "circle-stroke-color": "#fff", "circle-opacity": 0.8,
      },
    });

    const handleClick = (e: MapLibreGL.MapMouseEvent & { features?: MapLibreGL.MapGeoJSONFeature[] }) => {
      if (!onPointClick || !e.features?.length) return;
      const feature = e.features[0];
      const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
      onPointClick(feature as unknown as GeoJSON.Feature<GeoJSON.Point, P>, coords);
    };

    map.on("click", layerId, handleClick);
    map.on("mouseenter", layerId, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", layerId, () => { map.getCanvas().style.cursor = ""; });

    return () => {
      try {
        map.off("click", layerId, handleClick);
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map]);

  useEffect(() => {
    if (!isLoaded || !map) return;
    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
    if (source) source.setData(data);
  }, [isLoaded, map, data, sourceId]);

  return null;
}

export { SmartMarkers };
export type { SmartMarkersProps, RenderMode };
