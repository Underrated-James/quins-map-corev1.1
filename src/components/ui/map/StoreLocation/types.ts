import type { ReactNode } from "react";
import type { MapProps } from "../Map";
import type { MapControlsProps } from "../MapControls";

// ── Controls ──
export type StoreMapControlsConfig = Omit<MapControlsProps, "position"> & {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  enabled?: boolean;
};

// ── Markers ──
export type StoreMarkerPopupConfig = {
  image?: string;
  category?: string;
  name: string;
  rating?: number;
  reviews?: number;
  hours?: string;
  onDirectionsClick?: () => void;
  onExternalLinkClick?: () => void;
};

export type StoreMarkerConfig = {
  id: string | number;
  lat: number;
  lng: number;
  /** Custom label beneath the marker */
  label?: string;
  /** Simple tooltip text */
  tooltip?: string;
  /** Simple ReactNode popup */
  popup?: ReactNode;
  /** Rich popup card config */
  richPopup?: StoreMarkerPopupConfig;
  /** Custom marker icon/dot renderer */
  renderIcon?: () => ReactNode;
};

// ── Draggable Marker (Admin) ──
export type StoreDraggableMarkerConfig = {
  enabled?: boolean;
  lat: number;
  lng: number;
  onLocationChange?: (location: { lat: number; lng: number }) => void;
};

// ── Static Route ──
export type StoreRouteConfig = {
  id?: string;
  coordinates: [number, number][]; // [lng, lat][]
  color?: string;
  width?: number;
  opacity?: number;
};

// ── Dynamic OSRM Route ──
export type StoreDynamicRouteConfig = {
  enabled?: boolean;
  waypoints: [number, number][]; // Array of [lng, lat] coordinate points
  color?: string;
  width?: number;
  showFastestBadge?: boolean;
  showAlternatives?: boolean;
  startLabel?: string;
  endLabel?: string;
  /** Custom router URL. Defaults to public OSRM matching '/route/v1/...'. Example: 'https://router.project-osrm.org' */
  osrmUrl?: string;
};

// ── Clustering ──
export type StoreClusterConfig = {
  enabled?: boolean;
  data: GeoJSON.FeatureCollection<GeoJSON.Point>;
  clusterColors?: [string, string, string];
  pointColor?: string;
  onPointClick?: (feature: GeoJSON.Feature<GeoJSON.Point>, coords: [number, number]) => void;
};

// ── Layer Markers (High Perf) ──
export type StoreLayerMarkersConfig = {
  enabled?: boolean;
  data: GeoJSON.FeatureCollection<GeoJSON.Point>;
  pointColor?: string;
  pointRadius?: number;
  onPointClick?: (feature: GeoJSON.Feature<GeoJSON.Point>, coords: [number, number]) => void;
};

// ── Custom GeoJSON Layers ──
export type StoreCustomLayerConfig = {
  id: string;
  data: GeoJSON.GeoJSON | string;
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  onClick?: (feature: GeoJSON.Feature, coords: [number, number]) => void;
  onMouseEnter?: (feature: GeoJSON.Feature) => void;
  onMouseLeave?: () => void;
};

// ── Main Props ──
export interface StoreLocationProps extends Omit<MapProps, "children"> {
  controls?: StoreMapControlsConfig | boolean;
  markers?: StoreMarkerConfig[];
  draggableMarker?: StoreDraggableMarkerConfig;
  route?: StoreRouteConfig;
  dynamicRoute?: StoreDynamicRouteConfig;
  cluster?: StoreClusterConfig;
  advancedView?: boolean;
  customLayers?: StoreCustomLayerConfig[];
  layerMarkers?: StoreLayerMarkersConfig;
  /** Pass additional map children strictly when necessary, though config API is preferred */
  children?: ReactNode;
  /** Re-positions standard MapLibre attribution */
  attributionPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}
