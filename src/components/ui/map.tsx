import * as L from "leaflet";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createRoot, type Root } from "react-dom/client";

// Ensure plugins can attach to the same Leaflet instance.
// Many Leaflet plugins expect a global `L`.
if (typeof globalThis !== "undefined") {
  (globalThis as any).L = L;
}

type LatLngTuple = [number, number];
type LeafletMap = L.Map;

type MapContextValue = {
  map: LeafletMap | null;
};

const MapContext = createContext<MapContextValue | null>(null);
const LayerContext = createContext<L.LayerGroup | null>(null);
const SourceContext = createContext<GeoJSON.GeoJsonObject | null>(null);

function useMapContext() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("Map components must be used within <Map />");
  }
  return context;
}

function useMap() {
  const context = useMapContext();
  if (!context.map) {
    throw new Error("Map is not ready yet.");
  }
  return context.map;
}

function useLayerTarget() {
  const { map } = useMapContext();
  const layerGroup = useContext(LayerContext);
  return layerGroup ?? map;
}

let leafletIconsConfigured = false;

function ensureLeafletDefaultIcons() {
  if (leafletIconsConfigured) return;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: new URL(
      "leaflet/dist/images/marker-icon-2x.png",
      import.meta.url
    ).toString(),
    iconUrl: new URL(
      "leaflet/dist/images/marker-icon.png",
      import.meta.url
    ).toString(),
    shadowUrl: new URL(
      "leaflet/dist/images/marker-shadow.png",
      import.meta.url
    ).toString(),
  });
  leafletIconsConfigured = true;
}

type LeafletPluginName =
  | "heat"
  | "vectorgrid"
  | "markercluster"
  | "draw";

type LeafletPluginSpec = {
  module: string;
  test: () => boolean;
};

type LeafletPluginStatus = "idle" | "loading" | "ready" | "error";

const pluginRegistry: Record<LeafletPluginName, LeafletPluginSpec> = {
  heat: {
    module: "leaflet.heat",
    test: () => typeof (L as any).heatLayer === "function",
  },
  vectorgrid: {
    module: "leaflet.vectorgrid",
    test: () => typeof (L as any).vectorGrid?.protobuf === "function",
  },
  markercluster: {
    module: "leaflet.markercluster",
    test: () => typeof (L as any).markerClusterGroup === "function",
  },
  draw: {
    module: "leaflet-draw",
    test: () => typeof (L as any).Control?.Draw === "function",
  },
};

const pluginStatus = new globalThis.Map<
  LeafletPluginName,
  LeafletPluginStatus
>();
const pluginPromises = new globalThis.Map<LeafletPluginName, Promise<void>>();
const pluginWarnings = new Set<string>();

function warnMissingPlugin(name: LeafletPluginName, error?: unknown) {
  if (pluginWarnings.has(name)) return;
  pluginWarnings.add(name);
  const moduleName = pluginRegistry[name]?.module ?? name;
  console.warn(
    `[leaflet-kit] Missing plugin "${name}". Install "${moduleName}" to enable this feature.`,
    error ?? ""
  );
}

function getPluginStatus(name: LeafletPluginName): LeafletPluginStatus {
  return pluginStatus.get(name) ?? "idle";
}

function registerLeafletPlugin(
  name: LeafletPluginName,
  spec: Partial<LeafletPluginSpec>
) {
  pluginRegistry[name] = { ...pluginRegistry[name], ...spec };
  pluginStatus.set(name, "idle");
}

async function loadLeafletPlugin(name: LeafletPluginName): Promise<void> {
  const spec = pluginRegistry[name];
  if (!spec) return;

  if (spec.test()) {
    pluginStatus.set(name, "ready");
    return;
  }

  const existing = pluginPromises.get(name);
  if (existing) return existing;

  pluginStatus.set(name, "loading");
  const promise = (async () => {
    switch (name) {
      case "heat":
        await import("leaflet.heat");
        return;
      case "vectorgrid":
        await import("leaflet.vectorgrid");
        return;
      case "markercluster":
        await Promise.all([
          import("leaflet.markercluster"),
          import("leaflet.markercluster/dist/MarkerCluster.css"),
          import("leaflet.markercluster/dist/MarkerCluster.Default.css"),
        ]);
        return;
      case "draw":
        await Promise.all([
          import("leaflet-draw"),
          import("leaflet-draw/dist/leaflet.draw.css"),
        ]);
        return;
      default:
        await import(/* @vite-ignore */ spec.module);
    }
  })()
    .then(() => {
      if (spec.test()) {
        pluginStatus.set(name, "ready");
      } else {
        pluginStatus.set(name, "error");
        warnMissingPlugin(name);
      }
    })
    .catch((error) => {
      pluginStatus.set(name, "error");
      warnMissingPlugin(name, error);
    });

  pluginPromises.set(name, promise);
  return promise;
}

function useLeafletPlugin(name: LeafletPluginName, enabled = true) {
  const [status, setStatus] = useState<LeafletPluginStatus>(
    getPluginStatus(name)
  );

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    loadLeafletPlugin(name)
      .catch(() => null)
      .finally(() => {
        if (active) setStatus(getPluginStatus(name));
      });

    return () => {
      active = false;
    };
  }, [name, enabled]);

  return { status, ready: status === "ready" };
}

