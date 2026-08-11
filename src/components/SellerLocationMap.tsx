/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from "react";
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap, useAdvancedMarkerRef } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { 
  MapPin, 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  Navigation, 
  Layers, 
  Store, 
  Info, 
  Filter, 
  Compass,
  Key,
  ExternalLink,
  ChevronRight
} from "lucide-react";

interface Distributor {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  specialty: string;
  activeStockCount: number;
  phone: string;
  isPrimary?: boolean;
  distanceKm?: number;
}

interface SellerLocationMapProps {
  sellerName: string;
  sellerLocation: string;
  sellerPhone?: string;
  sellerBusinessName?: string;
}

// Key resolution per Constitution
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

// Comprehensive South African Spare Parts Distributors dataset
const SA_DISTRIBUTORS: Omit<Distributor, "distanceKm">[] = [
  {
    id: "dist-1",
    name: "Gauteng Commercial Truck Spares",
    location: "Elandsfontein, Germiston",
    lat: -26.1558,
    lng: 28.1742,
    specialty: "Heavy Duty Commercial & Fleet Spares",
    activeStockCount: 142,
    phone: "+27118221000"
  },
  {
    id: "dist-2",
    name: "Tshwane Auto Recyclers & Engines",
    location: "Pretoria West, Gauteng",
    lat: -25.7511,
    lng: 28.1482,
    specialty: "Import Engines, Gearboxes & Diffs",
    activeStockCount: 98,
    phone: "+27123274000"
  },
  {
    id: "dist-3",
    name: "Wynberg Spares & Scrapyard Yard",
    location: "Wynberg, Sandton",
    lat: -26.1076,
    lng: 28.0805,
    specialty: "Passenger Car & SUV Used Parts",
    activeStockCount: 215,
    phone: "+27117862211"
  },
  {
    id: "dist-4",
    name: "East Rand Fleet Dismantlers",
    location: "Apex, Benoni",
    lat: -26.1883,
    lng: 28.3206,
    specialty: "Trailer Axles, Brake Drums & Suspension",
    activeStockCount: 76,
    phone: "+27114219900"
  },
  {
    id: "dist-5",
    name: "West Rand Engine & Transmission Center",
    location: "Roodepoort, Gauteng",
    lat: -26.1301,
    lng: 27.8700,
    specialty: "Diesel Engines & Turbochargers",
    activeStockCount: 110,
    phone: "+27117605544"
  },
  {
    id: "dist-6",
    name: "KZN Commercial Parts Depot",
    location: "Pinetown, Durban",
    lat: -29.8131,
    lng: 30.8582,
    specialty: "Freightliner & Mercedes Truck Parts",
    activeStockCount: 165,
    phone: "+27317013322"
  },
  {
    id: "dist-7",
    name: "Western Cape Truck & Bus Breakers",
    location: "Stikland, Bellville",
    lat: -33.9002,
    lng: 18.6631,
    specialty: "Volvo & Scania Truck Components",
    activeStockCount: 130,
    phone: "+27219481122"
  },
  {
    id: "dist-8",
    name: "Algoa Bay Spares Exchange",
    location: "Deal Party, Gqeberha",
    lat: -33.9311,
    lng: 25.6188,
    specialty: "Light Commercial & Bakkie Spares",
    activeStockCount: 84,
    phone: "+27414863300"
  },
  {
    id: "dist-9",
    name: "Free State Heavy Yard",
    location: "Hamilton, Bloemfontein",
    lat: -29.1501,
    lng: 26.2300,
    specialty: "Agricultural & Tractor Parts",
    activeStockCount: 62,
    phone: "+27514328811"
  },
  {
    id: "dist-10",
    name: "Limpopo Mining & Truck Spares",
    location: "Laboria, Polokwane",
    lat: -23.8900,
    lng: 29.4400,
    specialty: "Heavy Duty Off-road & Earthmoving",
    activeStockCount: 91,
    phone: "+27152932200"
  }
];

