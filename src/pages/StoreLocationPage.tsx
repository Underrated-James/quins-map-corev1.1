import { useState, useCallback } from "react";
import locationData from "../data/storeLocations.json";
import {
  MapCanvas,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapRoute,
  MapControls,
} from "../components/ui/map";

type LatLng = [number, number];

type StoreLocationData = {
  customer: { name: string; lat: number; lng: number };
  seller: { name: string; lat: number; lng: number };
  route: LatLng[];
  hotspots: Array<{ lat: number; lng: number; intensity: number }>;
};

const data = locationData as StoreLocationData;

// Convert [lat, lng] route to [lng, lat] for MapLibre
const routeCoordinates: [number, number][] = data.route.map(
  ([lat, lng]) => [lng, lat] as [number, number]
);

function StoreLocationPage() {
  const [showPopup, setShowPopup] = useState<"customer" | "seller" | null>(
    null
  );

  const customerPos: [number, number] = [data.customer.lng, data.customer.lat];
  const sellerPos: [number, number] = [data.seller.lng, data.seller.lat];

  const handleRouteReady = useCallback(() => {
    // Route is rendered — could trigger fitBounds or analytics here
  }, []);

  return (
    <div className="h-screen w-full">
      <MapCanvas
        center={customerPos}
        zoom={17}
        ariaLabel="Store locator map showing customer and seller locations"
      >
        <MapControls
          showZoom
          showCompass
          showLocate
          showFullscreen
        />

        {/* Customer Marker */}
        <MapMarker
          longitude={customerPos[0]}
          latitude={customerPos[1]}
          ariaLabel={`Customer location: ${data.customer.name}`}
          keyboardFocusable
          onClick={() =>
            setShowPopup(showPopup === "customer" ? null : "customer")
          }
        >
          <MarkerContent>
            <div className="relative h-5 w-5 rounded-full border-2 border-white bg-blue-500 shadow-lg ring-2 ring-blue-500/30" />
          </MarkerContent>
          {showPopup === "customer" && (
            <MarkerPopup closeButton>
              <div className="min-w-[140px]">
                <p className="font-semibold text-sm">{data.customer.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  📍 Customer Location
                </p>
              </div>
            </MarkerPopup>
          )}
        </MapMarker>

        {/* Seller Marker */}
        <MapMarker
          longitude={sellerPos[0]}
          latitude={sellerPos[1]}
          ariaLabel={`Store location: ${data.seller.name}`}
          keyboardFocusable
          onClick={() =>
            setShowPopup(showPopup === "seller" ? null : "seller")
          }
        >
          <MarkerContent>
            <div className="relative h-5 w-5 rounded-full border-2 border-white bg-emerald-500 shadow-lg ring-2 ring-emerald-500/30" />
          </MarkerContent>
          {showPopup === "seller" && (
            <MarkerPopup closeButton>
              <div className="min-w-[140px]">
                <p className="font-semibold text-sm">{data.seller.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  🏪 Store Location
                </p>
              </div>
            </MarkerPopup>
          )}
        </MapMarker>

        {/* Route Line */}
        <MapRoute
          coordinates={routeCoordinates}
          color="#3b82f6"
          width={4}
          opacity={0.9}
          onClick={handleRouteReady}
        />
      </MapCanvas>
    </div>
  );
}

export default StoreLocationPage;
