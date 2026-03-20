"use client";

import MapLibreGL from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";
import { MapContext } from "./context";
import { useResolvedTheme, getViewport } from "./hooks";
import { defaultStyles } from "./themes";
import { MapSkeleton } from "./MapCanvas";
import type { MapRef, MapStyleOption, MapViewport, Theme, A11yProps } from "./types";

export type MapProps = {
  /** Map content: controls, markers, layers, etc. */
  children?: ReactNode;
  /** Additional CSS classes for the map container */
  className?: string;
  
  // ── Simple API (Uncontrolled) ──
  /** Initial or declarative center coordinates [longitude, latitude] */
  center?: [number, number];
  /** Initial or declarative zoom level */
  zoom?: number;
  /** Initial or declarative pitch (tilt) in degrees */
  pitch?: number;
  /** Initial or declarative bearing (rotation) in degrees */
  bearing?: number;

  // ── Advanced API (Controlled) ──
  /**
   * Controlled viewport state. When provided alongside `onViewportChange`, 
   * the map becomes fully controlled.
   */
  viewport?: Partial<MapViewport>;
  /**
   * Callback fired continuously as the viewport changes (pan, zoom, rotate, pitch).
   */
  onViewportChange?: (viewport: MapViewport) => void;

  // ── Styling & Theme ──
  /** Theme preference ("light" | "dark"). Defaults to system if undefined. */
  theme?: Theme;
  /** Custom map styles for light and dark themes. */
  styles?: {
    light?: MapStyleOption;
    dark?: MapStyleOption;
  };
  /** Map projection type (e.g., globe for 3D earth) */
  projection?: MapLibreGL.ProjectionSpecification;
  /** Show a loading skeleton while the map initializes */
  loading?: boolean;
  /**
   * Whether to show the map attribution (e.g. "Carto", "OpenStreetMap").
   * 
   * WARNING: Most map tile providers legally require attribution to be visible!
   * - Only set this to `false` if your specific map provider or license explicitly permits doing so.
   * - If legally required, you MUST leave it enabled (it is stylized to be minimal and unobtrusive).
   */
  showAttribution?: boolean;
} & A11yProps &
  Omit<MapLibreGL.MapOptions, "container" | "style" | "center" | "zoom" | "pitch" | "bearing">;

/**
 * 🗺️ Quins Map
 * 
 * A highly optimized, simple, and composable Map component.
 * Features a plug-and-play declarative API for beginners, while exposing 
 * a robust controlled interface and imperative ref for advanced use cases.
 */
