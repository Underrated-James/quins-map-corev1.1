"use client";

import { useState, useEffect } from "react";

export type OsrmRoute = {
  geometry: { coordinates: [number, number][] };
  duration: number; // seconds
  distance: number; // meters
};

type UseOsrmParams = {
  waypoints: [number, number][];
  baseUrl?: string;
  options?: {
    alternatives?: boolean;
    profile?: "driving" | "walking" | "cycling";
  };
};

export function useOsrmRoutes({ waypoints, baseUrl, options }: UseOsrmParams) {
  const [routes, setRoutes] = useState<OsrmRoute[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchRoute() {
      setIsFetching(true);
      setError(null);
      
      try {
        const profile = options?.profile ?? "driving";
        const alt = options?.alternatives ? "true" : "false";
        const rootUrl = baseUrl || "https://router.project-osrm.org";
        const coordsStr = waypoints.map((w) => `${w[0]},${w[1]}`).join(";");
        
        // Public OSRM routing v1 API (or custom hosted)
        const response = await fetch(
          `${rootUrl}/route/v1/${profile}/${coordsStr}?overview=full&geometries=geojson&alternatives=${alt}`
        );

        if (!response.ok) throw new Error("Failed to fetch route via OSRM");

        const data = await response.json();
        
        if (data.code !== "Ok" || !data.routes?.length) {
          throw new Error("No route found");
        }

        if (active) {
          // data.routes matches the OsrmRoute shape we want
          setRoutes(data.routes);
        }
      } catch (err: any) {
        if (active) setError(err);
      } finally {
        if (active) setIsFetching(false);
      }
    }

    if (waypoints && waypoints.length >= 2) {
      fetchRoute();
    }

    return () => {
      active = false; // Prevent state updates if unmounted mid-fetch
    };
  }, [JSON.stringify(waypoints), options?.alternatives, options?.profile]);

  return { routes, isFetching, error };
}
