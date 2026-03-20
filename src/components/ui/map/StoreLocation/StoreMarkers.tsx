"use client";

import { memo } from "react";
import { MapMarker, MarkerContent, MarkerLabel } from "../MapMarker";
import { MarkerTooltip, MarkerPopup } from "../MapPopup";
import { StoreMarkerPopupCard } from "./StoreMarkerPopupCard";
import type { StoreMarkerConfig } from "./types";

export const StoreMarkers = memo(function StoreMarkers({
  markers,
}: {
  markers: StoreMarkerConfig[];
}) {
  return (
    <>
      {markers.map((marker) => (
        <MapMarker key={marker.id} longitude={marker.lng} latitude={marker.lat}>
          <MarkerContent>
            {marker.renderIcon ? (
              marker.renderIcon()
            ) : (
              // Default marker dot
              <div className="size-4 rounded-full bg-primary border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform" />
            )}
            {marker.label && <MarkerLabel position="bottom">{marker.label}</MarkerLabel>}
          </MarkerContent>
          
          {marker.tooltip && <MarkerTooltip>{marker.tooltip}</MarkerTooltip>}
          
          {marker.popup && <MarkerPopup>{marker.popup}</MarkerPopup>}
          
          {marker.richPopup && (
            <MarkerPopup className="p-0 w-64 border-none shadow-xl">
              <StoreMarkerPopupCard {...marker.richPopup} />
            </MarkerPopup>
          )}
        </MapMarker>
      ))}
    </>
  );
});
