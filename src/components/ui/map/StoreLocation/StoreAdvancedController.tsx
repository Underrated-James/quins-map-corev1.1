"use client";

import { useEffect, useState } from "react";
import { useMap } from "../context";
import { Button } from "@/components/ui/button";
import { Mountain, RotateCcw } from "lucide-react";

export function StoreAdvancedController() {
  const { map, isLoaded } = useMap();
  const [pitch, setPitch] = useState(0);
  const [bearing, setBearing] = useState(0);

  useEffect(() => {
    if (!map || !isLoaded) return;

    const handleMove = () => {
      setPitch(Math.round(map.getPitch()));
      setBearing(Math.round(map.getBearing()));
    };

    map.on("move", handleMove);
    return () => {
      map.off("move", handleMove);
    };
  }, [map, isLoaded]);

  if (!map) return null;

  const handle3DView = () => {
    map.easeTo({ pitch: 60, bearing: -20, duration: 1000 });
  };

  const handleResetView = () => {
    map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
  };

  return (
    <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="shadow-md bg-background/80 backdrop-blur hover:bg-background"
          onClick={handle3DView}
        >
          <Mountain className="size-4 mr-1.5" />
          3D View
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="shadow-md bg-background/80 backdrop-blur hover:bg-background"
          onClick={handleResetView}
        >
          <RotateCcw className="size-4 mr-1.5" />
          Reset
        </Button>
      </div>
      <div className="rounded-md bg-background/90 backdrop-blur px-3 py-2 text-xs font-mono border shadow-sm w-fit">
        <div>Pitch: {pitch}°</div>
        <div>Bearing: {bearing}°</div>
      </div>
    </div>
  );
}