type MapProps = {
  center?: LatLngTuple;
  zoom?: number;
  className?: string;
  style?: CSSProperties;
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  defaultTiles?: boolean;
  tileUrl?: string;
  attribution?: string;
  showAttribution?: boolean;
  labelsOverlay?: boolean;
  advancedGIS?: boolean;
  advancedGISConfig?: AdvancedGISConfig;
  onReady?: (map: LeafletMap) => void;
  onClick?: (event: L.LeafletMouseEvent) => void;
  onDblClick?: (event: L.LeafletMouseEvent) => void;
  onContextMenu?: (event: L.LeafletMouseEvent) => void;
  onMouseMove?: (event: L.LeafletMouseEvent) => void;
  onMouseDown?: (event: L.LeafletMouseEvent) => void;
  onMouseUp?: (event: L.LeafletMouseEvent) => void;
  onMove?: (event: L.LeafletEvent) => void;
  onMoveStart?: (event: L.LeafletEvent) => void;
  onMoveEnd?: (event: L.LeafletEvent) => void;
  onZoom?: (event: L.LeafletEvent) => void;
  onZoomStart?: (event: L.LeafletEvent) => void;
  onZoomEnd?: (event: L.LeafletEvent) => void;
  onViewChange?: (center: LatLngTuple, zoom: number) => void;
  mapOptions?: Omit<L.MapOptions, "center" | "zoom">;
  children?: ReactNode;
};

const DEFAULT_CENTER: LatLngTuple = [14.5995, 120.9842];
const DEFAULT_ZOOM = 13;
const DEFAULT_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png";
const DEFAULT_LABELS_URL =
  "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png";
const DEFAULT_LABELS_TILE_OPTIONS: L.TileLayerOptions = { opacity: 0.9 };
const DEFAULT_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

type AdvancedGISConfig = {
  labelsUrl?: string;
  geojson?: GeoJSONSourceInput;
  heatPoints?: HeatPoint[];
  heatOptions?: Record<string, unknown>;
  vectorTilesUrl?: string;
  vectorTilesOptions?: Record<string, unknown>;
};

type AdvancedGISState = {
  labels: boolean;
  geojson: boolean;
  heatmap: boolean;
  vectorTiles: boolean;
};

function Map({
  center,
  zoom,
  className,
  style,
  width,
  height,
  borderRadius = 16,
  defaultTiles = true,
  tileUrl = DEFAULT_TILE_URL,
  attribution = DEFAULT_ATTRIBUTION,
  showAttribution = true,
  labelsOverlay = true,
  advancedGIS = false,
  advancedGISConfig,
  onReady,
  onClick,
  onDblClick,
  onContextMenu,
  onMouseMove,
  onMouseDown,
  onMouseUp,
  onMove,
  onMoveStart,
  onMoveEnd,
  onZoom,
  onZoomStart,
  onZoomEnd,
  onViewChange,
  mapOptions,
  children,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const [gisState, setGisState] = useState<AdvancedGISState>({
    labels: labelsOverlay,
    geojson: false,
    heatmap: false,
    vectorTiles: false,
  });
  const [gisHover, setGisHover] = useState(false);

  const resolvedCenter = center ?? DEFAULT_CENTER;
  const resolvedZoom = zoom ?? DEFAULT_ZOOM;
  const labelsUrl = advancedGISConfig?.labelsUrl ?? DEFAULT_LABELS_URL;
  const heatPoints = advancedGISConfig?.heatPoints;
  const heatOptions = advancedGISConfig?.heatOptions;
  const heatPlugin = useLeafletPlugin("heat", advancedGIS);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    ensureLeafletDefaultIcons();

    const map = L.map(containerRef.current, {
      zoomControl: mapOptions?.zoomControl ?? false,
      attributionControl: showAttribution,
      ...mapOptions,
    });
    mapRef.current = map;
    setMapInstance(map);
    onReady?.(map);

    map.setView(resolvedCenter, resolvedZoom, { animate: false });

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      setMapInstance(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const current = map.getCenter();
    const currentZoom = map.getZoom();
    const sameCenter =
      current.lat === resolvedCenter[0] &&
      current.lng === resolvedCenter[1];
    const sameZoom = currentZoom === resolvedZoom;

    if (!sameCenter || !sameZoom) {
      map.setView(resolvedCenter, resolvedZoom, { animate: false });
    }
  }, [resolvedCenter, resolvedZoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!defaultTiles) {
      if (tileLayerRef.current) {
        tileLayerRef.current.remove();
        tileLayerRef.current = null;
      }
      return;
    }

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
      tileLayerRef.current = null;
    }

    const tileLayer = L.tileLayer(tileUrl, {
      attribution: showAttribution ? attribution : "",
    });
    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;
  }, [defaultTiles, tileUrl, attribution]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const bindings: L.LeafletEventHandlerFnMap = {
      click: onClick,
      dblclick: onDblClick,
      contextmenu: onContextMenu,
      mousemove: onMouseMove,
      mousedown: onMouseDown,
      mouseup: onMouseUp,
      move: onMove,
      movestart: onMoveStart,
      moveend: onMoveEnd,
      zoom: onZoom,
      zoomstart: onZoomStart,
      zoomend: onZoomEnd,
    };

    map.on(bindings);

    return () => {
      map.off(bindings);
    };
  }, [
    onClick,
    onDblClick,
    onContextMenu,
    onMouseMove,
    onMouseDown,
    onMouseUp,
    onMove,
    onMoveStart,
    onMoveEnd,
    onZoom,
    onZoomStart,
    onZoomEnd,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onViewChange) return;

    const handler = () => {
      const next = map.getCenter();
      onViewChange([next.lat, next.lng], map.getZoom());
    };

    map.on("moveend", handler);
    map.on("zoomend", handler);
    return () => {
      map.off("moveend", handler);
      map.off("zoomend", handler);
    };
  }, [onViewChange]);

  const contextValue = useMemo<MapContextValue>(
    () => ({ map: mapInstance }),
    [mapInstance]
  );

  return (
    <MapContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={className}
        style={{
          width: width ?? "100%",
          height: height ?? "100%",
          borderRadius,
          overflow: "hidden",
          ...style,
        }}
        onMouseEnter={() => setGisHover(true)}
        onMouseLeave={() => setGisHover(false)}
      >
        {advancedGIS && (
          <div className={`gis-panel ${gisHover ? "is-visible" : ""}`}>
            <div className="gis-panel__title">Advanced GIS</div>
            <label className="gis-panel__row">
              <span>Labels overlay</span>
              <input
                type="checkbox"
                checked={gisState.labels}
                onChange={(event) =>
                  setGisState((prev) => ({
                    ...prev,
                    labels: event.target.checked,
                  }))
                }
              />
            </label>
            <label className="gis-panel__row">
              <span>Heatmap</span>
              <input
                type="checkbox"
                disabled={!heatPoints || !heatPlugin.ready}
                checked={gisState.heatmap}
                onChange={(event) =>
                  setGisState((prev) => ({
                    ...prev,
                    heatmap: event.target.checked,
                  }))
                }
              />
            </label>
          </div>
        )}

        {mapInstance && (
          <>
            {(advancedGIS ? gisState.labels : labelsOverlay) && (
              <TileLayer url={labelsUrl} options={DEFAULT_LABELS_TILE_OPTIONS} />
            )}
            {advancedGIS && gisState.heatmap && heatPoints && (
              <HeatLayer
                points={heatPoints}
                options={{
                  radius: 24,
                  blur: 18,
                  gradient: {
                    0.4: '#22c55e',
                    0.7: '#facc15',
                    1.0: '#ef4444',
                  },
                  ...heatOptions,
                }}
              />
            )}
            {children}
          </>
        )}
      </div>
    </MapContext.Provider>
  );
}