// Helper to estimate coordinates from South Africa city names
const getCoordinatesForLocation = (loc: string): { lat: number; lng: number } => {
  const clean = loc.toLowerCase();
  if (clean.includes("cape town") || clean.includes("bellville") || clean.includes("parow") || clean.includes("western cape")) {
    return { lat: -33.9249, lng: 18.4241 };
  }
  if (clean.includes("durban") || clean.includes("pinetown") || clean.includes("umhlanga") || clean.includes("kzn")) {
    return { lat: -29.8587, lng: 31.0218 };
  }
  if (clean.includes("pretoria") || clean.includes("tshwane") || clean.includes("centurion")) {
    return { lat: -25.7479, lng: 28.2293 };
  }
  if (clean.includes("bloemfontein") || clean.includes("free state")) {
    return { lat: -29.1181, lng: 26.2243 };
  }
  if (clean.includes("gqeberha") || clean.includes("port elizabeth") || clean.includes("eastern cape")) {
    return { lat: -33.9608, lng: 25.6022 };
  }
  if (clean.includes("polokwane") || clean.includes("limpopo")) {
    return { lat: -23.9045, lng: 29.4688 };
  }
  if (clean.includes("benoni") || clean.includes("boksburg") || clean.includes("germiston")) {
    return { lat: -26.1883, lng: 28.3206 };
  }
  // Default: Johannesburg Central / Selby Industrial Spares Hub
  return { lat: -26.2041, lng: 28.0473 };
};

// Haversine distance formula in kilometers
const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Inner component for rendering clustered markers using @googlemaps/markerclusterer
function ClusteredDistributorMarkers({
  distributors,
  primaryDistributor,
  onSelectDistributor
}: {
  distributors: Distributor[];
  primaryDistributor: Distributor;
  onSelectDistributor: (d: Distributor) => void;
}) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersMapRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());

  useEffect(() => {
    if (!map) return;

    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({ map });
    }

    // Clean up old markers
    const currentMarkersMap = markersMapRef.current;
    currentMarkersMap.forEach((marker) => {
      if (clustererRef.current) {
        clustererRef.current.removeMarker(marker);
      }
      marker.map = null;
    });
    currentMarkersMap.clear();

    const newMarkers: google.maps.marker.AdvancedMarkerElement[] = [];

    // Add primary seller marker
    const primaryPin = document.createElement("div");
    primaryPin.className = "bg-blue-600 text-white font-bold p-2 rounded-full shadow-lg border-2 border-white flex items-center justify-center transform hover:scale-110 transition-transform cursor-pointer";
    primaryPin.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>`;

    const primaryMarker = new google.maps.marker.AdvancedMarkerElement({
      position: { lat: primaryDistributor.lat, lng: primaryDistributor.lng },
      content: primaryPin,
      title: primaryDistributor.name
    });

    primaryMarker.addListener("click", () => {
      onSelectDistributor(primaryDistributor);
    });

    currentMarkersMap.set(primaryDistributor.id, primaryMarker);
    newMarkers.push(primaryMarker);

    // Add nearby distributors markers
    distributors.forEach((dist) => {
      const pin = document.createElement("div");
      pin.className = "bg-slate-900 text-white font-bold px-2.5 py-1.5 rounded-xl shadow-md border border-slate-700 flex items-center gap-1.5 hover:bg-blue-600 transition-colors cursor-pointer text-xs";
      pin.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span class="font-bold">${dist.name.split(" ")[0]}</span>`;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: dist.lat, lng: dist.lng },
        content: pin,
        title: dist.name
      });

      marker.addListener("click", () => {
        onSelectDistributor(dist);
      });

      currentMarkersMap.set(dist.id, marker);
      newMarkers.push(marker);
    });

    if (clustererRef.current) {
      clustererRef.current.addMarkers(newMarkers);
    }

    return () => {
      if (clustererRef.current) {
        clustererRef.current.clearMarkers();
      }
    };
  }, [map, distributors, primaryDistributor, onSelectDistributor]);

  return null;
}

