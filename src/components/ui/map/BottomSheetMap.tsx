"use client";

import { useState, useCallback, useRef, type ReactNode, type PointerEvent } from "react";
import { cn } from "@/lib/utils";

// ─── BottomSheetMap ────────────────────────────────────────────────

type SnapPoint = "peek" | "half" | "full";

type BottomSheetMapProps = {
  /** Map content (rendered behind the sheet) */
  map: ReactNode;
  /** Sheet content */
  children: ReactNode;
  /** Sheet header (rendered above children, includes drag handle) */
  header?: ReactNode;
  /** Default snap position (default: "peek") */
  defaultSnap?: SnapPoint;
  /** Peek height in px (default: 80) */
  peekHeight?: number;
  /** Whether sheet is open (default: true) */
  open?: boolean;
  /** Callback when snap point changes */
  onSnapChange?: (snap: SnapPoint) => void;
  /** Additional CSS classes for the sheet */
  className?: string;
};

const snapFractions: Record<SnapPoint, number> = {
  peek: 0,
  half: 0.45,
  full: 0.85,
};

function BottomSheetMap({
  map,
  children,
  header,
  defaultSnap = "peek",
  peekHeight = 80,
  open = true,
  onSnapChange,
  className,
}: BottomSheetMapProps) {
  const [currentSnap, setCurrentSnap] = useState<SnapPoint>(defaultSnap);
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const getHeight = useCallback(
    (snap: SnapPoint) => {
      if (!containerRef.current) return peekHeight;
      const containerHeight = containerRef.current.clientHeight;
      return Math.max(peekHeight, containerHeight * snapFractions[snap]);
    },
    [peekHeight]
  );

  const currentHeight = getHeight(currentSnap) + dragOffset;

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      isDragging.current = true;
      startY.current = e.clientY;
      startHeight.current = getHeight(currentSnap);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [currentSnap, getHeight]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging.current) return;
      const diff = startY.current - e.clientY;
      setDragOffset(diff);
    },
    []
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const containerHeight = containerRef.current?.clientHeight ?? window.innerHeight;
    const finalHeight = startHeight.current + dragOffset;
    const ratio = finalHeight / containerHeight;

    // Snap to nearest
    let nearest: SnapPoint = "peek";
    if (ratio > 0.65) nearest = "full";
    else if (ratio > 0.25) nearest = "half";

    setCurrentSnap(nearest);
    setDragOffset(0);
    onSnapChange?.(nearest);
  }, [dragOffset, onSnapChange]);

  // Keyboard toggle
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        const order: SnapPoint[] = ["peek", "half", "full"];
        const idx = order.indexOf(currentSnap);
        if (idx < order.length - 1) {
          const next = order[idx + 1];
          setCurrentSnap(next);
          onSnapChange?.(next);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const order: SnapPoint[] = ["peek", "half", "full"];
        const idx = order.indexOf(currentSnap);
        if (idx > 0) {
          const next = order[idx - 1];
          setCurrentSnap(next);
          onSnapChange?.(next);
        }
      }
    },
    [currentSnap, onSnapChange]
  );

  if (!open) {
    return <div className="relative w-full h-full">{map}</div>;
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {/* Map behind */}
      <div className="absolute inset-0">{map}</div>

      {/* Bottom sheet */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-20",
          "bg-background/95 backdrop-blur-md",
          "border-t border-border/60",
          "rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)]",
          "flex flex-col",
          !isDragging.current && "transition-[height] duration-300 ease-out",
          className
        )}
        style={{ height: Math.max(peekHeight, currentHeight) }}
        role="dialog"
        aria-label="Map panel"
      >
        {/* Drag handle */}
        <div
          className="flex items-center justify-center py-2 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="slider"
          aria-label="Resize panel"
          aria-valuenow={snapFractions[currentSnap] * 100}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        {header && (
          <div className="px-4 pb-2 border-b border-border/30">
            {header}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-2">
          {children}
        </div>
      </div>
    </div>
  );
}

export { BottomSheetMap };
export type { BottomSheetMapProps, SnapPoint };
