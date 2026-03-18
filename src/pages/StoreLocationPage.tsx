import { useState } from 'react'
import locationData from '../data/storeLocations.json'
import { Map, Marker, RouteLayer } from '../components/ui/map'

type LatLng = [number, number]

type StoreLocationData = {
  customer: { name: string; lat: number; lng: number }
  seller: { name: string; lat: number; lng: number }
  route: LatLng[]
  hotspots: Array<{ lat: number; lng: number; intensity: number }>
}

const data = locationData as StoreLocationData

function StoreLocationPage() {
  const center: LatLng = [data.customer.lat, data.customer.lng]
  const [mapInstance, setMapInstance] = useState<any>(null)
  const heatPoints = data.hotspots.map(
    (point) => [point.lat, point.lng, point.intensity] as [
      number,
      number,
      number
    ]
  )

  return (
    <div className="h-screen w-full">
      <Map
        center={center}
        width={500}
        height={500}
        zoom={17}
        showAttribution={false}
        advancedGIS={true}
        advancedGISConfig={{
          heatPoints,
        }}
        onReady={(map) => {
          setMapInstance(map)
        }}
      >
        <Marker
          position={center}
          label="Home"
          popup={<div>{data.customer.name}</div>}
        >
          <div className="customer-pin">
            <div className="customer-pin__core" />
          </div>
        </Marker>

        <Marker
          position={[data.seller.lat, data.seller.lng]}
          label="Store"
          popup={<div>{data.seller.name}</div>}
        >
          <div className="seller-pin">
            <div className="seller-pin__core" />
          </div>
        </Marker>

        <RouteLayer
          from={center}
          to={[data.seller.lat, data.seller.lng]}
          provider="osrm"
          osrmProfile="walking"
          osrmAlternatives={3}
          osrmStrategy="shortest"
          fallbackPath={data.route}
          polylineOptions={{ color: '#3b82f6', weight: 4, opacity: 0.9 }}
          onRoutePathChange={(path) => {
            if (!mapInstance || path.length < 2) return
            mapInstance.fitBounds(path, { padding: [80, 80] })
          }}
        />

      </Map>
    </div>
  )
}

export default StoreLocationPage
