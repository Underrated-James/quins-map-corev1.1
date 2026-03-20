"use client";

import { MapRoute } from "../MapRoute";
import type { StoreRouteConfig } from "./types";

export function StoreRoute({ config }: { config: StoreRouteConfig }) {
  if (!config.coordinates || config.coordinates.length < 2) return null;

  return (
    <MapRoute
      id={config.id ?? "store-static-route"}
      coordinates={config.coordinates}
      color={config.color ?? "#3b82f6"}
      width={config.width ?? 4}
      opacity={config.opacity ?? 0.8}
      interactive={false}
    />
  );
}
