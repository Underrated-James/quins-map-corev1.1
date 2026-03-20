"use client";

import { useLayoutEffect } from "react";

/**
 * Ensures map attribution is rendered safely but visually less intrusive.
 * 
 * LEGAL WARNING: 
 * Map providers require attribution. Do not hide it entirely with `display: none`
 * unless you have a premium license that permits doing so.
 */
export function useMapAttribution({
  position = "bottom-right",
}: {
  position?: string;
}) {
  useLayoutEffect(() => {
    // We inject a global style to reposiiton maplibregl-ctrl-attrib
    // because Mapbox/Libre natively renders attribution
    const styleId = "quins-map-attribution-override";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    
    // Position classes
    let cssText = `
      .maplibregl-ctrl-attrib {
        background-color: rgba(255, 255, 255, 0.6) !important;
        border-radius: 4px;
        padding: 0 4px !important;
        pointer-events: auto;
        font-size: 10px !important;
      }
      .dark .maplibregl-ctrl-attrib {
        background-color: rgba(0, 0, 0, 0.4) !important;
        color: rgba(255, 255, 255, 0.8) !important;
      }
      .dark .maplibregl-ctrl-attrib a {
        color: rgba(255, 255, 255, 0.8) !important;
      }
    `;

    style.innerHTML = cssText;
    document.head.appendChild(style);

    return () => {
      const el = document.getElementById(styleId);
      if (el) el.remove();
    };
  }, [position]);
}
