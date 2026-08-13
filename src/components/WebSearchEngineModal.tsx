import React, { useState, useEffect } from "react";
import { PartListing, WebSearchEngineResponse, WebGroundingSource } from "../types";
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
  TrendingUp
} from "lucide-react";

interface WebSearchEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSelectListing?: (listing: PartListing) => void;
}

export function WebSearchEngineModal({
  isOpen,
  onClose,
  initialQuery = "",
  onSelectListing
}: WebSearchEngineModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [vehicleType, setVehicleType] = useState<"All" | "Truck" | "Car">("All");
  const [scope, setScope] = useState<string>("All South Africa");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WebSearchEngineResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Suggested popular queries in South Africa
  const popularQueries = [
    { label: "Hilux 2.8 GD-6 Injectors", query: "Toyota Hilux 2.8 GD-6 Denso injectors price SA", type: "Car" },
    { label: "Scania R480 Heavy Brake Pads", query: "Scania R480 truck heavy duty brake pads part number", type: "Truck" },
    { label: "VW Polo 1.4 Cylinder Head", query: "VW Polo Vivo 1.4 CLP cylinder head skimmed Cape Town", type: "Car" },
    { label: "Volvo FH12 Air Suspension", query: "Volvo FH12 rear air suspension airbag replacement bellows", type: "Truck" },
    { label: "Toyota Quantum Gearbox", query: "Toyota Quantum 2.5 D-4D 5-speed manual gearbox scrap yard", type: "Car" },
    { label: "Mercedes Actros MP4 Turbo", query: "Mercedes-Benz Actros MP4 heavy truck turbocharger price", type: "Truck" },
    { label: "BMW F30 M-Sport Bumper", query: "BMW 3 Series F30 M-Sport front bumper OEM white", type: "Car" },
    { label: "Ford Ranger 3.2 TDCi Clutch", query: "Ford Ranger 3.2 TDCi dual mass flywheel and clutch kit", type: "Car" }
  ];

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery !== undefined ? searchQuery : query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/gemini/web-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
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
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden my-auto">
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
                Real-time automotive web crawler & cross-reference intelligence for South African car & truck spares
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

        {/* Search Bar Controls */}
        <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex-shrink-0">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col gap-3"
          >
            {/* Search Input Row */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter part name, OEM code, model (e.g., Hilux 2.8 injectors, Scania R480 brake pads, Polo cylinder head)..."
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
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 transition-all cursor-pointer flex-shrink-0"
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

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
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

              <div className="flex items-center gap-2">
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

          {/* Quick Click Search Chips */}
          <div className="mt-3 pt-3 border-t border-slate-200/60">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mr-1 flex-shrink-0">
                <TrendingUp className="w-3 h-3 text-blue-600" />
                Popular:
              </span>
              {popularQueries.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setQuery(item.query);
                    setVehicleType(item.type as any);
                    handleSearch(item.query);
                  }}
                  className="bg-white hover:bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex-shrink-0"
                >
                  {item.label}
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
                <h3 className="text-base font-bold text-slate-900">Querying Web Automotive Sources...</h3>
                <p className="text-xs text-slate-500 max-w-md mt-1">
                  Scanning South African scrap yards, parts distributors, OEM catalogs, and Partssource ZA listings for "{query}"
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
                <h3 className="text-base font-bold text-slate-900">Search Any Car or Truck Part Across South Africa</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Type an automotive component, vehicle model, OEM part number, or symptom above to search the web, scrap yards, and local verified marketplace inventory simultaneously.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left pt-2">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>Real-Time Web Grounding</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Extracts live prices, scrap yard availability, and reputable RSA suppliers.
                  </p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-1">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Dual Marketplace Matches</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Instantly cross-matches verified seller listings on Partssource ZA with zero buyer fees.
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
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3 h-3" />
                      Search Engine Grounded Intelligence
                    </span>
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
                              <MapPin className="w-3 h-3" />
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
