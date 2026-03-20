"use client";

import type MapLibreGL from "maplibre-gl";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useMap } from "./context";

// ─── GeofenceEditor ────────────────────────────────────────────────

type GeofenceZone = {
  id: string;
  coordinates: [number, number][];
  properties?: Record<string, unknown>;
};

type GeofenceEditorProps = {
  /** Current zones */
  zones?: GeofenceZone[];
  /** Callback when zones change */
  onChange?: (zones: GeofenceZone[]) => void;
  /** Fill color for zones (default: "#3b82f6") */
  fillColor?: string;
  /** Fill opacity (default: 0.15) */
  fillOpacity?: number;
  /** Stroke color (default: "#2563eb") */
  strokeColor?: string;
  /** Stroke width (default: 2) */
  strokeWidth?: number;
  /** Whether editing is enabled (default: true) */
  editable?: boolean;
  /** Maximum number of zones allowed */
  maxZones?: number;
};

function GeofenceEditor({
  zones = [],
  onChange,
  fillColor = "#3b82f6",
  fillOpacity = 0.15,
  strokeColor = "#2563eb",
  strokeWidth = 2,
  editable = true,
  maxZones,
}: GeofenceEditorProps) {
  const { map, isLoaded } = useMap();
  const id = useId();
  const sourceId = `geofence-source-${id}`;
  const fillLayerId = `geofence-fill-${id}`;
  const lineLayerId = `geofence-line-${id}`;
  const vertexSourceId = `geofence-vertex-source-${id}`;
  const vertexLayerId = `geofence-vertex-${id}`;

  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const zonesRef = useRef(zones);
  zonesRef.current = zones;

  // Setup layers
  useEffect(() => {
    if (!isLoaded || !map) return;

    // Zone polygons
    map.addSource(sourceId, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: fillLayerId, type: "fill", source: sourceId,
      paint: { "fill-color": fillColor, "fill-opacity": fillOpacity },
    });
    map.addLayer({
      id: lineLayerId, type: "line", source: sourceId,
      paint: { "line-color": strokeColor, "line-width": strokeWidth },
      layout: { "line-join": "round" },
    });

    // Vertex dots
    map.addSource(vertexSourceId, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });
    map.addLayer({
      id: vertexLayerId, type: "circle", source: vertexSourceId,
      paint: {
        "circle-color": "#fff", "circle-radius": 5,
        "circle-stroke-color": strokeColor, "circle-stroke-width": 2,
      },
    });

    return () => {
      try {
        [vertexLayerId, lineLayerId, fillLayerId].forEach((l) => {
          if (map.getLayer(l)) map.removeLayer(l);
        });
        if (map.getSource(vertexSourceId)) map.removeSource(vertexSourceId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      } catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, map]);

  // Update zone polygons display
  useEffect(() => {
    if (!isLoaded || !map) return;
    const source = map.getSource(sourceId) as MapLibreGL.GeoJSONSource;
    if (!source) return;

    const allZones = [...zones];
    if (drawingPoints.length >= 3) {
      allZones.push({
        id: "__drawing__",
        coordinates: [...drawingPoints, drawingPoints[0]],
      });
    }

    const features: GeoJSON.Feature<GeoJSON.Polygon>[] = allZones.map((zone) => {
      const coords = [...zone.coordinates];
      if (coords.length > 0 && (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1])) {
        coords.push(coords[0]);
      }
      return {
        type: "Feature",
        properties: { zoneId: zone.id, ...zone.properties },
        geometry: { type: "Polygon", coordinates: [coords] },
      };
    });

    source.setData({ type: "FeatureCollection", features });

    // Update vertices
    const vertexSource = map.getSource(vertexSourceId) as MapLibreGL.GeoJSONSource;
    if (vertexSource) {
      const vertexFeatures: GeoJSON.Feature<GeoJSON.Point>[] = [];
      allZones.forEach((zone) => {
        zone.coordinates.forEach((coord, i) => {
          vertexFeatures.push({
            type: "Feature",
            properties: { zoneId: zone.id, vertexIndex: i },
            geometry: { type: "Point", coordinates: coord },
          });
        });
      });
      vertexSource.setData({ type: "FeatureCollection", features: vertexFeatures });
    }
  }, [isLoaded, map, zones, drawingPoints, sourceId, vertexSourceId]);

  // Drawing click handler
  useEffect(() => {
    if (!isLoaded || !map || !editable) return;

    const handleClick = (e: MapLibreGL.MapMouseEvent) => {
      if (!isDrawing) return;
      const coord: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setDrawingPoints((prev) => [...prev, coord]);
    };

    const handleDblClick = (e: MapLibreGL.MapMouseEvent) => {
      if (!isDrawing) return;
      e.preventDefault();
      map.doubleClickZoom.enable();

      const points = [...drawingPoints, [e.lngLat.lng, e.lngLat.lat] as [number, number]];
      if (points.length >= 3) {
        const newZone: GeofenceZone = {
          id: `zone-${Date.now()}`,
          coordinates: points,
        };
        onChange?.([...zonesRef.current, newZone]);
      }

      setDrawingPoints([]);
      setIsDrawing(false);
    };

    map.on("click", handleClick);
    map.on("dblclick", handleDblClick);

    return () => {
      map.off("click", handleClick);
      map.off("dblclick", handleDblClick);
    };
  }, [isLoaded, map, editable, isDrawing, drawingPoints, onChange]);

  const startDrawing = useCallback(() => {
    if (!map || !editable) return;
    if (maxZones && zones.length >= maxZones) return;
    setIsDrawing(true);
    setDrawingPoints([]);
    map.doubleClickZoom.disable();
    map.getCanvas().style.cursor = "crosshair";
  }, [map, editable, maxZones, zones.length]);

  const cancelDrawing = useCallback(() => {
    if (!map) return;
    setIsDrawing(false);
    setDrawingPoints([]);
    map.doubleClickZoom.enable();
    map.getCanvas().style.cursor = "";
  }, [map]);

// Unused delete block removed
  const clearAll = useCallback(() => {
    onChange?.([]);
  }, [onChange]);

  // Control panel
  if (!editable) return null;

  return (
    <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5">
      {!isDrawing ? (
        <button
          onClick={startDrawing}
          type="button"
          disabled={!!maxZones && zones.length >= maxZones}
          className={cn(
            "px-3 py-2 rounded-lg text-xs font-medium",
            "bg-primary text-primary-foreground shadow-md",
            "hover:bg-primary/90 active:scale-95",
            "disabled:opacity-50 disabled:pointer-events-none",
            "transition-all duration-150"
          )}
        >
          + Draw Zone
        </button>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="px-3 py-1.5 rounded-lg bg-background/95 backdrop-blur-sm border border-border/60 shadow-md">
            <p className="text-[10px] text-muted-foreground">
              Click to place points. Double-click to finish.
            </p>
            <p className="text-[10px] font-medium text-primary">
              {drawingPoints.length} point{drawingPoints.length !== 1 ? "s" : ""} placed
            </p>
          </div>
          <button
            onClick={cancelDrawing}
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
      {zones.length > 0 && !isDrawing && (
        <button
          onClick={clearAll}
          type="button"
          className="px-3 py-1.5 rounded-lg text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
        >
          Clear All ({zones.length})
        </button>
      )}
    </div>
  );
}

export { GeofenceEditor };
export type { GeofenceEditorProps, GeofenceZone };
