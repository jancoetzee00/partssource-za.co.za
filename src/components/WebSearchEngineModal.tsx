import React, { useState, useEffect } from "react";
import { PartListing, WebSearchEngineResponse, WebGroundingSource } from "../types";
import { SA_PROVINCES, getTownsForProvince } from "../data/saLocations";
import { 
  Search, 
  Globe, 
  ExternalLink, 
  Sparkles, 
  X, 
  Truck, 
  Car, 
  Layers, 
  Tag, 
  CheckCircle2, 
  Copy, 
  Check, 
  ArrowRight, 
  DollarSign, 
  RefreshCw, 
  HelpCircle, 
  ShieldCheck, 
  MapPin, 
  Flame, 
  Building2, 
  Wrench,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  Navigation
} from "lucide-react";

interface WebSearchEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  initialProvince?: string;
  initialTown?: string;
  onSelectListing?: (listing: PartListing) => void;
}

export function WebSearchEngineModal({
  isOpen,
  onClose,
  initialQuery = "",
  initialProvince = "All Provinces",
  initialTown = "All Towns",
  onSelectListing
}: WebSearchEngineModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedProvince, setSelectedProvince] = useState<string>(initialProvince);
  const [selectedTown, setSelectedTown] = useState<string>(initialTown);
  const [vehicleType, setVehicleType] = useState<"All" | "Truck" | "Car">("All");
  const [scope, setScope] = useState<string>("All South Africa");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WebSearchEngineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const availableTowns = getTownsForProvince(
    selectedProvince === "All Provinces" ? null : selectedProvince
  );

  // Suggested popular queries in South Africa
  const popularQueries = [
    { label: "Hilux 2.8 GD-6 Injectors", query: "Toyota Hilux 2.8 GD-6 Denso injectors price SA", type: "Car", prov: "Gauteng", town: "Kempton Park" },
    { label: "Scania R480 Heavy Brake Pads", query: "Scania R480 truck heavy duty brake pads part number", type: "Truck", prov: "Gauteng", town: "Germiston" },
    { label: "VW Polo 1.4 Cylinder Head", query: "VW Polo Vivo 1.4 CLP cylinder head Cape Town", type: "Car", prov: "Western Cape", town: "Bellville" },
    { label: "Volvo FH12 Air Suspension", query: "Volvo FH12 rear air suspension airbag replacement bellows", type: "Truck", prov: "KwaZulu-Natal", town: "Pinetown" },
    { label: "Toyota Quantum Gearbox", query: "Toyota Quantum 2.5 D-4D manual gearbox scrap yard", type: "Car", prov: "Gauteng", town: "Pretoria" },
    { label: "Mercedes Actros MP4 Turbo", query: "Mercedes-Benz Actros MP4 truck turbocharger", type: "Truck", prov: "KwaZulu-Natal", town: "Durban" },
    { label: "BMW F30 M-Sport Bumper", query: "BMW 3 Series F30 M-Sport front bumper OEM", type: "Car", prov: "Western Cape", town: "Cape Town" },
    { label: "Ford Ranger 3.2 TDCi Clutch", query: "Ford Ranger 3.2 TDCi clutch kit flywheel", type: "Car", prov: "Eastern Cape", town: "Gqeberha (Port Elizabeth)" }
  ];

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setQuery(initialQuery);
      if (initialProvince) setSelectedProvince(initialProvince);
      if (initialTown) setSelectedTown(initialTown);
      handleSearch(initialQuery, initialProvince, initialTown);
    }
  }, [initialQuery, initialProvince, initialTown]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleProvinceChange = (newProv: string) => {
    setSelectedProvince(newProv);
    setSelectedTown("All Towns");
  };

  const handleSearch = async (searchQuery?: string, customProv?: string, customTown?: string) => {
    const q = (searchQuery !== undefined ? searchQuery : query).trim();
    if (!q) return;

    const provToUse = customProv !== undefined ? customProv : selectedProvince;
    const townToUse = customTown !== undefined ? customTown : selectedTown;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/gemini/web-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          province: provToUse === "All Provinces" ? undefined : provToUse,
          town: townToUse === "All Towns" ? undefined : townToUse,
          scope,
          vehicleType: vehicleType === "All" ? "All Vehicles" : vehicleType,
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data: WebSearchEngineResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error("Search engine failed:", err);
      setError("Unable to complete live web search at this moment. Please check your query or retry.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Globe className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-white">
                  Partssource ZA Web Spares Search Engine
                </h2>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Live Web Grounding
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time automotive crawler & cross-reference intelligence narrowed by South African Province & Town
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close search engine"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar Controls & Location Filters */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex-shrink-0 space-y-3">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col gap-3"
          >
            {/* Search Input Row */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter part name, OEM code, or model (e.g. Hilux 2.8 injectors, Scania R480 brake pads, Polo cylinder head)..."
                  className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-11 pr-10 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-2xs"
                  autoFocus
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-3.5 text-xs text-slate-400 hover:text-slate-600 font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer flex-shrink-0"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Searching Web...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search Web</span>
                  </>
                )}
              </button>
            </div>

            {/* Province & Town Narrowing Bar */}
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              {/* Province Selector */}
              <div className="sm:col-span-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Province</label>
                  <select
                    value={selectedProvince}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 border-none p-0 focus:ring-0 cursor-pointer"
                  >
                    <option value="All Provinces">All 9 SA Provinces</option>
                    {SA_PROVINCES.map((prov) => (
                      <option key={prov.name} value={prov.name}>
                        {prov.name} ({prov.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="hidden sm:block w-px h-7 bg-slate-200"></div>

              {/* Town Selector */}
              <div className="sm:col-span-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Town / City</label>
                  <select
                    value={selectedTown}
                    onChange={(e) => setSelectedTown(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-slate-800 border-none p-0 focus:ring-0 cursor-pointer"
                  >
                    <option value="All Towns">
                      {selectedProvince === "All Provinces" ? "All Towns in RSA" : `All Towns in ${selectedProvince}`}
                    </option>
                    {availableTowns.map((townName) => (
                      <option key={townName} value={townName}>
                        {townName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location Badge / Indicator */}
              <div className="sm:col-span-3.5 flex items-center justify-end gap-1.5 pl-2">
                <span className="text-[11px] text-slate-600 font-medium bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="truncate max-w-[140px]">
                    {selectedTown !== "All Towns" ? `${selectedTown}, ` : ""}
                    {selectedProvince !== "All Provinces" ? selectedProvince : "South Africa"}
                  </span>
                </span>
                {(selectedProvince !== "All Provinces" || selectedTown !== "All Towns") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProvince("All Provinces");
                      setSelectedTown("All Towns");
                    }}
                    className="text-[11px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                    title="Reset location filter"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Filter Pills & Vehicle Type */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Vehicle:</span>
                <div className="flex bg-white rounded-lg border border-slate-200 p-0.5">
                  {(["All", "Car", "Truck"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVehicleType(v)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                        vehicleType === v 
                          ? "bg-slate-900 text-white shadow-2xs" 
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {v === "All" ? "All Fleet" : v === "Truck" ? "Heavy Trucks" : "Cars & Bakkies"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">Scope:</span>
                {["All South Africa", "Scrap Yards & Salvage", "OEM Cross-Ref", "Price Guide"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScope(s)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                      scope === s 
                        ? "bg-blue-50 text-blue-700 border-blue-300 font-bold" 
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </form>

          {/* Quick Click Popular Searches Narrowed by Province & Town */}
          <div className="pt-2 border-t border-slate-200/60">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mr-1 flex-shrink-0">
                <TrendingUp className="w-3 h-3 text-blue-600" />
                Popular By Area:
              </span>
              {popularQueries.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setQuery(item.query);
                    setVehicleType(item.type as any);
                    setSelectedProvince(item.prov);
                    setSelectedTown(item.town);
                    handleSearch(item.query, item.prov, item.town);
                  }}
                  className="bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 flex-shrink-0"
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] text-slate-400 bg-slate-50 px-1 py-0.2 rounded">
                    {item.town}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Body & Results */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
                <Globe className="w-6 h-6 text-blue-600 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Querying South African Automotive Sources
                  {selectedProvince !== "All Provinces" ? ` in ${selectedTown !== "All Towns" ? `${selectedTown}, ${selectedProvince}` : selectedProvince}` : ""}...
                </h3>
                <p className="text-xs text-slate-500 max-w-md mt-1">
                  Scanning verified scrap yards, parts distributors, and salvage networks for "{query}"
                </p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold flex-shrink-0">!</div>
              <div>
                <div className="font-bold">Search Error</div>
                <div className="text-xs mt-0.5">{error}</div>
                <button
                  onClick={() => handleSearch()}
                  className="mt-2 text-xs font-bold text-red-800 underline hover:no-underline"
                >
                  Retry Search
                </button>
              </div>
            </div>
          )}

          {!loading && !result && !error && (
            <div className="py-12 text-center max-w-lg mx-auto space-y-4">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-blue-100">
                <Search className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Search Any Part Across South African Provinces & Towns
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Narrow searches down to Gauteng, Western Cape, KZN, Eastern Cape, or specific towns like Kempton Park, Bellville, Durban, or Centurion to pinpoint closest suppliers and scrap yards.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span>Province & Town Narrowing</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Filter by any of the 9 provinces or individual towns to locate local dismantlers.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Real-Time Web Grounding</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Extracts live prices, scrap yard availability, and reputable RSA suppliers.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-6">
              {/* Header Summary Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800 relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        Search Engine Grounded Intelligence
                      </span>
                      {(result.province || result.town) && (
                        <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />
                          {result.town ? `${result.town}, ` : ""}{result.province || "South Africa"}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-extrabold text-white">
                      Results for "{result.query}"
                    </h3>
                  </div>

                  {result.estimatedPriceRangeZar && (
                    <div className="bg-blue-950/60 border border-blue-500/30 px-4 py-2.5 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-blue-300 font-semibold uppercase tracking-wider">Estimated RSA Price</div>
                        <div className="text-sm font-bold text-white">{result.estimatedPriceRangeZar}</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Summary Text */}
                <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {result.summary}
                </div>

                {/* Key Insights Pills */}
                {result.keyInsights && result.keyInsights.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-700/60 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Key Technical & Sourcing Insights:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {result.keyInsights.map((insight, idx) => (
                        <div key={idx} className="flex items-start gap-2 bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 text-xs text-slate-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested OEM Numbers */}
                {result.suggestedOemNumbers && result.suggestedOemNumbers.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-700/60 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      OEM / Interchange Codes:
                    </span>
                    {result.suggestedOemNumbers.map((oem) => (
                      <button
                        key={oem}
                        type="button"
                        onClick={() => handleCopy(oem)}
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-blue-300 px-2.5 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Click to copy part number"
                      >
                        <span>{oem}</span>
                        {copiedText === oem ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* In-Stock Marketplace Listings Match */}
              {result.matchingMarketplaceParts && result.matchingMarketplaceParts.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      In-Stock on Partssource ZA Marketplace ({result.matchingMarketplaceParts.length})
                    </h4>
                    <span className="text-xs text-slate-500 font-medium">Direct Seller Contact • 0% Buyer Commission</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {result.matchingMarketplaceParts.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (onSelectListing) {
                            onSelectListing(item);
                            onClose();
                          }
                        }}
                        className="bg-white border border-slate-200 hover:border-blue-500 rounded-xl p-3 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded">
                              {item.category}
                            </span>
                            <span className="text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-500" />
                              {item.location}
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 line-clamp-2 transition-colors">
                            {item.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase font-semibold">Price (ZAR)</div>
                            <div className="text-sm font-extrabold text-slate-950">
                              {new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(item.price)}
                            </div>
                          </div>
                          <span className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            View Ad <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Web Sources & Grounding Links */}
              {result.sources && result.sources.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600" />
                      Verified Web References & Suppliers ({result.sources.length})
                    </h4>
                    <span className="text-xs text-slate-400">Google Grounded Sources</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {result.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-3.5 transition-all shadow-2xs hover:shadow-sm flex items-start justify-between gap-3 group"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            <Building2 className="w-3.5 h-3.5 text-slate-500" />
                            <span className="line-clamp-1">{src.title}</span>
                          </div>
                          {src.snippet && (
                            <p className="text-[11px] text-slate-500 line-clamp-2">
                              {src.snippet}
                            </p>
                          )}
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-xs pt-0.5">
                            {src.url}
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0 mt-0.5" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Searches */}
              {result.relatedSearches && result.relatedSearches.length > 0 && (
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Search className="w-3.5 h-3.5" />
                    Related Spares Searches:
                  </span>
                  {result.relatedSearches.map((rel, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQuery(rel);
                        handleSearch(rel);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer"
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between flex-shrink-0 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>Partssource ZA Web Grounding • Powered by Gemini 3.7 Flash & Google Search</span>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Close Search Engine
          </button>
        </div>
      </div>
    </div>
  );
}