type TileLayerProps = {
  url: string;
  attribution?: string;
  options?: L.TileLayerOptions;
};

function TileLayer({ url, attribution, options }: TileLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    const layer = L.tileLayer(url, { attribution, ...options });
    layer.addTo(map);
    layerRef.current = layer;
    return () => {
      layer.remove();
      layerRef.current = null;
    };
  }, [map, url, attribution, options]);

  return null;
}

type MarkerProps = {
  position: LatLngTuple;
  icon?: L.Icon | L.DivIcon;
  draggable?: boolean;
  popup?: ReactNode;
  openPopup?: boolean;
  onClick?: (event: L.LeafletMouseEvent) => void;
  className?: string;
  size?: [number, number];
  anchor?: [number, number];
  children?: ReactNode;
  label?: ReactNode;
};

function Marker({
  position,
  icon,
  draggable = false,
  popup,
  openPopup = false,
  onClick,
  className,
  size,
  anchor,
  children,
  label,
}: MarkerProps) {
  const target = useLayerTarget();
  const markerRef = useRef<L.Marker | null>(null);
  const popupRootRef = useRef<Root | null>(null);
  const popupContainerRef = useRef<HTMLDivElement | null>(null);
  const markerRootRef = useRef<Root | null>(null);
  const markerContainerRef = useRef<HTMLDivElement | null>(null);
  const resolvedSize =
    size ?? (children || label ? ([22, 22] as [number, number]) : size);
  const resolvedAnchor =
    anchor ??
    (resolvedSize
      ? ([resolvedSize[0] / 2, resolvedSize[1] / 2] as [number, number])
      : anchor);

  useEffect(() => {
    if (!target || markerRef.current) return;

    ensureLeafletDefaultIcons();

    const shouldUseCustom = Boolean(children);
    const container = document.createElement("div");
    markerContainerRef.current = container;

    const divIcon = shouldUseCustom || label
      ? L.divIcon({
          html: container,
          className: className ?? "",
          iconSize: resolvedSize,
          iconAnchor: resolvedAnchor,
        })
      : undefined;

    const marker = L.marker(position, {
      icon: divIcon ?? icon,
      draggable,
    });
    markerRef.current = marker;

    marker.addTo(target);

    return () => {
      marker.remove();
      markerRef.current = null;
      if (popupRootRef.current) {
        popupRootRef.current.unmount();
        popupRootRef.current = null;
      }
      if (markerRootRef.current) {
        markerRootRef.current.unmount();
        markerRootRef.current = null;
      }
      popupContainerRef.current = null;
      markerContainerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    marker.setLatLng(position);
  }, [position]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    if ((children || label) && markerContainerRef.current) {
      if (!markerRootRef.current) {
        markerRootRef.current = createRoot(markerContainerRef.current);
      }
      markerRootRef.current.render(
        <div className="marker-content">
          {label && <div className="marker-label">{label}</div>}
          {children}
        </div>
      );
      marker.setIcon(
        L.divIcon({
          html: markerContainerRef.current,
          className: className ?? "",
          iconSize: resolvedSize,
          iconAnchor: resolvedAnchor,
        })
      );
      return;
    }

    if (!children && icon) {
      marker.setIcon(icon);
    }
  }, [children, icon, className, size, anchor]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker || !marker.dragging) return;
    if (draggable) {
      marker.dragging.enable();
    } else {
      marker.dragging.disable();
    }
  }, [draggable]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    if (!onClick) return;
    marker.on("click", onClick);
    return () => {
      marker.off("click", onClick);
    };
  }, [onClick]);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    if (popup == null) {
      marker.unbindPopup();
      if (popupRootRef.current) {
        popupRootRef.current.unmount();
        popupRootRef.current = null;
      }
      popupContainerRef.current = null;
      return;
    }

    if (!popupContainerRef.current) {
      const container = document.createElement("div");
      popupContainerRef.current = container;
      popupRootRef.current = createRoot(container);
      marker.bindPopup(container);
    }

    popupRootRef.current?.render(<div>{popup}</div>);

    if (openPopup) {
      marker.openPopup();
    }
  }, [popup, openPopup]);

  return null;
}