export const SellerLocationMap: React.FC<SellerLocationMapProps> = ({
  sellerName,
  sellerLocation,
  sellerPhone,
  sellerBusinessName
}) => {
  const primaryCoords = getCoordinatesForLocation(sellerLocation);
  
  const primaryDistributor: Distributor = {
    id: "primary-seller",
    name: sellerBusinessName || sellerName,
    location: sellerLocation,
    lat: primaryCoords.lat,
    lng: primaryCoords.lng,
    specialty: "Primary Verified Distributor Location",
    activeStockCount: 24,
    phone: sellerPhone || "+27110000000",
    isPrimary: true,
    distanceKm: 0
  };

  // Calculate distance from primary seller to all other distributors
  const nearbyDistributors: Distributor[] = SA_DISTRIBUTORS.map((d) => ({
    ...d,
    distanceKm: calculateDistanceKm(primaryCoords.lat, primaryCoords.lng, d.lat, d.lng)
  })).sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  const [selectedDistributor, setSelectedDistributor] = useState<Distributor | null>(primaryDistributor);
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(150);
  const [enableClustering, setEnableClustering] = useState<boolean>(true);

  // Filter nearby distributors based on radius
  const filteredNearby = nearbyDistributors.filter((d) => (d.distanceKm || 0) <= maxRadiusKm);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col my-6">
      {/* Header Bar */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-display">
                Distributor Hub & Nearby Spares Network
              </h2>
              <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live Google Maps
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Showing verified premises in <strong className="text-slate-200">{sellerLocation}</strong> and {filteredNearby.length} clustered regional spares yards.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[11px] font-medium">Radius:</span>
            <select
              value={maxRadiusKm}
              onChange={(e) => setMaxRadiusKm(Number(e.target.value))}
              className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
            >
              <option value={50} className="bg-slate-900 text-white">Within 50 km</option>
              <option value={150} className="bg-slate-900 text-white">Within 150 km</option>
              <option value={600} className="bg-slate-900 text-white">Within 600 km</option>
              <option value={2000} className="bg-slate-900 text-white">All South Africa</option>
            </select>
          </div>

          <button
            onClick={() => setEnableClustering(!enableClustering)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
              enableClustering
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{enableClustering ? "Clusters On" : "All Markers"}</span>
          </button>
        </div>
      </div>

      {/* Main Map Body + Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[420px]">
        {/* Map View Area */}
        <div className="lg:col-span-8 relative min-h-[380px] sm:min-h-[420px] bg-slate-100">
          {!hasValidKey ? (
            /* API Key Missing Instruction Splash per Constitution */
            <div className="w-full h-full min-h-[380px] p-6 bg-slate-950 text-white flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-4">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white font-display mb-2">
                Google Maps API Key Required
              </h3>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-4">
                To enable live interactive satellite routing, street mapping, and distributor location clusters, configure your Google Maps API key in AI Studio Secrets.
              </p>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left text-xs max-w-md w-full space-y-2 mb-4">
                <div className="font-bold text-slate-200 border-b border-slate-800 pb-1.5">
                  How to add your Google Maps API key:
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                  <li>
                    Get a key from{" "}
                    <a
                      href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline font-semibold"
                    >
                      Google Cloud Console
                    </a>
                  </li>
                  <li>Open <strong>Settings</strong> (⚙️ gear icon, top-right) → <strong>Secrets</strong></li>
                  <li>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code> and paste your key</li>
                  <li>The app will automatically rebuild with live Google Maps!</li>
                </ol>
              </div>

              {/* Static Interactive Fallback Map Mock */}
              <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 max-w-md flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-left">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-200 block">{sellerBusinessName || sellerName}</span>
                    <span className="text-[11px] text-slate-400">{sellerLocation} • South Africa</span>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${sellerBusinessName || sellerName} ${sellerLocation} South Africa`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors text-[11px]"
                >
                  <span>Open Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                defaultCenter={{ lat: primaryCoords.lat, lng: primaryCoords.lng }}
                defaultZoom={10}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                style={{ width: "100%", height: "100%", minHeight: "380px" }}
                options={{
                  gestureHandling: "greedy",
                  fullscreenControl: false,
                  mapTypeControl: false
                }}
              >
                {/* Render Clustered Markers */}
                {enableClustering ? (
                  <ClusteredDistributorMarkers
                    distributors={filteredNearby}
                    primaryDistributor={primaryDistributor}
                    onSelectDistributor={(d) => setSelectedDistributor(d)}
                  />
                ) : (
                  <>
                    {/* Primary Seller Marker */}
                    <AdvancedMarker
                      position={{ lat: primaryCoords.lat, lng: primaryCoords.lng }}
                      onClick={() => setSelectedDistributor(primaryDistributor)}
                    >
                      <Pin background="#2563eb" glyphColor="#ffffff" borderColor="#1e40af" scale={1.2} />
                    </AdvancedMarker>

                    {/* Nearby Markers */}
                    {filteredNearby.map((d) => (
                      <AdvancedMarker
                        key={d.id}
                        position={{ lat: d.lat, lng: d.lng }}
                        onClick={() => setSelectedDistributor(d)}
                      >
                        <Pin background="#0f172a" glyphColor="#34d399" borderColor="#334155" />
                      </AdvancedMarker>
                    ))}
                  </>
                )}

                {/* Selected InfoWindow */}
                {selectedDistributor && (
                  <InfoWindow
                    position={{ lat: selectedDistributor.lat, lng: selectedDistributor.lng }}
                    onCloseClick={() => setSelectedDistributor(null)}
                  >
                    <div className="p-2 max-w-xs space-y-2 text-slate-900 font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          selectedDistributor.isPrimary ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-800"
                        }`}>
                          {selectedDistributor.isPrimary ? "Selected Seller" : "Nearby Distributor"}
                        </span>
                        {selectedDistributor.distanceKm !== undefined && selectedDistributor.distanceKm > 0 && (
                          <span className="text-[10px] font-bold text-slate-500">
                            {selectedDistributor.distanceKm} km away
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          {selectedDistributor.name}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{selectedDistributor.location}</span>
                        </p>
                      </div>

                      <p className="text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-100 font-medium">
                        {selectedDistributor.specialty}
                      </p>

                      <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-emerald-600">
                          {selectedDistributor.activeStockCount} Active Parts Cataloged
                        </span>

                        <a
                          href={`https://wa.me/${selectedDistributor.phone.replace(/\s+/g, "").replace("+", "")}?text=${encodeURIComponent(
                            `Hi, I found your yard on Partssource ZA map near ${sellerLocation}. Do you have spare parts available?`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          )}
        </div>

        {/* Side Panel: Nearby Yards List */}
        <div className="lg:col-span-4 bg-slate-50 p-4 border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col justify-between max-h-[420px] overflow-hidden">
          <div className="space-y-3 overflow-y-auto pr-1 flex-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-4 h-4 text-blue-600" />
                <span>Nearby Distributors ({filteredNearby.length})</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-bold bg-slate-200 px-1.5 py-0.5 rounded">
                SA Hub
              </span>
            </div>

            {/* Primary Seller Card in list */}
            <div
              onClick={() => setSelectedDistributor(primaryDistributor)}
              className={`p-3 rounded-xl border transition-all cursor-pointer ${
                selectedDistributor?.id === primaryDistributor.id
                  ? "bg-blue-50 border-blue-300 ring-2 ring-blue-400/20"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1">
                    Current Seller Profile
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">
                    {primaryDistributor.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{primaryDistributor.location}</span>
                  </p>
                </div>
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg shrink-0">
                  Main Yard
                </span>
              </div>
            </div>

            {/* Other Nearby Distributors list */}
            <div className="space-y-2 pt-1">
              {filteredNearby.map((dist) => {
                const isSelected = selectedDistributor?.id === dist.id;
                return (
                  <div
                    key={dist.id}
                    onClick={() => setSelectedDistributor(dist)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 border-blue-300 ring-2 ring-blue-400/20"
                        : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {dist.name}
                          </h4>
                          {dist.distanceKm !== undefined && (
                            <span className="text-[10px] font-bold text-slate-400 shrink-0">
                              • {dist.distanceKm} km
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {dist.specialty}
                        </p>
                      </div>

                      <a
                        href={`https://wa.me/${dist.phone.replace(/\s+/g, "").replace("+", "")}?text=${encodeURIComponent(
                          `Hi ${dist.name}, I found your listing on Partssource ZA near ${sellerLocation}. Do you have spare parts available?`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white p-1.5 rounded-lg border border-emerald-200 transition-colors shrink-0"
                        title="Contact via WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Direct Sourcing Network</span>
            <span className="font-bold text-slate-700">Zero Commission</span>
          </div>
        </div>
      </div>
    </div>
  );
};
