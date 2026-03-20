"use client";

import { MapControls } from "../MapControls";
import type { StoreMapControlsConfig } from "./types";

export function StoreMapControls({ config }: { config: StoreMapControlsConfig }) {
  if (config.enabled === false) return null;

  return (
    <MapControls
      position={config.position ?? "bottom-right"}
      showZoom={config.showZoom ?? true}
      showCompass={config.showCompass ?? true}
      showLocate={config.showLocate ?? false}
      showFullscreen={config.showFullscreen ?? false}
      className={config.className}
    />
  );
}