type MarkerLayerProps<T = LatLngTuple> = {
  data: T[];
  getPosition?: (item: T) => LatLngTuple;
  renderMarker?: (item: T, index: number) => ReactNode;
  popup?: (item: T, index: number) => ReactNode;
  icon?: (item: T, index: number) => L.Icon | L.DivIcon;
  cluster?: boolean;
  clusterOptions?: Record<string, unknown>;
};

function MarkerLayer<T = LatLngTuple>({
  data,
  getPosition = (item) => item as unknown as LatLngTuple,
  renderMarker,
  popup,
  icon,
  cluster = true,
  clusterOptions,
}: MarkerLayerProps<T>) {
  const { ready: clusterReady } = useLeafletPlugin("markercluster", cluster);
  const markers = data.map((item, index) => {
    const position = getPosition(item);
    return (
      <Marker
        key={`${position[0]}-${position[1]}-${index}`}
        position={position}
        icon={icon ? icon(item, index) : undefined}
        popup={popup ? popup(item, index) : undefined}
      >
        {renderMarker ? renderMarker(item, index) : null}
      </Marker>
    );
  });

  if (cluster && clusterReady) {
    return (
      <MarkerClusterGroup options={clusterOptions}>{markers}</MarkerClusterGroup>
    );
  }

  return <>{markers}</>;
}

type GeoJSONSourceInput =
  | GeoJSON.GeoJsonObject
  | string
  | (() => Promise<GeoJSON.GeoJsonObject>);

type AsyncGeoJSONState = {
  data: GeoJSON.GeoJsonObject | null;
  loading: boolean;
  error: Error | null;
};

function useResolvedGeoJSON(
  input: GeoJSONSourceInput | null | undefined,
  onLoadStart?: () => void,
  onLoad?: (data: GeoJSON.GeoJsonObject) => void,
  onError?: (error: Error) => void
): AsyncGeoJSONState {
  const [state, setState] = useState<AsyncGeoJSONState>({
    data: input && typeof input === "object" ? input : null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!input) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    if (typeof input === "object") {
      setState({ data: input, loading: false, error: null });
      onLoad?.(input);
      return;
    }

    let active = true;
    onLoadStart?.();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (typeof input === "string") {
      const controller = new AbortController();
      fetch(input, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch GeoJSON: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          if (!active) return;
          setState({ data, loading: false, error: null });
          onLoad?.(data);
        })
        .catch((error) => {
          if (!active || error?.name === "AbortError") return;
          setState({ data: null, loading: false, error });
          onError?.(error);
        });

      return () => {
        active = false;
        controller.abort();
      };
    }

    input()
      .then((data) => {
        if (!active) return;
        setState({ data, loading: false, error: null });
        onLoad?.(data);
      })
      .catch((error) => {
        if (!active) return;
        setState({ data: null, loading: false, error });
        onError?.(error);
      });

    return () => {
      active = false;
    };
  }, [input, onLoadStart, onLoad, onError]);

  return state;
}

type GeoJSONLayerProps = {
  data?: GeoJSONSourceInput;
  style?: L.PathOptions | ((feature: any) => L.PathOptions);
  pointToLayer?: (feature: any, latlng: L.LatLng) => L.Layer;
  filter?: (feature: any) => boolean;
  onEachFeature?: (feature: any, layer: L.Layer) => void;
  onClick?: (event: L.LeafletMouseEvent) => void;
  onMouseOver?: (event: L.LeafletMouseEvent) => void;
  onMouseOut?: (event: L.LeafletMouseEvent) => void;
  onMouseMove?: (event: L.LeafletMouseEvent) => void;
  onLoadStart?: () => void;
  onLoad?: (data: GeoJSON.GeoJsonObject) => void;
  onError?: (error: Error) => void;
  pane?: string;
};

