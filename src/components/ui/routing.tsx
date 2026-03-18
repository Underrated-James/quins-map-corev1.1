import * as L from "leaflet";
import { useEffect, useRef } from "react";
import { useMap, type LatLngTuple } from "./map";

type RoutingControlProps = {
  waypoints: LatLngTuple[];
  options?: Record<string, unknown>;
  enabled?: boolean;
};

function RoutingControl({
  waypoints,
  options,
  enabled = true,
}: RoutingControlProps) {
  const map = useMap();
  const controlRef = useRef<any>(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !map) return;
    let active = true;

    const load = async () => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      try {
        await Promise.all([
          import("leaflet-routing-machine"),
          import("leaflet-routing-machine/dist/leaflet-routing-machine.css"),
        ]);
      } catch (error) {
        console.warn("[leaflet-kit] Routing plugin failed to load.", error);
        return;
      } finally {
        loadingRef.current = false;
      }

      if (!active) return;

      const Routing = (L as any).Routing;
      if (!Routing?.control) {
        console.warn(
          '[leaflet-kit] Missing plugin "leaflet-routing-machine". Install it to enable routing controls.'
        );
        return;
      }

      const control = Routing.control({
        waypoints: waypoints.map((point) => L.latLng(point[0], point[1])),
        ...options,
      });
      controlRef.current = control;
      control.addTo(map);
    };

    load();

    return () => {
      active = false;
      if (controlRef.current) {
        controlRef.current.remove();
        controlRef.current = null;
      }
    };
  }, [enabled, map, options, waypoints]);

  return null;
}

export { RoutingControl };
export type { RoutingControlProps };
