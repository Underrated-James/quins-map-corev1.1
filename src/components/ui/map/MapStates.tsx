"use client";

import { Component, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, RefreshCw } from "lucide-react";

// ─── MapLoadingState ───────────────────────────────────────────────

type MapLoadingStateProps = {
  /** Additional CSS classes */
  className?: string;
  /** Loading message (default: none) */
  message?: string;
};

function MapLoadingState({ className, message }: MapLoadingStateProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center",
        "bg-background/80 backdrop-blur-sm",
        className
      )}
      role="status"
      aria-label="Map loading"
    >
      {/* Animated shimmer grid */}
      <div className="relative mb-4">
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="size-4 rounded-sm bg-muted-foreground/15 animate-pulse"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent animate-shimmer" />
      </div>

      {/* Dots */}
      <div className="flex gap-1.5 mb-2">
        <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-pulse" />
        <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-pulse [animation-delay:200ms]" />
        <span className="size-1.5 rounded-full bg-muted-foreground/50 animate-pulse [animation-delay:400ms]" />
      </div>

      {message && (
        <p className="text-xs text-muted-foreground animate-in fade-in-0">
          {message}
        </p>
      )}
    </div>
  );
}

// ─── MapErrorFallback ──────────────────────────────────────────────

type MapErrorFallbackProps = {
  /** Error message to display */
  error?: Error | string;
  /** Callback to retry loading the map */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
};

function MapErrorFallback({ error, onRetry, className }: MapErrorFallbackProps) {
  const message = typeof error === "string" ? error : error?.message ?? "Failed to load map";

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center",
        "bg-background/95 backdrop-blur-sm",
        className
      )}
      role="alert"
    >
      <div className="flex flex-col items-center gap-3 max-w-xs text-center">
        {/* Error icon */}
        <div className="flex items-center justify-center size-12 rounded-full bg-destructive/10">
          <AlertTriangle className="size-6 text-destructive" />
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">Map couldn't load</p>
          <p className="text-xs text-muted-foreground mt-1">{message}</p>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            type="button"
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
              "text-sm font-medium",
              "bg-primary text-primary-foreground",
              "hover:bg-primary/90 active:scale-95",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              "transition-all duration-150"
            )}
          >
            <RefreshCw className="size-3.5" />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

// ─── MapErrorBoundary ──────────────────────────────────────────────

type MapErrorBoundaryProps = {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Callback on error */
  onError?: (error: Error) => void;
};

type MapErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  constructor(props: MapErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="relative w-full h-full bg-muted">
          <MapErrorFallback
            error={this.state.error ?? undefined}
            onRetry={this.handleRetry}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

export { MapLoadingState, MapErrorFallback, MapErrorBoundary };
export type { MapLoadingStateProps, MapErrorFallbackProps, MapErrorBoundaryProps };