function GeoJSONLayer({
  data,
  style,
  pointToLayer,
  filter,
  onEachFeature,
  onClick,
  onMouseOver,
  onMouseOut,
  onMouseMove,
  onLoadStart,
  onLoad,
  onError,
  pane,
}: GeoJSONLayerProps) {
  const { map } = useMapContext();
  const contextData = useContext(SourceContext);
  const resolvedInput = data ?? contextData;
  const { data: resolvedData } = useResolvedGeoJSON(
    resolvedInput,
    onLoadStart,
    onLoad,
    onError
  );
  const layerRef = useRef<L.GeoJSON | null>(null);

  const options = useMemo(
    () => ({
      style,
      pointToLayer,
      filter,
      onEachFeature,
      pane,
    }),
    [style, pointToLayer, filter, onEachFeature, pane]
  );

  useEffect(() => {
    if (!map || !resolvedData) return;

    const layer = L.geoJSON(resolvedData as any, options);
    layerRef.current = layer;
    layer.addTo(map);

    const bindings: L.LeafletEventHandlerFnMap = {
      click: onClick,
      mouseover: onMouseOver,
      mouseout: onMouseOut,
      mousemove: onMouseMove,
    };

    layer.on(bindings);

    return () => {
      layer.off(bindings);
      layer.remove();
      layerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, resolvedData, options, onClick, onMouseOver, onMouseOut, onMouseMove]);

  useEffect(() => {
    if (!layerRef.current || !resolvedData) return;
    layerRef.current.clearLayers();
    layerRef.current.addData(resolvedData as any);
  }, [resolvedData]);

  return null;
}

type SourceProps = {
  data: GeoJSONSourceInput;
  onLoadStart?: () => void;
  onLoad?: (data: GeoJSON.GeoJsonObject) => void;
  onError?: (error: Error) => void;
  children?: ReactNode;
};

function Source({
  data,
  onLoadStart,
  onLoad,
  onError,
  children,
}: SourceProps) {
  const { data: resolvedData } = useResolvedGeoJSON(
    data,
    onLoadStart,
    onLoad,
    onError
  );

  return (
    <SourceContext.Provider value={resolvedData}>
      {children}
    </SourceContext.Provider>
  );
}

type LayerProps = Omit<GeoJSONLayerProps, "data">;

function Layer(props: LayerProps) {
  const data = useContext(SourceContext);
  if (!data) return null;
  return <GeoJSONLayer data={data} {...props} />;
}

type HeatPoint = [number, number] | [number, number, number];

type HeatLayerProps = {
  points: HeatPoint[];
  options?: Record<string, unknown>;
  enabled?: boolean;
};

type PolylineLayerProps = {
  path: LatLngTuple[];
  options?: L.PolylineOptions;
  onClick?: (event: L.LeafletMouseEvent) => void;
};

type RouteProvider = "osrm" | "custom" | "dijkstra";

type RouteGraphNode = {
  id: string;
  lat: number;
  lng: number;
};

type RouteGraphEdge = {
  from: string;
  to: string;
  weight?: number;
};

type RouteGraph = {
  nodes: RouteGraphNode[];
  edges: RouteGraphEdge[];
  directed?: boolean;
};

type RouteLayerProps = {
  enabled?: boolean;
  provider?: RouteProvider;
  from: LatLngTuple;
  to: LatLngTuple;
  path?: LatLngTuple[];
  fallbackPath?: LatLngTuple[];
  graph?: RouteGraph;
  osrmProfile?: "driving" | "walking" | "cycling" | "foot" | "bike";
  osrmBaseUrl?: string;
  osrmAlternatives?: boolean | number;
  osrmStrategy?: "fastest" | "shortest";
  osrmTimeoutMs?: number;
  snapToMarkers?: boolean;
  snapToleranceMeters?: number;
  polylineOptions?: L.PolylineOptions;
  alternativesOptions?: L.PolylineOptions;
  showAlternatives?: boolean | number;
  onStatusChange?: (status: "idle" | "loading" | "error") => void;
  onRoutePathChange?: (path: LatLngTuple[]) => void;
};

function PolylineLayer({ path, options, onClick }: PolylineLayerProps) {
  const { map } = useMapContext();
  const lineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    const line = L.polyline(path, options);
    lineRef.current = line;
    line.addTo(map);

    if (onClick) {
      line.on("click", onClick);
    }

    return () => {
      if (onClick) {
        line.off("click", onClick);
      }
      line.remove();
      lineRef.current = null;
    };
  }, [map, onClick, options, path]);

  useEffect(() => {
    if (!lineRef.current) return;
    lineRef.current.setLatLngs(path);
  }, [path]);

  useEffect(() => {
    if (!lineRef.current || !options) return;
    lineRef.current.setStyle(options);
  }, [options]);

  return null;
}

function haversineDistance(a: LatLngTuple, b: LatLngTuple) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371_000;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function buildAdjacency(graph: RouteGraph) {
  const nodes = new globalThis.Map<string, RouteGraphNode>();
  graph.nodes.forEach((node: RouteGraphNode) => nodes.set(node.id, node));

  const adjacency = new globalThis.Map<
    string,
    Array<{ to: string; weight: number }>
  >();
  const pushEdge = (from: string, to: string, weight: number) => {
    const list = adjacency.get(from) ?? [];
    list.push({ to, weight });
    adjacency.set(from, list);
  };

  graph.edges.forEach((edge) => {
    const fromNode = nodes.get(edge.from);
    const toNode = nodes.get(edge.to);
    if (!fromNode || !toNode) return;
    const weight =
      edge.weight ??
      haversineDistance([fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]);
    pushEdge(edge.from, edge.to, weight);
    if (!graph.directed) {
      pushEdge(edge.to, edge.from, weight);
    }
  });

  return { nodes, adjacency };
}

