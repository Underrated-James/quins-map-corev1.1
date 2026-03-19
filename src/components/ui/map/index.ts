// ─── Quins Map ─────────────────────────────────────────────────────
// The accessible, modular, modern map system for React
// Built on MapLibre GL · Styled with Tailwind CSS
// ────────────────────────────────────────────────────────────────────

// ── Core ───────────────────────────────────────────────────────────
export { MapCanvas, MapSkeleton } from "./MapCanvas";
export { useMap } from "./context";
export { useViewport, useMapEvents, useResolvedTheme } from "./hooks";
export { tilePresets, defaultStyles } from "./themes";

// ── Markers ────────────────────────────────────────────────────────
export { MapMarker, MarkerContent, MarkerLabel } from "./MapMarker";

// ── Popups & Tooltips ──────────────────────────────────────────────
export { MapPopup, MarkerPopup, MarkerTooltip } from "./MapPopup";
export { BusinessCardPopup } from "./BusinessCardPopup";

// ── Controls ───────────────────────────────────────────────────────
export {
  MapControls,
  ZoomControl,
  CompassControl,
  LocateMeButton,
  FullscreenControl,
  MapThemeSwitcher,
  ControlGroup,
  ControlButton,
} from "./MapControls";

// ── Layers ─────────────────────────────────────────────────────────
export { MapRoute } from "./MapRoute";
export { MapClusterLayer } from "./MapClusterLayer";
export { GeoJSONLayer } from "./GeoJSONLayer";
export { HeatmapLayer } from "./HeatmapLayer";

// ── Shapes ─────────────────────────────────────────────────────────
export { Circle, Polygon, Polyline } from "./MapShapes";

// ── Performance ────────────────────────────────────────────────────
export { SmartMarkers } from "./SmartMarkers";

// ── States ─────────────────────────────────────────────────────────
export { MapLoadingState, MapErrorFallback, MapErrorBoundary } from "./MapStates";

// ── Layouts ────────────────────────────────────────────────────────
export { MapSidebarLayout, MarkerListSync } from "./MapSidebarLayout";
export { BottomSheetMap } from "./BottomSheetMap";
export { SearchPlacesPanel } from "./SearchPlacesPanel";

// ── Real-world ─────────────────────────────────────────────────────
export { RoutePreview } from "./RoutePreview";
export { GeofenceEditor } from "./GeofenceEditor";
export { LiveTracker } from "./LiveTracker";

// ── Accessibility ──────────────────────────────────────────────────
export {
  ReducedMotionProvider,
  AccessibleLegend,
  HighContrastMapTheme,
  highContrastStyles,
  ColorblindSafeMarker,
  colorblindSafePalette,
  FocusMarkerNavigator,
} from "./a11y";

// ── Types ──────────────────────────────────────────────────────────
export type {
  MapViewport, LngLat, Theme, MapStyleOption, MapRef, A11yProps,
} from "./types";
export type { MapCanvasProps } from "./MapCanvas";
export type { MapMarkerProps, MarkerContentProps, MarkerLabelProps } from "./MapMarker";
export type { MapPopupProps, MarkerPopupProps, MarkerTooltipProps } from "./MapPopup";
export type {
  MapControlsProps, ZoomControlProps, CompassControlProps,
  LocateMeButtonProps, FullscreenControlProps, MapThemeSwitcherProps,
} from "./MapControls";
export type { MapRouteProps } from "./MapRoute";
export type { MapClusterLayerProps } from "./MapClusterLayer";
export type { GeoJSONLayerProps } from "./GeoJSONLayer";
export type { HeatmapLayerProps } from "./HeatmapLayer";
export type { CircleProps, PolygonProps, PolylineProps } from "./MapShapes";
export type { SmartMarkersProps, RenderMode } from "./SmartMarkers";
export type { MapLoadingStateProps, MapErrorFallbackProps, MapErrorBoundaryProps } from "./MapStates";
export type { MapSidebarLayoutProps, MarkerListSyncProps, MarkerItem } from "./MapSidebarLayout";
export type { BottomSheetMapProps, SnapPoint } from "./BottomSheetMap";
export type { SearchPlacesPanelProps, SearchResult } from "./SearchPlacesPanel";
export type { RoutePreviewProps, RouteInfo, RouteProfile } from "./RoutePreview";
export type { GeofenceEditorProps, GeofenceZone } from "./GeofenceEditor";
export type { LiveTrackerProps, TrackerPosition } from "./LiveTracker";
export type { BusinessCardPopupProps } from "./BusinessCardPopup";
export type {
  ReducedMotionProviderProps, AccessibleLegendProps, LegendItem,
  HighContrastMapThemeProps, ColorblindMarkerProps, FocusMarkerNavigatorProps,
} from "./a11y";
