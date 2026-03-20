"use client";

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from "react";
import { Search, X, Loader2, MapPin } from "lucide-react";

import { cn } from "@/lib/utils";
import { useMap } from "./context";

// ─── SearchPlacesPanel ─────────────────────────────────────────────

type SearchResult = {
  id: string;
  name: string;
  displayName: string;
  longitude: number;
  latitude: number;
  type: string;
};

type SearchPlacesPanelProps = {
  /** Position on the map (default: "top-left") */
  position?: "top-left" | "top-right";
  /** Placeholder text (default: "Search places...") */
  placeholder?: string;
  /** Callback when a place is selected */
  onSelect?: (result: SearchResult) => void;
  /** Zoom level when flying to result (default: 15) */
  flyToZoom?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to auto-fly to selected result (default: true) */
  autoFlyTo?: boolean;
};

function SearchPlacesPanel({
  position = "top-left",
  placeholder = "Search places...",
  onSelect,
  flyToZoom = 15,
  className,
  autoFlyTo = true,
}: SearchPlacesPanelProps) {
  const { map } = useMap();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | undefined>(undefined);

  const posClasses = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
  };

  const searchNominatim = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    // Abort previous request
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1`;
      const res = await fetch(url, {
        signal: abortRef.current.signal,
        headers: { "Accept-Language": "en" },
      });
      const data = await res.json();

      const mapped: SearchResult[] = data.map((item: {
        place_id: number;
        display_name: string;
        lon: string;
        lat: string;
        type: string;
        name?: string;
      }) => ({
        id: String(item.place_id),
        name: item.name || item.display_name.split(",")[0],
        displayName: item.display_name,
        longitude: parseFloat(item.lon),
        latitude: parseFloat(item.lat),
        type: item.type,
      }));

      setResults(mapped);
      setIsOpen(mapped.length > 0);
      setSelectedIndex(-1);
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setResults([]);
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => searchNominatim(value), 350);
    },
    [searchNominatim]
  );

  const handleSelect = useCallback(
    (result: SearchResult) => {
      setQuery(result.name);
      setIsOpen(false);
      setResults([]);
      onSelect?.(result);

      if (autoFlyTo && map) {
        map.flyTo({
          center: [result.longitude, result.latitude],
          zoom: flyToZoom,
          duration: 1500,
        });
      }
    },
    [map, autoFlyTo, flyToZoom, onSelect]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    },
    [results, selectedIndex, handleSelect]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return (
    <div
      className={cn(
        "absolute z-20 w-72",
        posClasses[position],
        className
      )}
    >
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={cn(
            "w-full h-10 pl-10 pr-10 rounded-lg",
            "bg-background/95 backdrop-blur-sm",
            "border border-border/60 shadow-md",
            "text-sm text-foreground placeholder:text-muted-foreground/50",
            "focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring/50",
            "transition-all duration-150"
          )}
          role="combobox"
          aria-expanded={isOpen}
          aria-label="Search for a place"
          aria-autocomplete="list"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
          {isLoading ? (
            <Loader2 className="size-4 text-muted-foreground animate-spin" />
          ) : query ? (
            <button
              onClick={handleClear}
              className="p-0.5 rounded-sm hover:bg-accent transition-colors"
              aria-label="Clear search"
              type="button"
            >
              <X className="size-3.5 text-muted-foreground" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Results dropdown */}
      {isOpen && results.length > 0 && (
        <div
          className={cn(
            "mt-1 rounded-lg border border-border/60 bg-background/95 backdrop-blur-sm shadow-lg",
            "max-h-60 overflow-y-auto",
            "animate-in fade-in-0 slide-in-from-top-1 duration-150"
          )}
          role="listbox"
          aria-label="Search results"
        >
          {results.map((result, i) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={cn(
                "w-full flex items-start gap-2.5 px-3 py-2.5 text-left",
                "transition-colors duration-75",
                i === selectedIndex
                  ? "bg-accent/80 dark:bg-accent/40"
                  : "hover:bg-accent/50 dark:hover:bg-accent/20",
                i !== results.length - 1 && "border-b border-border/30"
              )}
              role="option"
              aria-selected={i === selectedIndex}
              type="button"
            >
              <MapPin className="size-4 text-muted-foreground/60 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {result.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {result.displayName}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { SearchPlacesPanel };
export type { SearchPlacesPanelProps, SearchResult };
