"use client";

import { memo } from "react";
import { GeoJSONLayer } from "../GeoJSONLayer";
import type { StoreCustomLayerConfig } from "./types";

export const StoreCustomLayers = memo(function StoreCustomLayers({
  layers,
}: {
  layers: StoreCustomLayerConfig[];
}) {
  return (
    <>
      {layers.map((layer) => (
        <GeoJSONLayer
          key={layer.id}
          data={layer.data}
          fillColor={layer.fillColor}
          fillOpacity={layer.fillOpacity}
          strokeColor={layer.strokeColor}
          strokeWidth={layer.strokeWidth}
          onClick={layer.onClick}
          onMouseEnter={layer.onMouseEnter}
          onMouseLeave={layer.onMouseLeave}
        />
      ))}
    </>
  );
});