function nearestNodeId(nodes: RouteGraphNode[], point: LatLngTuple) {
  let bestId = nodes[0]?.id ?? "";
  let bestDistance = Number.POSITIVE_INFINITY;
  nodes.forEach((node) => {
    const distance = haversineDistance(point, [node.lat, node.lng]);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestId = node.id;
    }
  });
  return bestId;
}

function dijkstraPath(graph: RouteGraph, startId: string, endId: string) {
  const { nodes, adjacency } = buildAdjacency(graph);
  const distances = new globalThis.Map<string, number>();
  const previous = new globalThis.Map<string, string | null>();
  const visited = new Set<string>();

  nodes.forEach((_: RouteGraphNode, id: string) => {
    distances.set(id, Number.POSITIVE_INFINITY);
    previous.set(id, null);
  });
  distances.set(startId, 0);

  while (visited.size < nodes.size) {
    let current: string | null = null;
    let best = Number.POSITIVE_INFINITY;
    distances.forEach((value: number, id: string) => {
      if (visited.has(id)) return;
      if (value < best) {
        best = value;
        current = id;
      }
    });

    if (!current) break;
    if (current === endId) break;
    const currentId = current;
    visited.add(currentId);

    const neighbors = adjacency.get(currentId) ?? [];
    neighbors.forEach((edge: { to: string; weight: number }) => {
      if (visited.has(edge.to)) return;
      const next = (distances.get(currentId) ?? 0) + edge.weight;
      if (next < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(edge.to, next);
        previous.set(edge.to, currentId);
      }
    });
  }

  const path: string[] = [];
  let step: string | null = endId;
  while (step) {
    path.unshift(step);
    step = previous.get(step) ?? null;
  }
  return path;
}

