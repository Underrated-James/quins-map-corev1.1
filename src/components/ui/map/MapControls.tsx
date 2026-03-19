"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Minus,
  Plus,
  Locate,
  Maximize,
  Minimize,
  Loader2,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useMap } from "./context";
import { useResolvedTheme } from "./hooks";
import type { Theme } from "./types";

// ─── Shared Primitives ─────────────────────────────────────────────

const positionClasses = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-10 right-2",
};

type ControlPosition = keyof typeof positionClasses;

function ControlGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col rounded-lg border border-border/60 bg-background/95 backdrop-blur-sm shadow-md overflow-hidden [&>button:not(:last-child)]:border-b [&>button:not(:last-child)]:border-border/40">
      {children}
    </div>
  );
}

function ControlButton({
  onClick,
  label,
  children,
  disabled = false,
  active = false,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      type="button"
      className={cn(
        "flex items-center justify-center size-9 transition-all duration-150",
        "hover:bg-accent/80 dark:hover:bg-accent/40",
        "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
        "active:scale-95",
        active && "bg-accent/60 dark:bg-accent/30",
        disabled && "opacity-40 pointer-events-none cursor-not-allowed"
      )}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// ─── ZoomControl ───────────────────────────────────────────────────

type ZoomControlProps = {
  /** Position on the map */
  position?: ControlPosition;
  /** Additional CSS classes */
  className?: string;
};

function ZoomControl({ position = "bottom-right", className }: ZoomControlProps) {
  const { map } = useMap();

  const handleZoomIn = useCallback(() => {
    map?.zoomTo(map.getZoom() + 1, { duration: 300 });
  }, [map]);

  const handleZoomOut = useCallback(() => {
    map?.zoomTo(map.getZoom() - 1, { duration: 300 });
  }, [map]);

  return (
    <div className={cn("absolute z-10", positionClasses[position], className)}>
      <ControlGroup>
        <ControlButton onClick={handleZoomIn} label="Zoom in">
          <Plus className="size-4" />
        </ControlButton>
        <ControlButton onClick={handleZoomOut} label="Zoom out">
          <Minus className="size-4" />
        </ControlButton>
      </ControlGroup>
    </div>
  );
}

// ─── CompassControl ────────────────────────────────────────────────

type CompassControlProps = {
  position?: ControlPosition;
  className?: string;
};

function CompassControl({ position = "bottom-right", className }: CompassControlProps) {
  const { map } = useMap();
  const compassRef = useRef<SVGSVGElement>(null);

  const handleResetBearing = useCallback(() => {
    map?.resetNorthPitch({ duration: 300 });
  }, [map]);

  useEffect(() => {
    if (!map || !compassRef.current) return;
    const compass = compassRef.current;

    const updateRotation = () => {
      const bearing = map.getBearing();
      const pitch = map.getPitch();
      compass.style.transform = `rotateX(${pitch}deg) rotateZ(${-bearing}deg)`;
    };

    map.on("rotate", updateRotation);
    map.on("pitch", updateRotation);
    updateRotation();

    return () => {
      map.off("rotate", updateRotation);
      map.off("pitch", updateRotation);
    };
  }, [map]);

  return (
    <div className={cn("absolute z-10", positionClasses[position], className)}>
      <ControlGroup>
        <ControlButton onClick={handleResetBearing} label="Reset bearing to north">
          <svg
            ref={compassRef}
            viewBox="0 0 24 24"
            className="size-5 transition-transform duration-200"
            style={{ transformStyle: "preserve-3d" }}
          >
            <path d="M12 2L16 12H12V2Z" className="fill-red-500" />
            <path d="M12 2L8 12H12V2Z" className="fill-red-300" />
            <path d="M12 22L16 12H12V22Z" className="fill-muted-foreground/60" />
            <path d="M12 22L8 12H12V22Z" className="fill-muted-foreground/30" />
          </svg>
        </ControlButton>
      </ControlGroup>
    </div>
  );
}

// ─── LocateMeButton ────────────────────────────────────────────────

type LocateMeButtonProps = {
  position?: ControlPosition;
  className?: string;
  /** Zoom level when locating (default: 14) */
  zoom?: number;
  /** Callback with coordinates when located */
  onLocate?: (coords: { longitude: number; latitude: number }) => void;
  /** Callback on error */
  onError?: (error: GeolocationPositionError) => void;
};

function LocateMeButton({
  position = "bottom-right",
  className,
  zoom = 14,
  onLocate,
  onError,
}: LocateMeButtonProps) {
  const { map } = useMap();
  const [status, setStatus] = useState<"idle" | "loading" | "located">("idle");

  const handleLocate = useCallback(() => {
    if (!("geolocation" in navigator)) return;

    setStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          longitude: pos.coords.longitude,
          latitude: pos.coords.latitude,
        };
        map?.flyTo({
          center: [coords.longitude, coords.latitude],
          zoom,
          duration: 1500,
        });
        onLocate?.(coords);
        setStatus("located");
        setTimeout(() => setStatus("idle"), 3000);
      },
      (error) => {
        console.error("Geolocation error:", error);
        onError?.(error);
        setStatus("idle");
      }
    );
  }, [map, zoom, onLocate, onError]);

  return (
    <div className={cn("absolute z-10", positionClasses[position], className)}>
      <ControlGroup>
        <ControlButton
          onClick={handleLocate}
          label="Find my location"
          disabled={status === "loading"}
          active={status === "located"}
        >
          {status === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Locate className={cn("size-4 transition-colors", status === "located" && "text-blue-500")} />
          )}
        </ControlButton>
      </ControlGroup>
    </div>
  );
}