export const Map = forwardRef<MapRef, MapProps>(function Map(
  {
    children,
    className,
    center,
    zoom,
    pitch,
    bearing,
    viewport,
    onViewportChange,
    theme: themeProp,
    styles,
    projection,
    loading = false,
    showAttribution = true,
    ariaLabel = "Interactive map",
    keyboardFocusable = true,
    role = "application",
    ...props
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<MapLibreGL.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isStyleLoaded, setIsStyleLoaded] = useState(false);
  
  const currentStyleRef = useRef<MapStyleOption | null>(null);
  const styleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const internalUpdateRef = useRef(false);
  const resolvedTheme = useResolvedTheme(themeProp);

  // Controlled mode check
  const isControlled = viewport !== undefined && onViewportChange !== undefined;

  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;

  const mapStyles = useMemo(
    () => ({
      dark: styles?.dark ?? defaultStyles.dark,
      light: styles?.light ?? defaultStyles.light,
    }),
    [styles]
  );

  // Expose MapLibre instance to parent
  useImperativeHandle(ref, () => mapInstance as MapLibreGL.Map, [mapInstance]);

  const clearStyleTimeout = useCallback(() => {
    if (styleTimeoutRef.current) {
      clearTimeout(styleTimeoutRef.current);
      styleTimeoutRef.current = null;
    }
  }, []);

  // ── Initialize Map ──
  useEffect(() => {
    if (!containerRef.current) return;

    const initialStyle = resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;
    currentStyleRef.current = initialStyle;

    // Use controlled viewport if available, otherwise fallback to simple props
    const initialCenter = viewport?.center ?? center ?? [0, 0];
    const initialZoom = viewport?.zoom ?? zoom ?? 1;
    const initialPitch = viewport?.pitch ?? pitch ?? 0;
    const initialBearing = viewport?.bearing ?? bearing ?? 0;

    const map = new MapLibreGL.Map({
      container: containerRef.current,
      style: initialStyle,
      renderWorldCopies: false,
      attributionControl: showAttribution !== false ? { compact: true } : false,
      keyboard: keyboardFocusable,
      center: initialCenter,
      zoom: initialZoom,
      pitch: initialPitch,
      bearing: initialBearing,
      ...props,
    });

    const styleDataHandler = () => {
      clearStyleTimeout();
      styleTimeoutRef.current = setTimeout(() => {
        setIsStyleLoaded(true);
        if (projection) map.setProjection(projection);
      }, 100);
    };

    const loadHandler = () => setIsLoaded(true);

    const handleMove = () => {
      if (internalUpdateRef.current) return;
      onViewportChangeRef.current?.(getViewport(map));
    };

    map.on("load", loadHandler);
    map.on("styledata", styleDataHandler);
    map.on("move", handleMove);
    setMapInstance(map);

    return () => {
      clearStyleTimeout();
      map.off("load", loadHandler);
      map.off("styledata", styleDataHandler);
      map.off("move", handleMove);
      map.remove();
      setIsLoaded(false);
      setIsStyleLoaded(false);
      setMapInstance(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // ── Sync Declarative Uncontrolled Props ──
  const prevSimpleProps = useRef({ center, zoom, pitch, bearing });
  useEffect(() => {
    if (!mapInstance || isControlled || internalUpdateRef.current) return;

    const hasCenterChanged = 
      center && 
      (center[0] !== prevSimpleProps.current.center?.[0] || 
       center[1] !== prevSimpleProps.current.center?.[1]);
    
    const hasZoomChanged = zoom !== undefined && zoom !== prevSimpleProps.current.zoom;
    const hasPitchChanged = pitch !== undefined && pitch !== prevSimpleProps.current.pitch;
    const hasBearingChanged = bearing !== undefined && bearing !== prevSimpleProps.current.bearing;

    if (hasCenterChanged || hasZoomChanged || hasPitchChanged || hasBearingChanged) {
      prevSimpleProps.current = { center, zoom, pitch, bearing };
      
      mapInstance.flyTo({
        ...(center && { center }),
        ...(zoom !== undefined && { zoom }),
        ...(pitch !== undefined && { pitch }),
        ...(bearing !== undefined && { bearing }),
        duration: 800,
      });
    }
  }, [mapInstance, isControlled, center, zoom, pitch, bearing]);

  // ── Sync Controlled Viewport ──
  useEffect(() => {
    if (!mapInstance || !isControlled || !viewport) return;
    if (mapInstance.isMoving()) return; // Don't interrupt user interaction

    const current = getViewport(mapInstance);
    const next = {
      center: viewport.center ?? current.center,
      zoom: viewport.zoom ?? current.zoom,
      bearing: viewport.bearing ?? current.bearing,
      pitch: viewport.pitch ?? current.pitch,
    };

    // Deep compare to prevent unnecessary jumpTo calls
    if (
      next.center[0] === current.center[0] &&
      next.center[1] === current.center[1] &&
      next.zoom === current.zoom &&
      next.bearing === current.bearing &&
      next.pitch === current.pitch
    ) {
      return;
    }

    internalUpdateRef.current = true;
    mapInstance.jumpTo(next);
    internalUpdateRef.current = false;
  }, [mapInstance, isControlled, viewport]);

  // ── Handle Theme & Style Changes ──
  useEffect(() => {
    if (!mapInstance || !resolvedTheme) return;

    const newStyle = resolvedTheme === "dark" ? mapStyles.dark : mapStyles.light;

    if (currentStyleRef.current === newStyle) return;

    clearStyleTimeout();
    currentStyleRef.current = newStyle;
    setIsStyleLoaded(false);

    mapInstance.setStyle(newStyle, { diff: true });
  }, [mapInstance, resolvedTheme, mapStyles, clearStyleTimeout]);

  const contextValue = useMemo(
    () => ({
      map: mapInstance,
      isLoaded: isLoaded && isStyleLoaded,
    }),
    [mapInstance, isLoaded, isStyleLoaded]
  );

  return (
    <MapContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={cn("relative w-full h-full", className)}
        role={role}
        aria-label={ariaLabel}
        tabIndex={keyboardFocusable ? 0 : undefined}
      >
        {(!isLoaded || loading) && <MapSkeleton />}
        {mapInstance && children}
      </div>
    </MapContext.Provider>
  );
});

export default Map;
