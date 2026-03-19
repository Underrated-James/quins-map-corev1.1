"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMap } from "./context";
import type { Theme } from "./types";

// ─── ReducedMotionProvider ─────────────────────────────────────────

type ReducedMotionProviderProps = {
  /** Force reduced motion (auto-detects from system if not set) */
  enabled?: boolean;
  children: ReactNode;
};

function ReducedMotionProvider({ enabled, children }: ReducedMotionProviderProps) {
  const { map } = useMap();
  const prefersReduced =
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;
  const isReduced = enabled ?? prefersReduced;

  useEffect(() => {
    if (!map) return;

    if (isReduced) {
      // Override flyTo / easeTo to jump
      const originalFlyTo = map.flyTo.bind(map);
      const originalEaseTo = map.easeTo.bind(map);

      map.flyTo = (options: Parameters<typeof map.flyTo>[0]) => {
        return originalFlyTo({ ...options, duration: 0 });
      };
      map.easeTo = (options: Parameters<typeof map.easeTo>[0]) => {
        return originalEaseTo({ ...options, duration: 0 });
      };

      return () => {
        map.flyTo = originalFlyTo;
        map.easeTo = originalEaseTo;
      };
    }
  }, [map, isReduced]);

  return <>{children}</>;
}

// ─── AccessibleLegend ──────────────────────────────────────────────

type LegendItem = {
  label: string;
  color: string;
  shape?: "circle" | "square" | "triangle" | "line";
  description?: string;
};

type AccessibleLegendProps = {
  title?: string;
  items: LegendItem[];
  /** Position on the map (default: "bottom-left") */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Collapsible (default: true) */
  collapsible?: boolean;
  className?: string;
};

const positionClasses: Record<string, string> = {
  "top-left": "top-2 left-2",
  "top-right": "top-2 right-2",
  "bottom-left": "bottom-2 left-2",
  "bottom-right": "bottom-2 right-2",
};