// ─── FullscreenControl ─────────────────────────────────────────────

type FullscreenControlProps = {
  position?: ControlPosition;
  className?: string;
};

function FullscreenControl({ position = "bottom-right", className }: FullscreenControlProps) {
  const { map } = useMap();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleFullscreen = useCallback(() => {
    const container = map?.getContainer();
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }, [map]);

  return (
    <div className={cn("absolute z-10", positionClasses[position], className)}>
      <ControlGroup>
        <ControlButton
          onClick={handleFullscreen}
          label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <Minimize className="size-4" />
          ) : (
            <Maximize className="size-4" />
          )}
        </ControlButton>
      </ControlGroup>
    </div>
  );
}

// ─── MapThemeSwitcher ──────────────────────────────────────────────

type MapThemeSwitcherProps = {
  position?: ControlPosition;
  className?: string;
  /** Current theme (auto-detected if not provided) */
  theme?: Theme;
  /** Callback when theme changes */
  onThemeChange?: (theme: Theme) => void;
  /** Show auto/system option (default: false) */
  showAuto?: boolean;
};

function MapThemeSwitcher({
  position = "top-right",
  className,
  theme: themeProp,
  onThemeChange,
  showAuto = false,
}: MapThemeSwitcherProps) {
  const resolvedTheme = useResolvedTheme(themeProp);
  const [localTheme, setLocalTheme] = useState<Theme | "auto">(themeProp ?? "auto");

  const cycleTheme = useCallback(() => {
    if (showAuto) {
      const order: (Theme | "auto")[] = ["light", "dark", "auto"];
      const idx = order.indexOf(localTheme);
      const next = order[(idx + 1) % order.length];
      setLocalTheme(next);
      if (next !== "auto") onThemeChange?.(next);
    } else {
      const next: Theme = resolvedTheme === "light" ? "dark" : "light";
      setLocalTheme(next);
      onThemeChange?.(next);
    }
  }, [showAuto, localTheme, resolvedTheme, onThemeChange]);

  const icon =
    localTheme === "auto" ? (
      <Monitor className="size-4" />
    ) : resolvedTheme === "dark" ? (
      <Moon className="size-4" />
    ) : (
      <Sun className="size-4" />
    );

  const label =
    localTheme === "auto"
      ? "Theme: auto"
      : `Theme: ${resolvedTheme}`;

  return (
    <div className={cn("absolute z-10", positionClasses[position], className)}>
      <ControlGroup>
        <ControlButton onClick={cycleTheme} label={label}>
          {icon}
        </ControlButton>
      </ControlGroup>
    </div>
  );
}

// ─── Combined MapControls (convenience) ────────────────────────────

type MapControlsProps = {
  /** Position on the map (default: "bottom-right") */
  position?: ControlPosition;
  /** Show zoom in/out buttons (default: true) */
  showZoom?: boolean;
  /** Show compass button (default: false) */
  showCompass?: boolean;
  /** Show locate button (default: false) */
  showLocate?: boolean;
  /** Show fullscreen button (default: false) */
  showFullscreen?: boolean;
  /** Show theme switcher (default: false) */
  showThemeSwitcher?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Callback with user coordinates when located */
  onLocate?: (coords: { longitude: number; latitude: number }) => void;
  /** Callback when theme changes */
  onThemeChange?: (theme: Theme) => void;
};

