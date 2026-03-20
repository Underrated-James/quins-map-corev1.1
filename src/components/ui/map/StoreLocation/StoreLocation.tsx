"use client";

import { forwardRef } from "react";
import { Map } from "../Map";
import { StoreMapControls } from "./StoreMapControls";
import { StoreMarkers } from "./StoreMarkers";
import { StoreDraggableMarker } from "./StoreDraggableMarker";
import { StoreRoute } from "./StoreRoute";
import { StoreDynamicRoute } from "./StoreDynamicRoute";
import { StoreClusterLayer } from "./StoreClusterLayer";
import { StoreAdvancedController } from "./StoreAdvancedController";
import { StoreCustomLayers } from "./StoreCustomLayers";
import { StoreLayerMarkers } from "./StoreLayerMarkers";
import { useMapAttribution } from "./hooks/useMapAttribution";
import type { StoreLocationProps } from "./types";

export const StoreLocation = forwardRef<any, StoreLocationProps>(function StoreLocation({
  controls,
  markers = [],
  draggableMarker,
  route,
  dynamicRoute,
  cluster,
  advancedView,
  customLayers = [],
  layerMarkers,
  children,
  attributionPosition = "bottom-right",
  ...mapProps
}: StoreLocationProps, ref) {
  // Enforce attribution correctly
  return (
    <Map ref={ref} {...mapProps} attributionControl={false}>
        {/* Attribution Enforcer */}
        <AttributionEnforcer position={attributionPosition} />

        {/* Core Config Features */}
        {controls && <StoreMapControls config={controls === true ? { enabled: true } : controls} />}
        {advancedView && <StoreAdvancedController />}
        {customLayers.length > 0 && <StoreCustomLayers layers={customLayers} />}
        {route && <StoreRoute config={route} />}
        {dynamicRoute?.enabled && <StoreDynamicRoute config={dynamicRoute} />}
        {cluster?.enabled && <StoreClusterLayer config={cluster} />}
        {layerMarkers?.enabled && <StoreLayerMarkers config={layerMarkers} />}
        {markers.length > 0 && <StoreMarkers markers={markers} />}
        {draggableMarker?.enabled && <StoreDraggableMarker config={draggableMarker} />}
        
        {/* Optional User Children */}
        {children}
      </Map>
  );
});

/** Handles moving attribution to the selected corner safely */
function AttributionEnforcer({ position }: { position?: string }) {
  useMapAttribution({ position });
  return null;
}
