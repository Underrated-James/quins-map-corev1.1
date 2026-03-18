# Leaflet Kit (Polished API)

This project now includes a curated Leaflet-based React API with defaults, layers, controls, async GeoJSON, clustering, and plugin auto-loading.

## Install

```bash
pnpm add leaflet @types/leaflet
```

Optional plugins (only needed if you use these features):

```bash
pnpm add leaflet.heat leaflet.vectorgrid leaflet.markercluster leaflet-draw leaflet-routing-machine
```

Make sure Leaflet CSS is imported once:

```ts
// src/main.tsx
import 'leaflet/dist/leaflet.css'
```

## Quick Start

```tsx
import { Map } from './components/ui/map'

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Map />
    </div>
  )
}
```

### Built-in Size Props

You can set size directly on `Map`. If not provided, it fills the parent.

```tsx
<Map width={420} height={280} />
```

Works with responsive sizes too:

```tsx
<Map width="100%" height="320px" />
```

### Border Radius

`Map` has a default rounded corner. You can override or disable it:

```tsx
<Map borderRadius={0} />
```

## StoreMap (Ecommerce-Style Wrapper)

`StoreMap` is a domain-friendly wrapper that renders a clean ecommerce map by default
(dark tiles, store markers, and routes) while keeping GIS layers optional.

```tsx
import StoreMap from './components/StoreMap'

const stores = [
  { id: 's1', name: 'Manila Center', lat: 14.5995, lng: 120.9842 },
  { id: 's2', name: 'Intramuros', lat: 14.5896, lng: 120.9747 },
]

const routes = [
  {
    id: 'r1',
    path: [
      [14.5995, 120.9842],
      [14.5942, 120.9926],
      [14.5896, 120.9747],
    ],
  },
]

<StoreMap
  stores={stores}
  routes={routes}
  features={{ clustering: true, routes: true }}
/>;
```

Optional GIS layers stay off unless enabled:

```tsx
<StoreMap
  stores={stores}
  routes={routes}
  features={{ labels: true, heatmap: true, geojson: true }}
  geojsonData="/data/zone.json"
  heatPoints={[
    [14.5995, 120.9842, 0.8],
    [14.604, 120.989, 0.6],
  ]}
/>
```

## Official API

**Core**
- `Map` — base map with safe defaults
- `useMap()` — access the Leaflet map instance

**Markers**
- `Marker` — single marker with popup and custom content
- `MarkerLayer` — marker list with clustering by default

**Layers and Sources**
- `TileLayer` — add a tile layer
- `GeoJSONLayer` — render GeoJSON (supports async data)
- `PolylineLayer` — route lines
- `Source` — async GeoJSON source
- `Layer` — Leaflet-like layer wrapper for `Source`

**Controls**
- `Control` — built-in controls (`zoom`, `scale`, `attribution`)

**Plugins**
- `HeatLayer` — heat maps (leaflet.heat)
- `VectorTileLayer` — vector tiles (leaflet.vectorgrid)
- `MarkerClusterGroup` — clustering group (leaflet.markercluster)
- `DrawControl` — drawing tools (leaflet-draw)
- `RoutingControl` — routing (leaflet-routing-machine)
- `MapPlugin` — custom plugin hook
- `registerLeafletPlugin` — override/extend plugin loaders
- `useLeafletPlugin` — auto-load plugins safely
- `StoreMap` — ecommerce wrapper with optional GIS features

## Map Defaults

`Map` works without props. Defaults:
- `center` = `[14.5995, 120.9842]`
- `zoom` = `13`
- Default dark tiles (Carto Dark, no labels) with labels overlay enabled

### Advanced GIS Toggle

If you pass `advancedGIS={true}`, a small GIS widget appears on the map.
It lets users turn on optional layers (labels, GeoJSON, heatmap, vector tiles)
only when data is provided.

```tsx
<Map
  center={[14.5995, 120.9842]}
  zoom={13}
  advancedGIS
  advancedGISConfig={{
    geojson: '/data/zone.json',
    heatPoints: [
      [14.5995, 120.9842, 0.8],
      [14.604, 120.989, 0.6],
    ],
    heatOptions: {
      gradient: { 0.4: '#22c55e', 0.7: '#facc15', 1.0: '#ef4444' },
    },
  }}
/>
```

Disable default tiles if you want full control:

```tsx
<Map defaultTiles={false}>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
</Map>
```

## Custom Marker (React Content)

```tsx
<Marker
  position={[14.5995, 120.9842]}
>
  <div className="custom-pin">
    <div className="pin-core" />
  </div>
</Marker>
```

## MarkerLayer with Clustering by Default

```tsx
<MarkerLayer
  data={places}
  getPosition={(p) => p.position}
  renderMarker={(p) => (
    <div className="custom-pin">
      <div className="pin-core" />
    </div>
  )}
/>
```

Clustering auto-activates if `leaflet.markercluster` is installed. If not, it gracefully falls back to normal markers.

## Async GeoJSON Loading

```tsx
const loadGeoJSON = async () => {
  const res = await fetch('/data/area.json')
  return res.json()
}

<Source data={loadGeoJSON}>
  <Layer style={{ color: '#111', weight: 2, fillOpacity: 0.08 }} />
</Source>
```

You can also pass a URL directly:

```tsx
<GeoJSONLayer data="/data/area.json" />
```

## React‑Leaflet‑Like Composition

```tsx
<Map>
  <Control type="scale" position="bottomleft" />
  <Source data={loadGeoJSON}>
    <Layer />
  </Source>
</Map>
```

## Events

`Map` supports standard Leaflet events:
- `onClick`
- `onDblClick`
- `onContextMenu`
- `onMouseMove`
- `onMouseDown`
- `onMouseUp`
- `onMove`
- `onMoveStart`
- `onMoveEnd`
- `onZoom`
- `onZoomStart`
- `onZoomEnd`
- `onViewChange`

## Plugin Auto-Loading

Plugin components call `useLeafletPlugin()` internally. If a plugin is installed, it auto-loads. If not, it warns once and falls back safely.

You can override plugin loaders:

```ts
import { registerLeafletPlugin } from './components/ui/map'

registerLeafletPlugin('heat', { module: 'leaflet.heat' })
```