function MapControls({
  position = "bottom-right",
  showZoom = true,
  showCompass = false,
  showLocate = false,
  showFullscreen = false,
  showThemeSwitcher = false,
  className,
  onLocate,
  onThemeChange,
}: MapControlsProps) {
  const { map } = useMap();
  const [waitingForLocation, setWaitingForLocation] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const resolvedTheme = useResolvedTheme();

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const handleZoomIn = useCallback(() => {
    map?.zoomTo(map.getZoom() + 1, { duration: 300 });
  }, [map]);
  const handleZoomOut = useCallback(() => {
    map?.zoomTo(map.getZoom() - 1, { duration: 300 });
  }, [map]);
  const handleResetBearing = useCallback(() => {
    map?.resetNorthPitch({ duration: 300 });
  }, [map]);

  const handleLocate = useCallback(() => {
    setWaitingForLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { longitude: pos.coords.longitude, latitude: pos.coords.latitude };
          map?.flyTo({ center: [coords.longitude, coords.latitude], zoom: 14, duration: 1500 });
          onLocate?.(coords);
          setWaitingForLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setWaitingForLocation(false);
        }
      );
    }
  }, [map, onLocate]);

  const handleFullscreen = useCallback(() => {
    const container = map?.getContainer();
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }, [map]);

  const handleToggleTheme = useCallback(() => {
    const next: Theme = resolvedTheme === "light" ? "dark" : "light";
    onThemeChange?.(next);
  }, [resolvedTheme, onThemeChange]);

  return (
    <div
      className={cn(
        "absolute z-10 flex flex-col gap-1.5",
        positionClasses[position],
        className
      )}
      role="toolbar"
      aria-label="Map controls"
    >
      {showZoom && (
        <ControlGroup>
          <ControlButton onClick={handleZoomIn} label="Zoom in">
            <Plus className="size-4" />
          </ControlButton>
          <ControlButton onClick={handleZoomOut} label="Zoom out">
            <Minus className="size-4" />
          </ControlButton>
        </ControlGroup>
      )}
      {showCompass && (
        <ControlGroup>
          <CompassInline onReset={handleResetBearing} />
        </ControlGroup>
      )}
      {showLocate && (
        <ControlGroup>
          <ControlButton onClick={handleLocate} label="Find my location" disabled={waitingForLocation}>
            {waitingForLocation ? <Loader2 className="size-4 animate-spin" /> : <Locate className="size-4" />}
          </ControlButton>
        </ControlGroup>
      )}
      {showFullscreen && (
        <ControlGroup>
          <ControlButton onClick={handleFullscreen} label={isFullscreen ? "Exit fullscreen" : "Toggle fullscreen"}>
            {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </ControlButton>
        </ControlGroup>
      )}
      {showThemeSwitcher && (
        <ControlGroup>
          <ControlButton onClick={handleToggleTheme} label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} theme`}>
            {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </ControlButton>
        </ControlGroup>
      )}
    </div>
  );
}

// Inline compass for combined controls
function CompassInline({ onReset }: { onReset: () => void }) {
  const { map } = useMap();
  const compassRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!map || !compassRef.current) return;
    const compass = compassRef.current;
    const update = () => {
      compass.style.transform = `rotateX(${map.getPitch()}deg) rotateZ(${-map.getBearing()}deg)`;
    };
    map.on("rotate", update);
    map.on("pitch", update);
    update();
    return () => { map.off("rotate", update); map.off("pitch", update); };
  }, [map]);

  return (
    <ControlButton onClick={onReset} label="Reset bearing to north">
      <svg ref={compassRef} viewBox="0 0 24 24" className="size-5 transition-transform duration-200" style={{ transformStyle: "preserve-3d" }}>
        <path d="M12 2L16 12H12V2Z" className="fill-red-500" />
        <path d="M12 2L8 12H12V2Z" className="fill-red-300" />
        <path d="M12 22L16 12H12V22Z" className="fill-muted-foreground/60" />
        <path d="M12 22L8 12H12V22Z" className="fill-muted-foreground/30" />
      </svg>
    </ControlButton>
  );
}

export {
  MapControls,
  ZoomControl,
  CompassControl,
  LocateMeButton,
  FullscreenControl,
  MapThemeSwitcher,
  ControlGroup,
  ControlButton,
};
export type {
  MapControlsProps,
  ZoomControlProps,
  CompassControlProps,
  LocateMeButtonProps,
  FullscreenControlProps,
  MapThemeSwitcherProps,
};
