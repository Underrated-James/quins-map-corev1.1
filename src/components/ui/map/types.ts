import type MapLibreGL from "maplibre-gl";

/** Map viewport state */
export type MapViewport = {
  /** Center coordinates [longitude, latitude] */
  center: [number, number];
  /** Zoom level */
  zoom: number;
  /** Bearing (rotation) in degrees */
  bearing: number;
  /** Pitch (tilt) in degrees */
  pitch: number;
};

/** Longitude/Latitude coordinate pair */
export type LngLat = [number, number];

/** Map theme */
export type Theme = "light" | "dark";

/** Map style — URL string or MapLibre style specification */
export type MapStyleOption = string | MapLibreGL.StyleSpecification;

/** Map instance ref type */
export type MapRef = MapLibreGL.Map;

/** Accessibility props available on interactive map components */
export type A11yProps = {
  /** Screen reader description for this element */
  ariaLabel?: string;
  /** Whether this element can receive keyboard focus via Tab (default: false) */
  keyboardFocusable?: boolean;
  /** ARIA role override (default varies by component) */
  role?: string;
};
