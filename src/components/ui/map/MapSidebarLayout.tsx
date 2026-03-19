"use client";

import { useState, type ReactNode } from "react";
import { PanelLeftClose, PanelLeft } from "lucide-react";

import { cn } from "@/lib/utils";

// ─── MapSidebarLayout ──────────────────────────────────────────────

type MapSidebarLayoutProps = {
  /** Map content */
  map: ReactNode;
  /** Sidebar content */
  sidebar: ReactNode;
  /** Sidebar header */
  sidebarHeader?: ReactNode;
  /** Sidebar width in pixels (default: 360) */
  sidebarWidth?: number;
  /** Whether sidebar is open (controlled) */
  sidebarOpen?: boolean;
  /** Callback when sidebar toggle is clicked */
  onToggle?: (open: boolean) => void;
  /** Sidebar position (default: "left") */
  position?: "left" | "right";
  /** Additional CSS classes for the container */
  className?: string;
};

function MapSidebarLayout({
  map,
  sidebar,
  sidebarHeader,
  sidebarWidth = 360,
  sidebarOpen: controlledOpen,
  onToggle,
  position = "left",
  className,
}: MapSidebarLayoutProps) {
  const [internalOpen, setInternalOpen] = useState(true);
  const isOpen = controlledOpen ?? internalOpen;

  const toggleSidebar = () => {
    const next = !isOpen;
    setInternalOpen(next);
    onToggle?.(next);
  };

  return (
    <div className={cn("relative flex w-full h-full overflow-hidden", className)}>
      {/* Sidebar */}
      <div
        className={cn(
          "relative z-10 flex flex-col shrink-0",
          "bg-background border-border/60 shadow-lg",
          "transition-all duration-300 ease-out",
          position === "left" ? "border-r order-first" : "border-l order-last",
          !isOpen && (position === "left" ? "-ml-[var(--sidebar-w)]" : "-mr-[var(--sidebar-w)]")
        )}
        style={{
          width: sidebarWidth,
          "--sidebar-w": `${sidebarWidth}px`,
        } as React.CSSProperties}
      >
        {/* Header */}
        {sidebarHeader && (
          <div className="shrink-0 border-b border-border/40 px-4 py-3">
            {sidebarHeader}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {sidebar}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        type="button"
        className={cn(
          "absolute z-20 top-3 flex items-center justify-center",
          "size-8 rounded-lg",
          "bg-background/95 backdrop-blur-sm",
          "border border-border/60 shadow-md",
          "hover:bg-accent/80 dark:hover:bg-accent/40",
          "focus-visible:outline-2 focus-visible:outline-ring",
          "transition-all duration-200",
          position === "left"
            ? isOpen
              ? "left-[calc(var(--sidebar-w)+8px)]"
              : "left-2"
            : isOpen
              ? "right-[calc(var(--sidebar-w)+8px)]"
              : "right-2"
        )}
        style={{ "--sidebar-w": `${sidebarWidth}px` } as React.CSSProperties}
        aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      >
        {position === "left" ? (
          isOpen ? <PanelLeftClose className="size-4" /> : <PanelLeft className="size-4" />
        ) : (
          isOpen ? <PanelLeft className="size-4" /> : <PanelLeftClose className="size-4" />
        )}
      </button>

      {/* Map */}
      <div className="flex-1 relative min-w-0">{map}</div>
    </div>
  );
}

// ─── MarkerListSync ────────────────────────────────────────────────

type MarkerItem = {
  id: string;
  name: string;
  description?: string;
  longitude: number;
  latitude: number;
  [key: string]: unknown;
};

type MarkerListSyncProps = {
  /** List of markers to display */
  items: MarkerItem[];
  /** Currently selected item ID */
  selectedId?: string | null;
  /** Callback when an item is selected */
  onSelect?: (item: MarkerItem) => void;
  /** Render custom list item */
  renderItem?: (item: MarkerItem, isSelected: boolean) => ReactNode;
  /** Additional CSS classes */
  className?: string;
};

function MarkerListSync({
  items,
  selectedId,
  onSelect,
  renderItem,
  className,
}: MarkerListSyncProps) {
  return (
    <div
      className={cn("flex flex-col", className)}
      role="listbox"
      aria-label="Map locations"
    >
      {items.map((item) => {
        const isSelected = item.id === selectedId;

        if (renderItem) {
          return (
            <button
              key={item.id}
              onClick={() => onSelect?.(item)}
              className="text-left w-full"
              role="option"
              aria-selected={isSelected}
              type="button"
            >
              {renderItem(item, isSelected)}
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => onSelect?.(item)}
            type="button"
            role="option"
            aria-selected={isSelected}
            className={cn(
              "w-full text-left px-4 py-3 flex items-start gap-3",
              "border-b border-border/30",
              "transition-colors duration-100",
              isSelected
                ? "bg-primary/5 dark:bg-primary/10 border-l-2 border-l-primary"
                : "hover:bg-accent/50 dark:hover:bg-accent/20"
            )}
          >
            {/* Dot */}
            <div
              className={cn(
                "size-2.5 rounded-full mt-1.5 shrink-0 transition-colors",
                isSelected ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
            <div className="min-w-0">
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  isSelected && "text-primary"
                )}
              >
                {item.name}
              </p>
              {item.description && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {item.description}
                </p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export { MapSidebarLayout, MarkerListSync };
export type { MapSidebarLayoutProps, MarkerListSyncProps, MarkerItem };
