import {
  GeoJSONLayer,
  HeatLayer,
  MarkerLayer,
  Map,
  PolylineLayer,
  RouteLayer,
  TileLayer,
  VectorTileLayer,
  type GeoJSONSourceInput,
  type HeatPoint,
  type LatLngTuple,
  type RouteGraph,
  type RouteProvider,
} from './ui/map'

type Store = {
  id: string
  name: string
  lat: number
  lng: number
}

type Route = {
  id: string
  path: LatLngTuple[]
}

type StoreMapFeatures = {
  clustering?: boolean
  heatmap?: boolean
  geojson?: boolean
  vectorTiles?: boolean
  labels?: boolean
  routes?: boolean
}

type StoreMapProps = {
  stores: Store[]
  routes?: Route[]
  routeEnabled?: boolean
  routeProvider?: RouteProvider
  routeFrom?: LatLngTuple
  routeTo?: LatLngTuple
  routePath?: LatLngTuple[]
  routeGraph?: RouteGraph
  routeFallbackPath?: LatLngTuple[]
  routeOsrmProfile?: 'driving' | 'walking' | 'cycling'
  routeOsrmBaseUrl?: string
  routeOsrmAlternatives?: boolean | number
  routeOsrmStrategy?: 'fastest' | 'shortest'
  center?: LatLngTuple
  zoom?: number
  isLoading?: boolean
  features?: StoreMapFeatures
  geojsonData?: GeoJSONSourceInput
  heatPoints?: HeatPoint[]
  vectorTileUrl?: string
  tileUrl?: string
  labelsUrl?: string
}

const DEFAULT_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const DEFAULT_LABELS_URL =
  'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png'

function StoreMap({
  stores,
  routes,
  routeEnabled = false,
  routeProvider = 'osrm',
  routeFrom,
  routeTo,
  routePath,
  routeGraph,
  routeFallbackPath,
  routeOsrmProfile,
  routeOsrmBaseUrl,
  routeOsrmAlternatives,
  routeOsrmStrategy,
  center,
  zoom,
  isLoading = false,
  features,
  geojsonData,
  heatPoints,
  vectorTileUrl,
  tileUrl = DEFAULT_TILE_URL,
  labelsUrl = DEFAULT_LABELS_URL,
}: StoreMapProps) {
  const showRoutes = features?.routes ?? true
  const clustering = features?.clustering ?? true
  const canRoute = Boolean(routeFrom && routeTo)

  return (
    <div className="store-map">
      {isLoading && <div className="store-map__loading">Loading map…</div>}
      <Map center={center} zoom={zoom} defaultTiles={false}>
        <TileLayer url={tileUrl} />

        {features?.labels && (
          <TileLayer url={labelsUrl} options={{ opacity: 0.9 }} />
        )}

        <MarkerLayer
          data={stores}
          cluster={clustering}
          getPosition={(store) => [store.lat, store.lng]}
          renderMarker={() => (
            <div className="store-pin">
              <div className="store-pin__core" />
            </div>
          )}
          popup={(store) => (
            <div className="text-sm">
              {store.name}
              <div className="text-xs text-neutral-600">
                {store.lat.toFixed(4)}, {store.lng.toFixed(4)}
              </div>
            </div>
          )}
        />

        {routeEnabled && canRoute ? (
          <RouteLayer
            from={routeFrom as LatLngTuple}
            to={routeTo as LatLngTuple}
            provider={routeProvider}
            path={routePath}
            graph={routeGraph}
            fallbackPath={routeFallbackPath}
            osrmProfile={routeOsrmProfile}
            osrmBaseUrl={routeOsrmBaseUrl}
            osrmAlternatives={routeOsrmAlternatives}
            osrmStrategy={routeOsrmStrategy}
            polylineOptions={{ color: '#4f8bff', weight: 4, opacity: 0.9 }}
          />
        ) : (
          showRoutes &&
          routes?.map((route) => (
            <PolylineLayer
              key={route.id}
              path={route.path}
              options={{ color: '#4f8bff', weight: 4, opacity: 0.9 }}
            />
          ))
        )}

        {features?.geojson && geojsonData && (
          <GeoJSONLayer
            data={geojsonData}
            style={{ color: '#0f172a', weight: 2, fillOpacity: 0.1 }}
          />
        )}

        {features?.heatmap && heatPoints && <HeatLayer points={heatPoints} />}

        {features?.vectorTiles && vectorTileUrl && (
          <VectorTileLayer url={vectorTileUrl} />
        )}
      </Map>
    </div>
  )
}

export default StoreMap
export type { Store, Route, StoreMapFeatures, StoreMapProps }