function RouteLayer({
  enabled = true,
  provider = "osrm",
  from,
  to,
  path,
  fallbackPath,
  graph,
  osrmProfile = "driving",
  osrmBaseUrl = "https://router.project-osrm.org",
  osrmAlternatives,
  osrmStrategy = "fastest",
  osrmTimeoutMs = 6000,
  snapToMarkers = true,
  snapToleranceMeters = 35,
  polylineOptions,
  alternativesOptions,
  showAlternatives = false,
  onStatusChange,
  onRoutePathChange,
}: RouteLayerProps) {
  const [routePath, setRoutePath] = useState<LatLngTuple[]>(
    path ?? fallbackPath ?? [from, to]
  );
  const [alternativePaths, setAlternativePaths] = useState<LatLngTuple[][]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const lastGoodRouteRef = useRef<LatLngTuple[] | null>(null);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  useEffect(() => {
    if (routePath.length) {
      onRoutePathChange?.(routePath);
    }
  }, [routePath, onRoutePathChange]);

  useEffect(() => {
    if (!enabled) return;

    if (provider === "custom") {
      setRoutePath(path ?? fallbackPath ?? [from, to]);
      setStatus("idle");
      return;
    }

    if (provider === "dijkstra") {
      if (!graph || graph.nodes.length === 0) {
        setRoutePath(fallbackPath ?? [from, to]);
        setStatus("error");
        return;
      }
      const startId = nearestNodeId(graph.nodes, from);
      const endId = nearestNodeId(graph.nodes, to);
      const nodePath = dijkstraPath(graph, startId, endId);
      if (!nodePath.length) {
        setRoutePath(fallbackPath ?? [from, to]);
        setStatus("error");
        return;
      }
      const coords = nodePath
        .map((id) => graph.nodes.find((node) => node.id === id))
        .filter(Boolean)
        .map((node) => [node!.lat, node!.lng] as LatLngTuple);
      setRoutePath(coords);
      setStatus("idle");
      return;
    }

    if (provider === "osrm") {
      const normalizedProfile =
        osrmProfile === "walking"
          ? "foot"
          : osrmProfile === "cycling"
            ? "bike"
            : osrmProfile;
      const profileCandidates = Array.from(
        new Set([
          normalizedProfile,
          osrmProfile,
          normalizedProfile === "foot" || normalizedProfile === "bike"
            ? "driving"
            : "driving",
        ])
      );
      const start = `${from[1]},${from[0]}`;
      const end = `${to[1]},${to[0]}`;
      const alternatives =
        osrmAlternatives === undefined
          ? ""
          : `&alternatives=${osrmAlternatives === true ? "true" : osrmAlternatives}`;
      let active = true;
      const controllers: AbortController[] = [];
      setStatus("loading");

      const fetchRoutes = async (profile: string) => {
        const controller = new AbortController();
        controllers.push(controller);
        const timeoutId =
          osrmTimeoutMs > 0
            ? setTimeout(() => controller.abort(), osrmTimeoutMs)
            : null;
        const url = `${osrmBaseUrl}/route/v1/${profile}/${start};${end}?overview=full&geometries=geojson${alternatives}`;
        const response = await fetch(url, { signal: controller.signal });
        if (timeoutId) clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`OSRM ${profile} error ${response.status}`);
        const payload = await response.json();
        const routes = Array.isArray(payload?.routes) ? payload.routes : [];
        if (!routes.length) throw new Error(`OSRM ${profile} returned no routes`);
        return routes;
      };

      (async () => {
        let routes: any[] | null = null;
        for (const profile of profileCandidates) {
          try {
            routes = await fetchRoutes(profile);
            break;
          } catch {
            if (!active) return;
          }
        }
        if (!routes) throw new Error("No OSRM routes available");

        const getMetric = (route: any) => {
          if (typeof route?.distance === "number") return route.distance;
          if (typeof route?.duration === "number") return route.duration;
          if (typeof route?.weight === "number") return route.weight;
          return Number.POSITIVE_INFINITY;
        };
        const selectedRoute =
          osrmStrategy === "shortest"
            ? routes.reduce((best: any, route: any) => {
                if (!best) return route;
                return getMetric(route) < getMetric(best) ? route : best;
              }, null)
            : routes[0];
        const coords: [number, number][] =
          selectedRoute?.geometry?.coordinates ?? [];
        if (!coords.length) throw new Error("No route coordinates");
        let converted = coords.map(
          ([lng, lat]: [number, number]) => [lat, lng] as LatLngTuple
        );
        if (snapToMarkers) {
          const startDistance = haversineDistance(converted[0], from);
          const endDistance = haversineDistance(
            converted[converted.length - 1],
            to
          );
          if (startDistance > snapToleranceMeters) {
            converted = [from, ...converted];
          }
          if (endDistance > snapToleranceMeters) {
            converted = [...converted, to];
          }
        }
        const maxAlt =
          typeof showAlternatives === "number" ? showAlternatives : 0;
        const altCount = Math.max(0, maxAlt);
        const altRoutes =
          altCount > 0
            ? routes
                .filter((route: any) => route !== selectedRoute)
                .slice(0, altCount)
            : [];
        const altPaths = altRoutes.map((route: any) => {
          let altConverted = (route?.geometry?.coordinates ?? []).map(
            ([lng, lat]: [number, number]) => [lat, lng] as LatLngTuple
          );
          if (snapToMarkers && altConverted.length) {
            const startDistance = haversineDistance(altConverted[0], from);
            const endDistance = haversineDistance(
              altConverted[altConverted.length - 1],
              to
            );
            if (startDistance > snapToleranceMeters) {
              altConverted = [from, ...altConverted];
            }
            if (endDistance > snapToleranceMeters) {
              altConverted = [...altConverted, to];
            }
          }
          return altConverted;
        });
        if (active) {
          lastGoodRouteRef.current = converted;
          setRoutePath(converted);
          setAlternativePaths(altPaths);
          setStatus("idle");
        }
      })().catch((error) => {
        console.warn("[leaflet-kit] OSRM route failed.", error);
        if (active) {
          const fallback =
            fallbackPath ?? lastGoodRouteRef.current ?? [from, to];
          setRoutePath(fallback);
          setAlternativePaths([]);
          setStatus("error");
        }
      });

      return () => {
        active = false;
        controllers.forEach((controller) => controller.abort());
      };
    }
  }, [
    enabled,
    provider,
    from,
    to,
    path,
    fallbackPath,
    graph,
    osrmProfile,
    osrmBaseUrl,
    osrmAlternatives,
    osrmStrategy,
    osrmTimeoutMs,
    snapToMarkers,
    snapToleranceMeters,
    showAlternatives,
  ]);

  if (!enabled) return null;

  return (
    <>
      {alternativePaths.map((altPath, index) => (
        <PolylineLayer
          key={`alt-${index}`}
          path={altPath}
          options={{
            color: "#94a3b8",
            weight: 3,
            opacity: 0.6,
            dashArray: "6 8",
            ...alternativesOptions,
          }}
        />
      ))}
      <PolylineLayer
        path={routePath}
        options={{
          color: "#3b82f6",
          weight: 4,
          opacity: 0.9,
          ...polylineOptions,
        }}
      />
    </>
  );
}

function HeatLayer({ points, options, enabled = true }: HeatLayerProps) {
  const { map } = useMapContext();
  const { ready } = useLeafletPlugin("heat", enabled);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !enabled || !ready) return;

    const heatFactory = (L as any).heatLayer;
    if (!heatFactory) {
      warnMissingPlugin("heat");
      return;
    }

    const layer = heatFactory(points, options);
    layerRef.current = layer;
    layer.addTo(map);

    return () => {
      layer.remove();
      layerRef.current = null;
    };
  }, [map, enabled, ready, options]);

  useEffect(() => {
    if (!layerRef.current) return;
    layerRef.current.setLatLngs(points);
  }, [points]);

  return null;
}

type VectorTileLayerProps = {
  url: string;
  options?: Record<string, unknown>;
  enabled?: boolean;
};

function VectorTileLayer({
  url,
  options,
  enabled = true,
}: VectorTileLayerProps) {
  const { map } = useMapContext();
  const { ready } = useLeafletPlugin("vectorgrid", enabled);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !enabled || !ready) return;

    const vectorGrid = (L as any).vectorGrid;
    if (!vectorGrid?.protobuf) {
      warnMissingPlugin("vectorgrid");
      return;
    }

    const layer = vectorGrid.protobuf(url, options ?? {});
    layerRef.current = layer;
    layer.addTo(map);

    return () => {
      layer.remove();
      layerRef.current = null;
    };
  }, [map, enabled, ready, url, options]);

  return null;
}

