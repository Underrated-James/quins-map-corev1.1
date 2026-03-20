"use client";

import { useState } from "react";
import { MapRoute } from "../MapRoute";
import { MapMarker, MarkerContent, MarkerLabel } from "../MapMarker";
import { useOsrmRoutes, type OsrmRoute } from "./hooks/useOsrmRoutes";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, Route as RouteIcon } from "lucide-react";
import type { StoreDynamicRouteConfig } from "./types";

import { formatDuration, formatDistance } from "./utils/map-formatters";

export function StoreDynamicRoute({ config }: { config: StoreDynamicRouteConfig }) {
  const { routes, isFetching } = useOsrmRoutes({
    waypoints: config.waypoints,
    baseUrl: config.osrmUrl,
    options: { alternatives: config.showAlternatives ?? true },
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!routes || routes.length === 0) {
    if (isFetching) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return null;
  }

  // Sort so selected is rendered last (on top)
  const sortedRoutes = routes
    .map((route: OsrmRoute, index: number) => ({ route, index }))
    .sort((a: { route: OsrmRoute, index: number }, b: { route: OsrmRoute, index: number }) => {
      if (a.index === selectedIndex) return 1;
      if (b.index === selectedIndex) return -1;
      return 0;
    });

  return (
    <>
      {/* Route Lines */}
      {sortedRoutes.map(({ route, index }: { route: OsrmRoute, index: number }) => {
        const isSelected = index === selectedIndex;
        return (
          <MapRoute
            key={`route-${index}`}
            id={`route-layer-${index}`}
            coordinates={route.geometry.coordinates}
            color={isSelected ? (config.color ?? "#6366f1") : "#94a3b8"}
            width={isSelected ? (config.width ?? 6) : 5}
            opacity={isSelected ? 1 : 0.6}
            interactive={true}
            onClick={() => setSelectedIndex(index)}
          />
        );
      })}

      {/* Start Marker */}
      {config.waypoints.length > 0 && (
        <MapMarker longitude={config.waypoints[0][0]} latitude={config.waypoints[0][1]}>
          <MarkerContent>
            <div role="button" tabIndex={0} aria-label={`Start Map Point: ${config.startLabel ?? "Start"}`} className="size-5 rounded-full bg-green-500 border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform" />
            <MarkerLabel position="top">{config.startLabel ?? "Start"}</MarkerLabel>
          </MarkerContent>
        </MapMarker>
      )}

      {/* End Marker */}
      {config.waypoints.length > 1 && (
        <MapMarker longitude={config.waypoints[config.waypoints.length - 1][0]} latitude={config.waypoints[config.waypoints.length - 1][1]}>
          <MarkerContent>
            <div role="button" tabIndex={0} aria-label={`End Map Point: ${config.endLabel ?? "End"}`} className="size-5 rounded-full bg-red-500 border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform" />
            <MarkerLabel position="bottom">{config.endLabel ?? "End"}</MarkerLabel>
          </MarkerContent>
        </MapMarker>
      )}

      {/* UI Overlay for route selection */}
      {config.showAlternatives && routes.length > 0 && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {routes.map((route: OsrmRoute, index: number) => {
            const isActive = index === selectedIndex;
            const isFastest = index === 0;
            return (
              <Button
                key={`btn-${index}`}
                variant={isActive ? "default" : "secondary"}
                size="sm"
                aria-pressed={isActive}
                aria-label={`Select ${isFastest ? "Fastest " : ""}Route ${index + 1}: ${formatDuration(route.duration)}, ${formatDistance(route.distance)}`}
                onClick={() => setSelectedIndex(index)}
                className="justify-start gap-3 shadow-md"
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  <span className="font-medium">
                    {formatDuration(route.duration)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs opacity-80">
                  <RouteIcon className="size-3" />
                  {formatDistance(route.distance)}
                </div>
                {isFastest && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    Fastest
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      )}
    </>
  );
}