function AccessibleLegend({
  title = "Legend",
  items,
  position = "bottom-left",
  collapsible = true,
  className,
}: AccessibleLegendProps) {
  const [collapsed, setCollapsed] = useState(false);

  const shapeElements: Record<string, (color: string) => ReactNode> = {
    circle: (color: string) => (
      <div className="size-3 rounded-full" style={{ backgroundColor: color }} />
    ),
    square: (color: string) => (
      <div className="size-3 rounded-sm" style={{ backgroundColor: color }} />
    ),
    triangle: (color: string) => (
      <div
        className="size-0 border-l-[6px] border-r-[6px] border-b-[10px] border-l-transparent border-r-transparent"
        style={{ borderBottomColor: color }}
      />
    ),
    line: (color: string) => (
      <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: color }} />
    ),
  };

  return (
    <div
      className={cn(
        "absolute z-10",
        positionClasses[position],
        className
      )}
    >
      <div className="rounded-lg border border-border/60 bg-background/95 backdrop-blur-sm shadow-md overflow-hidden">
        {/* Header */}
        <button
          onClick={() => collapsible && setCollapsed(!collapsed)}
          type="button"
          className={cn(
            "w-full flex items-center justify-between px-3 py-2",
            "text-xs font-semibold text-foreground",
            collapsible && "hover:bg-accent/50 cursor-pointer",
            !collapsible && "cursor-default"
          )}
          aria-expanded={!collapsed}
          tabIndex={collapsible ? 0 : -1}
        >
          {title}
          {collapsible && (
            <span className={cn("transition-transform text-muted-foreground", collapsed ? "" : "rotate-180")}>
              ▾
            </span>
          )}
        </button>

        {/* Items */}
        {!collapsed && (
          <ul className="px-3 pb-2 space-y-1.5" role="list" aria-label="Map legend items">
            {items.map((item, i) => (
              <li key={i} className="flex items-center gap-2" role="listitem">
                {shapeElements[item.shape ?? "circle"](item.color)}
                <span className="text-xs text-foreground">{item.label}</span>
                {item.description && (
                  <span className="sr-only">{item.description}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── HighContrastMapTheme ──────────────────────────────────────────

const highContrastStyles: Record<Theme, string> = {
  light: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
};

type HighContrastMapThemeProps = {
  /** Additional themed CSS classes to apply */
  className?: string;
  children?: ReactNode;
};

/**
 * Wraps map content with high contrast styles.
 * Apply to MapCanvas via `style` prop using the exported `highContrastStyles`.
 */
function HighContrastMapTheme({ className, children }: HighContrastMapThemeProps) {
  return (
    <div className={cn("contrast-125 saturate-150", className)}>
      {children}
    </div>
  );
}

// ─── ColorblindSafeMarkerSet ───────────────────────────────────────

/**
 * Colorblind-safe palette using shapes + patterns, not just colors.
 * Based on Wong (2011) and Okabe-Ito palette.
 */
const colorblindSafePalette = {
  orange: { color: "#E69F00", shape: "circle" as const, pattern: "solid" },
  skyBlue: { color: "#56B4E9", shape: "square" as const, pattern: "stripes" },
  green: { color: "#009E73", shape: "triangle" as const, pattern: "dots" },
  yellow: { color: "#F0E442", shape: "diamond" as const, pattern: "solid" },
  blue: { color: "#0072B2", shape: "circle" as const, pattern: "cross" },
  vermillion: { color: "#D55E00", shape: "square" as const, pattern: "solid" },
  purple: { color: "#CC79A7", shape: "triangle" as const, pattern: "stripes" },
  black: { color: "#000000", shape: "circle" as const, pattern: "solid" },
} as const;

type ColorblindMarkerProps = {
  /** Palette key */
  variant: keyof typeof colorblindSafePalette;
  /** Size in pixels (default: 20) */
  size?: number;
  /** Label (screen reader) */
  label?: string;
  className?: string;
};

function ColorblindSafeMarker({
  variant,
  size = 20,
  label,
  className,
}: ColorblindMarkerProps) {
  const { color, shape } = colorblindSafePalette[variant];

  const shapeStyle: React.CSSProperties = {
    width: size,
    height: size,
    backgroundColor: color,
    border: "2px solid #fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
  };

  const shapeClass = cn(
    "inline-flex items-center justify-center",
    shape === "circle" && "rounded-full",
    shape === "square" && "rounded-sm",
    shape === "triangle" && "clip-triangle",
    shape === "diamond" && "rotate-45 rounded-sm",
    className
  );

  return (
    <div
      className={shapeClass}
      style={shapeStyle}
      role="img"
      aria-label={label ?? `${variant} marker`}
    />
  );
}

// ─── FocusMarkerNavigator ──────────────────────────────────────────

type FocusMarkerNavigatorProps = {
  /** Marker IDs in navigation order */
  markerIds: string[];
  /** Callback when active marker changes */
  onFocusChange?: (markerId: string, index: number) => void;
  /** Whether navigator is active (default: true) */
  enabled?: boolean;
  children?: ReactNode;
};

function FocusMarkerNavigator({
  markerIds,
  onFocusChange,
  enabled = true,
  children,
}: FocusMarkerNavigatorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled || markerIds.length === 0) return;

      let newIndex = currentIndex;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        newIndex = (currentIndex + 1) % markerIds.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        newIndex = (currentIndex - 1 + markerIds.length) % markerIds.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        newIndex = markerIds.length - 1;
      }

      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        onFocusChange?.(markerIds[newIndex], newIndex);
      }
    },
    [enabled, markerIds, currentIndex, onFocusChange]
  );

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={enabled ? 0 : -1}
      role="navigation"
      aria-label={`Navigate ${markerIds.length} markers using arrow keys`}
      className="focus-visible:outline-none"
    >
      {children}
      {/* Screen reader status */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Marker {currentIndex + 1} of {markerIds.length}
      </div>
    </div>
  );
}

export {
  ReducedMotionProvider,
  AccessibleLegend,
  HighContrastMapTheme,
  highContrastStyles,
  ColorblindSafeMarker,
  colorblindSafePalette,
  FocusMarkerNavigator,
};
export type {
  ReducedMotionProviderProps,
  AccessibleLegendProps,
  LegendItem,
  HighContrastMapThemeProps,
  ColorblindMarkerProps,
  FocusMarkerNavigatorProps,
};
