# Quins-map

Quins-map is an elite, highly optimized, and fully declarative mapping ecosystem for React, built natively on top of MapLibre GL. 

It is designed to be **lightweight**, **accessible**, **production-ready**, and **developer-friendly**, providing an arsenal of advanced GIS features—from clustering and dynamic OSRM routing to accessible screen-reader bindings—all strictly optimized for zero-overhead tree-shaking and immediate VDOM integrations.

---

## 🚀 Quick Start

### Installation

```bash
npm install maplibre-gl lucide-react underrated-didyeey-quins-map
```

Ensure you import the native MapLibre core CSS and the library stylesheet in your layout or root entry:
```tsx
import 'maplibre-gl/dist/maplibre-gl.css'
import 'underrated-didyeey-quins-map/style.css'
import { Map } from 'underrated-didyeey-quins-map' 

function App() {
  return (
    <>
      <section id="center" style={{ width: '100vw', height: '60vh' }}>
        <Map
          center={[-74.006, 40.7128]}
          zoom={12}
        />
      </section>

    </>
  )
}

export default App 
```

To ensure your map renders with the correct dimensions, add the following utility classes to your global CSS (e.g., `index.css`):

```css
.relative {
  position: relative;
}

.w-full {
  width: 100%;
}

.h-full {
  height: 100%;
}
```

---

## 🌍 The `StoreLocation` Declarative API

`<StoreLocation />` is a hyper-optimized wrapper interface. It prevents GPU memory leaks, destroys inactive layers, handles all WebGL context bindings safely behind the scenes, and mounts MapLibre securely.

Here are the diverse ways to configure `<StoreLocation />` sequentially based on your application's needs:

### 1. Basic Uncontrolled Map
Extremely simple and intuitive right out of the box. Uncontrolled but declarative.
```tsx
import { StoreLocation } from '@/components/ui/map';

<StoreLocation 
  center={[-74.006, 40.7128]} 
  zoom={12} 
/>
```

### 2. Fully Controlled Map Viewport
Full control over the viewport state cleanly synced back to React state without forced remounts.
```tsx
const [viewport, setViewport] = useState({ center: [-74.006, 40.7128], zoom: 8, bearing: 0, pitch: 0 });

<StoreLocation 
  viewport={viewport} 
  onViewportChange={setViewport} 
/>
```

### 3. Custom Tile Styles
Bring your own map styles dynamically (support for OpenStreetMap, Carto, Maptiler, etc.).
```tsx
<StoreLocation
  center={[-0.1276, 51.5074]}
  zoom={15}
  styles={{
    light: "https://tiles.openfreemap.org/styles/bright",
    dark: "https://tiles.openfreemap.org/styles/liberty"
  }}
/>
```

### 4. Interactive Map Controls
Easily composite MapLibre HUD controls.
```tsx
<StoreLocation
  center={[2.3522, 48.8566]}
  zoom={11}
  controls={{
    enabled: true,
    position: "bottom-right",
    showZoom: true,
    showCompass: true,
    showLocate: true,
  }}
/>
```

### 5. Standard Interactive Markers
Array of DOM markers supporting native tooltip overlays.
```tsx
<StoreLocation
  center={[-73.98, 40.76]}
  zoom={12}
  markers={[
    { 
      id: "es", 
      lng: -73.9857, 
      lat: 40.7484, 
      tooltip: "Empire State Building" 
    }
  ]}
/>
```

### 6. Rich Popup Architecture
Generate beautiful, stylized, and standardized popup cards automatically by supplying raw data.
```tsx
<StoreLocation
  center={[-73.98, 40.74]}
  zoom={11}
  markers={[
    {
      id: 1,
      lng: -73.9632,
      lat: 40.7794,
      richPopup: {
        name: "Art Museum",
        category: "Museum",
        rating: 4.8,
        reviews: 12453,
        hours: "10:00 AM - 5:00 PM",
        image: "https://url.to/image.jpg",
        onDirectionsClick: () => alert("Navigating...")
      }
    }
  ]}
/>
```

### 7. Draggable Marker State (Admin mode)
Isolate heavy drag interactions to safely update backend coordinates without impacting sibling layers.
```tsx
const [location, setLocation] = useState({ lng: -73.98, lat: 40.75 });

<StoreLocation
  draggableMarker={{
    enabled: true,
    lat: location.lat,
    lng: location.lng,
    onLocationChange: setLocation
  }}
/>
```

### 8. Native Coordinate Plotting (Route)
Render raw, explicit geometric vectors safely. Great for plane tracking or static boundaries.
```tsx
<StoreLocation
  route={{
    coordinates: [
      [-73.9857, 40.7484],
      [-73.9855, 40.758],
      [-73.9772, 40.7527]
    ],
    color: "#10b981",
    width: 6
  }}
/>
```

### 9. Dynamic OSRM Real-world Routing (Road-Aware)
Automatically hit public or private OSRM routing engines. Support for infinite coordinates (`waypoints`) snapping correctly to road geometry. Completely accessible with built-in ARIA roles and duration HUDs.
```tsx
<StoreLocation
  center={[-122.4194, 37.805]}
  zoom={11.5}
  dynamicRoute={{
    enabled: true,
    waypoints: [
      [-122.4783, 37.8199], // Golden Gate
      [-122.4182, 37.8080], // Fisherman's Wharf
      [-122.4058, 37.8024]  // Coit Tower
    ],
    showAlternatives: false,
    color: "#3b82f6",
    osrmUrl: "https://router.project-osrm.org" // Optional fallback
  }}
/>
```

### 10. High-Performance Client WebGL Clusters
Calculate and merge thousands of distinct map points effortlessly leveraging native GPU clustering.
```tsx
<StoreLocation
  cluster={{
    enabled: true,
    data: geojsonFeatureCollection,
    clusterColors: ["#3b82f6", "#f59e0b", "#ef4444"]
  }}
/>
```

### 11. GeoJSON Polygonal Overlays
Inject standard custom Polygons, delivery ranges, or sales territories seamlessly onto the canvas layer hierarchy.
```tsx
<StoreLocation
  customLayers={[
    {
      id: "zone-a",
      data: geojsonPolygon,
      fillColor: "#22c55e",
      strokeColor: "#16a34a",
      fillOpacity: 0.4,
      onMouseEnter: (e) => console.log("Entered Zone!", e)
    }
  ]}
/>
```

---

## 🛡 Ecosystem & Architecture Benefits

Quins-map completely redefines map usage for typical frontend teams:

- **Isolated Hooks:** Separation of bounds management (`useViewport`) and side-effects `useOsrmRoutes` strictly segregates memory allocations from view renders.
- **Tree-Shakable Interfaces:** Importing `<StoreLocation />` or a specialized HUD module leaves unrequested utilities entirely out of the Final Webpack/Vite bundle chunk.
- **A11y Forward:** Employs `<MarkerLabel>`, dynamic ARIA tracking, and focusability specifically required for enterprise and governmental tooling compliance.
- **Production CI-Grade:** Enforced typing strictness (zero standard `any` references) ensuring interface safety matching explicit GeoJSON generic types natively.

Enjoy zero constraints as you construct advanced geospatial components natively in React!