type MarkerClusterGroupProps = {
  children?: ReactNode;
  options?: Record<string, unknown>;
  enabled?: boolean;
};

function MarkerClusterGroup({
  children,
  options,
  enabled = true,
}: MarkerClusterGroupProps) {
  const { map } = useMapContext();
  const { ready } = useLeafletPlugin("markercluster", enabled);
  const [clusterGroup, setClusterGroup] = useState<any>(null);

  useEffect(() => {
    if (!map || !enabled || !ready) return;

    const factory = (L as any).markerClusterGroup;
    if (!factory) {
      warnMissingPlugin("markercluster");
      return;
    }

    const group = factory(options ?? {});
    setClusterGroup(group);
    group.addTo(map);

    return () => {
      group.remove();
      setClusterGroup(null);
    };
  }, [map, enabled, ready, options]);

  if (!clusterGroup) return null;

  return (
    <LayerContext.Provider value={clusterGroup}>
      {children}
    </LayerContext.Provider>
  );
}

type DrawControlProps = {
  options?: Record<string, unknown>;
  enabled?: boolean;
  onCreated?: (event: any) => void;
  onEdited?: (event: any) => void;
  onDeleted?: (event: any) => void;
};

function DrawControl({
  options,
  enabled = true,
  onCreated,
  onEdited,
  onDeleted,
}: DrawControlProps) {
  const { map } = useMapContext();
  const { ready } = useLeafletPlugin("draw", enabled);
  const controlRef = useRef<any>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (!map || !enabled || !ready) return;

    const ControlDraw = (L as any).Control?.Draw;
    if (!ControlDraw) {
      warnMissingPlugin("draw");
      return;
    }

    const drawnItems = new L.FeatureGroup();
    drawnItems.addTo(map);
    drawnItemsRef.current = drawnItems;

    const control = new ControlDraw({
      edit: { featureGroup: drawnItems },
      ...options,
    });
    controlRef.current = control;
    map.addControl(control);

    if (onCreated) map.on("draw:created", onCreated);
    if (onEdited) map.on("draw:edited", onEdited);
    if (onDeleted) map.on("draw:deleted", onDeleted);

    return () => {
      if (onCreated) map.off("draw:created", onCreated);
      if (onEdited) map.off("draw:edited", onEdited);
      if (onDeleted) map.off("draw:deleted", onDeleted);
      map.removeControl(control);
      drawnItems.remove();
      controlRef.current = null;
      drawnItemsRef.current = null;
    };
  }, [map, enabled, ready, options, onCreated, onEdited, onDeleted]);

  return null;
}

type MapPluginProps = {
  plugin: (map: LeafletMap) => void | (() => void);
  enabled?: boolean;
};

function MapPlugin({ plugin, enabled = true }: MapPluginProps) {
  const { map } = useMapContext();

  useEffect(() => {
    if (!map || !enabled) return;
    const cleanup = plugin(map);
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [map, enabled, plugin]);

  return null;
}

type ControlProps =
  | {
      type: "zoom";
      position?: L.ControlPosition;
      options?: L.Control.ZoomOptions;
    }
  | {
      type: "scale";
      position?: L.ControlPosition;
      options?: L.Control.ScaleOptions;
    }
  | {
      type: "attribution";
      position?: L.ControlPosition;
      options?: L.Control.AttributionOptions;
    };

function Control(props: ControlProps) {
  const map = useMap();
  const controlRef = useRef<L.Control | null>(null);

  useEffect(() => {
    let control: L.Control | null = null;

    if (props.type === "zoom") {
      control = L.control.zoom({
        position: props.position,
        ...(props.options ?? {}),
      });
    }

    if (props.type === "scale") {
      control = L.control.scale({
        position: props.position,
        ...(props.options ?? {}),
      });
    }

    if (props.type === "attribution") {
      control = L.control.attribution({
        position: props.position,
        ...(props.options ?? {}),
      });
    }

    if (!control) return;

    controlRef.current = control;
    control.addTo(map);

    return () => {
      control.remove();
      controlRef.current = null;
    };
  }, [map, props]);

  return null;
}



function createDivIcon(options?: L.DivIconOptions) {
  return L.divIcon(options);
}

export {
  Map,
  TileLayer,
  Marker,
  MarkerLayer,
  GeoJSONLayer,
  HeatLayer,
  PolylineLayer,
  RouteLayer,
  VectorTileLayer,
  MarkerClusterGroup,
  DrawControl,
  MapPlugin,
  Source,
  Layer,
  Control,
  createDivIcon,
  registerLeafletPlugin,
  useMap,
  useLeafletPlugin,
};

export type {
  LatLngTuple,
  MapProps,
  TileLayerProps,
  MarkerProps,
  MarkerLayerProps,
  GeoJSONLayerProps,
  GeoJSONSourceInput,
  HeatPoint,
  HeatLayerProps,
  PolylineLayerProps,
  RouteLayerProps,
  VectorTileLayerProps,
  MarkerClusterGroupProps,
  DrawControlProps,
  MapPluginProps,
  SourceProps,
  LayerProps,
  ControlProps,
  LeafletPluginName,
  LeafletPluginSpec,
  AdvancedGISConfig,
  AdvancedGISState,
  RouteProvider,
  RouteGraph,
  RouteGraphNode,
  RouteGraphEdge,
};
