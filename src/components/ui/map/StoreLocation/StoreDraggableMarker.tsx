"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { MapMarker, MarkerContent } from "../MapMarker";
import { MarkerPopup } from "../MapPopup";
import type { StoreDraggableMarkerConfig } from "./types";

export function StoreDraggableMarker({
  config,
}: {
  config: StoreDraggableMarkerConfig;
}) {
  const [pos, setPos] = useState({ lng: config.lng, lat: config.lat });

  // Sync back to external state if parent updates unexpectedly
  useEffect(() => {
    setPos({ lng: config.lng, lat: config.lat });
  }, [config.lng, config.lat]);

  return (
    <MapMarker
      draggable
      longitude={pos.lng}
      latitude={pos.lat}
      onDragEnd={(lngLat) => {
        setPos({ lng: lngLat.lng, lat: lngLat.lat });
        config.onLocationChange?.({ lat: lngLat.lat, lng: lngLat.lng });
      }}
    >
      <MarkerContent>
        <div className="cursor-move -mt-3.5">
          <MapPin
            className="fill-primary text-primary-foreground drop-shadow-md"
            size={34}
          />
        </div>
      </MarkerContent>
      <MarkerPopup>
        <div className="space-y-1 min-w-[120px]">
          <p className="font-medium text-foreground">Coordinates</p>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Lat:</span>
            <span>{pos.lat.toFixed(4)}</span>
            <span className="font-semibold text-foreground">Lng:</span>
            <span>{pos.lng.toFixed(4)}</span>
          </div>
        </div>
      </MarkerPopup>
    </MapMarker>
  );
}
