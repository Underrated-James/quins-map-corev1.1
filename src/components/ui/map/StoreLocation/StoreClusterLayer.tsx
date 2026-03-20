"use client";

import { MapClusterLayer } from "../MapClusterLayer";
import type { StoreClusterConfig } from "./types";

export function StoreClusterLayer({ config }: { config: StoreClusterConfig }) {
  if (!config.data?.features?.length) return null;

  return (
    <MapClusterLayer
      data={config.data}
      clusterColors={config.clusterColors ?? ["#22c55e", "#eab308", "#ef4444"]}
      pointColor={config.pointColor ?? "#3b82f6"}
      onPointClick={config.onPointClick}
    />
  );
}
