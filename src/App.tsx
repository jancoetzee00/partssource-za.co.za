/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { PartListing, Seller, SubscriptionBankingDetails } from "./types";
import { SA_PROVINCES, getTownsForProvince, matchesLocation } from "./data/saLocations";
import { ListingCard } from "./components/ListingCard";
import { ListingDetailsModal } from "./components/ListingDetailsModal";
import { SellerDashboard } from "./components/SellerDashboard";
import { DiagnosticAdvisor } from "./components/DiagnosticAdvisor";
import { CompareModal } from "./components/CompareModal";
import { SellerLocationMap } from "./components/SellerLocationMap";
import { SettingsModal } from "./components/SettingsModal";
import { WebSearchEngineModal } from "./components/WebSearchEngineModal";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  subscribeToListings, 
  addListingToFirestore, 
  deleteListingFromFirestore, 
  subscribeToBankingDetails,
  DEFAULT_BANKING_DETAILS,
  INITIAL_LISTINGS 
} from "./lib/firestoreServices";
import { 
  Search, 
  MapPin, 
  Tag, 
  Settings, 
  PlusCircle, 
  HelpCircle, 
  Check, 
  User, 
  Flame, 
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Truck,
  Car,
  ChevronRight,
  SlidersHorizontal,
  DollarSign,
  ShieldCheck,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  ArrowLeft,
  ArrowLeftRight,
  Sparkles,
  X,
  Globe,
  Navigation
} from "lucide-react";

export default function App() {
  // Navigation & Views
  const [activeTab, setActiveTab] = useState<"browse" | "pricing" | "dashboard" | "seller-profile">("browse");
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);

  // Web Search Engine State
  const [isWebSearchOpen, setIsWebSearchOpen] = useState<boolean>(false);
  const [webSearchQuery, setWebSearchQuery] = useState<string>("");
  const [webSearchProvince, setWebSearchProvince] = useState<string>("All Provinces");
  const [webSearchTown, setWebSearchTown] = useState<string>("All Towns");

  const handleOpenWebSearch = (initialQ?: string, initialProv?: string, initialTown?: string) => {
    setWebSearchQuery(initialQ || searchQuery || "");
    setWebSearchProvince(initialProv || selectedProvince || "All Provinces");
    setWebSearchTown(initialTown || selectedTown || "All Towns");
    setIsWebSearchOpen(true);
  };
  
  // Listings State
  const [listings, setListings] = useState<PartListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedTown, setSelectedTown] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedVehicleType, setSelectedVehicleType] = useState<"Car" | "Truck" | "Other" | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [sortOrder, setSortOrder] = useState<string>("newest");

  // Selection & Modal State
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);

  // Compare State
  const [comparedListingIds, setComparedListingIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);

  const handleToggleCompare = (id: string) => {
    setComparedListingIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) {
        alert("You can compare up to 4 spare parts side-by-side at a time.");
        return prev;
      }
      return [...prev, id];
    });
  };

  // Recently Viewed State
  const [recentlyViewed, setRecentlyViewed] = useState<PartListing[]>([]);

  // Load recently viewed from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem("partssource_recently_viewed");
    if (stored) {
      try {
        setRecentlyViewed(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recently viewed items", e);
      }
    }
  }, []);

  const handleViewListing = (listing: PartListing) => {
    setSelectedListingId(listing.id);
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((item) => item.id !== listing.id);
      const updated = [listing, ...filtered].slice(0, 5);
      sessionStorage.setItem("partssource_recently_viewed", JSON.stringify(updated));
      return updated;
    });
  };

  // Seller State & Settings State
  const [seller, setSeller] = useState<Seller | null>(null);
  const [bankingDetails, setBankingDetails] = useState<SubscriptionBankingDetails>(DEFAULT_BANKING_DETAILS);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Determine if running on local app / dev environment (hidden from public view)
  const isLocalApp = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    const host = window.location.hostname || "";
    const search = window.location.search || "";
    
    const isLocalHostname = 
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "::1" ||
      host.endsWith(".localhost") ||
      host.startsWith("ais-dev-");

    const isOwnerQuery = 
      search.includes("admin=true") || 
      search.includes("local=true") || 
      search.includes("owner=true");

    return Boolean(isLocalHostname || isOwnerQuery);
  }, []);

  // Subscribe to Banking Details from Firestore
  useEffect(() => {
    const unsub = subscribeToBankingDetails((data) => {
      setBankingDetails(data);
    });
    return () => unsub();
  }, []);

  // Stats
  const [activeSellerCount, setActiveSellerCount] = useState<number>(452);
  const [listedItemsCount, setListedItemsCount] = useState<number>(15402);

  // Sync Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && !seller) {
        setSeller({
          id: user.uid,
          name: user.displayName || "Seller",
          businessName: user.displayName ? `${user.displayName} Spares` : "Auto Spares Distributor",
          email: user.email || "",
          phone: user.phoneNumber || "+27 82 000 0000",
          subscription: {
            active: true,
            plan: "Pro",
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amountPaid: 499
          }
        });
      }
    });
    return () => unsub();
  }, []);

  // Available towns for current province
  const availableTowns = getTownsForProvince(selectedProvince);

  // Live Firestore Subscription & Auto Seeding
  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToListings(async (firestoreItems) => {
      if (firestoreItems.length === 0) {
        // Show initial default items immediately in state
        const initialWithIds = INITIAL_LISTINGS.map((item, idx) => ({
          ...item,
          id: `seed-${idx}`
        }));
        setListings(initialWithIds as PartListing[]);
        setLoading(false);

        // Seed default items to Firestore in background
        for (const item of INITIAL_LISTINGS) {
          try {
            await addListingToFirestore(item);
          } catch (e) {
            console.warn("Notice: Initial listing seed:", e);
          }
        }
      } else {
        // Apply client filters & sorting
        let filtered = firestoreItems;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(item => 
            item.title.toLowerCase().includes(q) || 
            item.description.toLowerCase().includes(q) ||
            (item.partNumber && item.partNumber.toLowerCase().includes(q)) ||
            (item.brand && item.brand.toLowerCase().includes(q))
          );
        }
        // Location Filtering: Province & Town
        if (selectedProvince || selectedTown) {
          filtered = filtered.filter(item => 
            matchesLocation(item.location, selectedProvince, selectedTown)
          );
        }
        if (selectedCategory) filtered = filtered.filter(i => i.category === selectedCategory);
        if (selectedVehicleType) filtered = filtered.filter(i => i.vehicleType === selectedVehicleType || i.vehicleType === "Both");
        if (selectedCondition) filtered = filtered.filter(i => i.condition === selectedCondition);
        if (minPrice) filtered = filtered.filter(i => i.price >= Number(minPrice));
        if (maxPrice) filtered = filtered.filter(i => i.price <= Number(maxPrice));

        if (sortOrder === "price-asc") {
          filtered.sort((a, b) => a.price - b.price);
        } else if (sortOrder === "price-desc") {
          filtered.sort((a, b) => b.price - a.price);
        }

        setListings(filtered);
        setError(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [searchQuery, selectedProvince, selectedTown, selectedCategory, selectedVehicleType, selectedCondition, minPrice, maxPrice, sortOrder]);

  // Keep stats dynamic
  useEffect(() => {
    if (listings.length > 0) {
      const sellersSet = new Set(listings.map(l => l.sellerId));
      setActiveSellerCount(420 + sellersSet.size);
      setListedItemsCount(15380 + listings.length);
    }
  }, [listings]);

  // Handler to add listing to Firestore + backend
  const handleAddListing = async (newListingData: any) => {
    try {
      // Add to Firestore
      const firestoreId = await addListingToFirestore({
        ...newListingData,
        createdAt: new Date().toISOString()
      });

      // Also notify backend API
      fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newListingData, id: firestoreId })
      }).catch(err => console.warn("Backend API sync notice:", err));

      return { id: firestoreId, ...newListingData };
    } catch (err: any) {
      console.error("Firestore Add Listing Error:", err);
      throw err;
    }
  };

  // Handler to delete listing from Firestore
  const handleDeleteListing = async (listingId: string) => {
    try {
      await deleteListingFromFirestore(listingId);
      fetch(`/api/listings/${listingId}`, { method: "DELETE" }).catch(() => {});
      return true;
    } catch (err) {
      console.error("Firestore Delete Listing Error:", err);
      return false;
    }
  };

  // Pre-load active seller session from localStorage if present
  useEffect(() => {
    const saved = localStorage.getItem("partssource_za_seller");
    if (saved) {
      try {
        setSeller(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem("partssource_za_seller");
      }
    }
  }, []);

  // Save seller session when changed
  useEffect(() => {
    if (seller) {
      localStorage.setItem("partssource_za_seller", JSON.stringify(seller));
    } else {
      localStorage.removeItem("partssource_za_seller");
    }
  }, [seller]);

  const selectedListing = listings.find(l => l.id === selectedListingId) || recentlyViewed.find(l => l.id === selectedListingId);

  // Dynamic page title and meta description SEO manager
  useEffect(() => {
    let title = "Partssource ZA | Verified Car & Truck Spares Marketplace South Africa";
    let description = "Find verified car and heavy-duty truck spares from vetted South African distributors. Browse engine components, brakes, transmissions, body panels, and more with zero buyer commission.";

    if (selectedListing) {
      const priceFormatted = new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
        maximumFractionDigits: 0
      }).format(selectedListing.price);
      title = `${selectedListing.title} (${selectedListing.condition}) - ${priceFormatted} | Partssource ZA`;
      description = `Buy ${selectedListing.title} for ${priceFormatted} on Partssource ZA. Condition: ${selectedListing.condition}. Location: ${selectedListing.location}. Fitment: ${selectedListing.compatibility}. Contact vetted South African sellers directly.`;
    } else if (activeTab === "dashboard") {
      title = "Seller Dashboard | Manage Spares Advertisements | Partssource ZA";
      description = "Access your Partssource ZA seller profile. Post new car or heavy-duty truck spares, manage active advertisements, handle subscriptions, and respond to incoming buyer leads.";
    } else if (activeTab === "pricing") {
      title = "Subscription & Pricing Plans | Partssource ZA Spares Marketplace";
      description = "Simple, transparent monthly pricing with zero sales commission. List your truck & passenger vehicle parts starting from R249/month. Ideal for local mechanics and automotive yards.";
    } else if (activeTab === "seller-profile" && selectedSellerId) {
      const profileListings = listings.filter(l => l.sellerId === selectedSellerId);
      const profileSeller = profileListings[0];
      if (profileSeller) {
        const name = profileSeller.sellerBusinessName || profileSeller.sellerName;
        title = `${name} | Verified Spares Seller Profile | Partssource ZA`;
        description = `View verified spare parts advertisements listed by ${name} in ${profileSeller.location} on Partssource ZA. Browse their ${profileListings.length} active listings, contact them directly via WhatsApp or Email, and buy with zero buyer commission.`;
      } else {
        title = "Verified Seller Profile | Partssource ZA";
        description = "View verified spare parts advertisements and distributor profiles on Partssource ZA. Secure direct spares sourcing in South Africa.";
      }
    } else if (activeTab === "browse") {
      let partsLabel = selectedCategory ? selectedCategory : "Car & Truck Spares";
      let vehicleLabel = "";
      if (selectedVehicleType === "Truck") {
        vehicleLabel = "Heavy Duty Trucks";
      } else if (selectedVehicleType === "Car") {
        vehicleLabel = "Passenger Cars";
      } else if (selectedVehicleType === "Other") {
        vehicleLabel = "Other Vehicles";
      }

      const conditionLabel = selectedCondition ? `${selectedCondition}` : "";
      
      let partsDescription = "";
      if (conditionLabel) {
        partsDescription += `${conditionLabel} `;
      }
      partsDescription += partsLabel;
      
      if (vehicleLabel) {
        partsDescription += ` for ${vehicleLabel}`;
      }

      const searchSuffix = searchQuery ? ` matching "${searchQuery}"` : "";
      
      let priceSuffix = "";
      if (minPrice !== "" || maxPrice !== "") {
        if (minPrice !== "" && maxPrice !== "") {
          priceSuffix = ` (R${minPrice} - R${maxPrice})`;
        } else if (minPrice !== "") {
          priceSuffix = ` (from R${minPrice})`;
        } else if (maxPrice !== "") {
          priceSuffix = ` (up to R${maxPrice})`;
        }
      }

      title = `Buy ${partsDescription}${searchSuffix}${priceSuffix} | Partssource ZA`;
      
      description = `Find verified ${conditionLabel ? conditionLabel.toLowerCase() + ' ' : ''}${partsLabel.toLowerCase()}${vehicleLabel ? ` suitable for ${vehicleLabel.toLowerCase()}` : " for vehicles and fleets"} in South Africa${searchQuery ? ` matching your search for '${searchQuery}'` : ""}${priceSuffix ? ` within price range ${priceSuffix}` : ""}. Zero commission, contact South African sellers directly.`;
    }

    // Update document title
    document.title = title;

    // Update or create meta description tag
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);
  }, [
    activeTab, 
    selectedCategory, 
    selectedListing, 
    selectedSellerId, 
    listings, 
    selectedVehicleType, 
    selectedCondition, 
    searchQuery, 
    minPrice, 
    maxPrice
  ]);

  const categoriesList = [
    "Engine Parts",
    "Transmission",
    "Brakes",
    "Suspension & Steering",
    "Body Panels",
    "Electrical",
    "Wheels & Tyres",
    "Interior",
    "Accessories",
    "Other"
  ];

  const handleSelectPricingPlan = (plan: "Starter" | "Pro" | "Enterprise") => {
    // If not logged in, prompt login on dashboard
    setActiveTab("dashboard");
    // We can save the selected plan preference in a temporary variable or alert the dashboard to open checkout
    sessionStorage.setItem("partssource_selected_plan", plan);
  };

  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedVehicleType(null);
    setSelectedCondition(null);
    setSelectedProvince(null);
    setSelectedTown(null);
    setMinPrice("");
    setMaxPrice("");
    setSearchQuery("");
  };

  const handleProvinceSelect = (prov: string | null) => {
    setSelectedProvince(prov);
    setSelectedTown(null);
  };

  return (
    <div className="bg-[#F3F4F6] w-full min-h-screen overflow-hidden flex flex-col font-sans text-slate-900 tracking-tight">
      {/* Top Header Navigation */}
      <nav className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 lg:px-8 flex-shrink-0 z-30">
        {/* Left Brand Container */}
        <div 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => { setActiveTab("browse"); clearAllFilters(); }}
        >
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white rotate-45"></div>
          </div>
          <span className="text-xl font-bold tracking-tighter uppercase">
            Partssource<span className="text-blue-600">ZA</span>
          </span>
        </div>

        {/* Dynamic Navigation Search (only visible on browse view) */}
        <div className={`flex-1 max-w-xl px-4 lg:px-10 transition-all ${activeTab === "browse" ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="relative flex items-center">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  handleOpenWebSearch(searchQuery);
                }
              }}
              placeholder="Search truck & car parts, OEM codes, or press Enter for Live Web..." 
              className="w-full bg-slate-100 border border-slate-200/80 rounded-full py-2 pl-10 pr-24 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 placeholder-slate-400 shadow-2xs"
            />
            <div className="absolute left-3.5 top-2.5 opacity-40 text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <div className="absolute right-2 flex items-center gap-1">
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold px-1"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => handleOpenWebSearch(searchQuery)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                title="Search live automotive web & scrap yards with AI Grounding"
              >
                <Globe className="w-3 h-3" />
                <span className="hidden sm:inline">Web Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Nav Options */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-5">
          <button 
            onClick={() => handleOpenWebSearch()}
            className="text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-extrabold px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Launch South Africa Parts Web Search Engine"
          >
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>Web Search</span>
            <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase">AI</span>
          </button>

          <button 
            onClick={() => { setActiveTab("browse"); }}
            className={`text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === "browse" ? "text-blue-600" : "text-slate-600 hover:text-blue-600"
            }`}
          >
            Browse Spares
          </button>
          <button 
            onClick={() => { setActiveTab("pricing"); }}
            className={`text-xs sm:text-sm font-semibold transition-colors cursor-pointer hidden md:block ${
              activeTab === "pricing" ? "text-blue-600" : "text-slate-600 hover:text-blue-600"
            }`}
          >
            Pricing
          </button>

          {/* Owner Settings: Only visible on local / dev app */}
          {isLocalApp && (
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-700 hover:text-blue-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-full shadow-2xs"
              title="App Owner Settings & Banking Configuration (Local Mode Only)"
            >
              <Settings className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          )}
          
          {seller ? (
            <button 
              onClick={() => { setActiveTab("dashboard"); }}
              className="bg-slate-950 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>{seller.businessName || seller.name}</span>
            </button>
          ) : (
            <button 
              onClick={() => { setActiveTab("dashboard"); }}
              className="bg-slate-950 hover:bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer"
            >
              Seller Login
            </button>
          )}
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR FILTER PANEL - Only visible during browse mode */}
        {activeTab === "browse" && (
          <aside className="w-68 bg-white border-r border-slate-200 p-5 sm:p-6 flex flex-col flex-shrink-0 hidden md:flex overflow-y-auto">
            {/* Filter Reset Button */}
            <div className="flex justify-between items-center mb-5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filters & Fitments</span>
              {(selectedProvince || selectedTown || selectedCategory || selectedVehicleType || selectedCondition || minPrice || maxPrice || searchQuery) && (
                <button 
                  onClick={clearAllFilters}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Filter Section: Location Narrowing (Province & Town) */}
            <div className="mb-6 pb-6 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  Location (RSA)
                </h3>
                {(selectedProvince || selectedTown) && (
                  <button
                    onClick={() => {
                      setSelectedProvince(null);
                      setSelectedTown(null);
                    }}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Province Select */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Province
                </label>
                <select
                  value={selectedProvince || ""}
                  onChange={(e) => handleProvinceSelect(e.target.value ? e.target.value : null)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">All 9 Provinces (RSA)</option>
                  {SA_PROVINCES.map((prov) => (
                    <option key={prov.name} value={prov.name}>
                      {prov.name} ({prov.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Town / City Select */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                  Town / City
                </label>
                <select
                  value={selectedTown || ""}
                  onChange={(e) => setSelectedTown(e.target.value ? e.target.value : null)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">
                    {selectedProvince ? `All Towns in ${selectedProvince}` : "All Towns in South Africa"}
                  </option>
                  {availableTowns.map((town) => (
                    <option key={town} value={town}>
                      {town}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Major Province Chips */}
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Quick Province:
                </span>
                <div className="flex flex-wrap gap-1">
                  {["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape"].map((provName) => {
                    const isSelected = selectedProvince === provName;
                    return (
                      <button
                        key={provName}
                        onClick={() => handleProvinceSelect(isSelected ? null : provName)}
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-amber-600 text-white font-bold"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {provName === "KwaZulu-Natal" ? "KZN" : provName === "Western Cape" ? "WC" : provName === "Eastern Cape" ? "EC" : "GP"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Filter Section: Vehicle / Fleet Type */}
            <div className="mb-6 pb-6 border-b border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Vehicle Type</h3>
              <div className="space-y-2.5">
                {[
                  { label: "Heavy Duty Trucks", type: "Truck" },
                  { label: "Passenger Cars", type: "Car" },
                  { label: "Universal / Other", type: "Other" }
                ].map((item) => {
                  const isChecked = selectedVehicleType === item.type;
                  return (
                    <label 
                      key={item.label}
                      onClick={() => setSelectedVehicleType(isChecked ? null : (item.type as any))}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors border ${
                        isChecked 
                          ? "border-blue-600 bg-blue-600 text-white" 
                          : "border-slate-300 group-hover:border-slate-400 bg-white"
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span className="text-xs font-medium text-slate-700 group-hover:text-slate-950 transition-colors">
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Filter Section: Category Selectors */}
            <div className="mb-6 pb-6 border-b border-slate-100 flex-1 min-h-[200px]">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Category</h3>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div 
                  onClick={() => setSelectedCategory(null)}
                  className={`p-2 rounded cursor-pointer font-semibold transition-all ${
                    selectedCategory === null 
                      ? "bg-blue-50 text-blue-700 font-bold" 
                      : "hover:bg-slate-50 text-slate-600"
                  }`}
                >
                  All Categories
                </div>
                {categoriesList.map((cat) => (
                  <div 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-2 rounded cursor-pointer transition-all font-semibold ${
                      selectedCategory === cat 
                        ? "bg-blue-50 text-blue-700 font-bold" 
                        : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            </div>

            {/* Filter Section: Condition */}
            <div className="mb-6 pb-6 border-b border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Condition</h3>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {["New", "Like New", "Refurbished", "Good", "Fair", "For Parts"].map((cond) => {
                  const isChecked = selectedCondition === cond;
                  return (
                    <button
                      key={cond}
                      onClick={() => setSelectedCondition(isChecked ? null : cond)}
                      className={`py-1 px-2 rounded-md border text-center transition-all font-semibold cursor-pointer ${
                        isChecked 
                          ? "bg-slate-950 text-white border-slate-950" 
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {cond}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Section: Price range */}
            <div className="mb-6">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Price Range (ZAR)</h3>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Min" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
                <span className="text-slate-300 text-xs">-</span>
                <input 
                  type="number" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Max" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>
            </div>

            {/* Sidebar Seller Promo Card */}
            <div className="mt-auto pt-4">
              <div className="bg-slate-900 rounded-xl p-5 text-white shadow-xs">
                <p className="text-[10px] text-blue-400 font-bold mb-1 tracking-wider uppercase">FOR SELLERS</p>
                <p className="text-xs font-semibold text-slate-200 mb-3.5 leading-relaxed">
                  Post unlimited spares on South Africa's trusted marketplace.
                </p>
                <button 
                  onClick={() => {
                    setActiveTab("dashboard");
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 transition-colors py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Post a Spare
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* MAIN DYNAMIC CONTENT CONTAINER */}
        <main className="flex-1 p-6 lg:p-8 flex flex-col gap-6 overflow-y-auto min-w-0">
          
          {/* BROWSE VIEW */}
          {activeTab === "browse" && (
            <>
              {/* Web Search Engine Hero Feature Card */}
              <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
                    <Globe className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-extrabold text-white">
                        AI Web Spares Search Engine & Scrap Yard Sourcing
                      </h2>
                      <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        Live Grounding
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                      Can't find a part? Search verified South African auto catalogs, scrap yards, OEM cross-reference codes, and scrap yards in real-time.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenWebSearch()}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Launch Web Search Engine</span>
                  </button>
                </div>
              </div>

              {/* Marketplace Stats Header */}
              <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1 text-slate-950">
                    {selectedCategory ? selectedCategory : "Automotive & Truck Spares"}
                  </h1>
                  <p className="text-slate-500 text-sm">
                    Showing {listings.length} verified listings from vetted South African distributors.
                  </p>
                </div>

                {/* Sorting Controls */}
                <div className="flex gap-2 items-center self-start md:self-auto">
                  <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 shadow-xs shrink-0">
                    <span className="text-slate-400">Sort By:</span>
                    <select 
                      value={sortOrder} 
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="font-semibold text-slate-800 bg-transparent border-none outline-hidden p-0 cursor-pointer"
                    >
                      <option value="newest">Featured / Newest</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </div>
                  
                  {/* Mobile Filter Sheet Button */}
                  <div className="md:hidden">
                    <button 
                      onClick={() => {
                        const newCat = prompt(`Filter by Category (or cancel to view all):\n\n${categoriesList.join("\n")}`, selectedCategory || "");
                        if (newCat !== null) {
                          if (newCat.trim() === "") setSelectedCategory(null);
                          else if (categoriesList.includes(newCat)) setSelectedCategory(newCat);
                        }
                      }}
                      className="bg-slate-900 text-white p-2.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Category</span>
                    </button>
                  </div>
                </div>
              </header>

              {/* Filtering indicators if active */}
              {(selectedProvince || selectedTown || selectedCategory || selectedVehicleType || selectedCondition || minPrice || maxPrice || searchQuery) && (
                <div className="flex flex-wrap items-center gap-2 bg-white/70 border border-slate-200 p-3 rounded-xl">
                  <span className="text-xs text-slate-400 font-bold uppercase mr-1">Active:</span>
                  {selectedProvince && (
                    <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                      <MapPin className="w-3 h-3 text-amber-600" />
                      <span>{selectedProvince}</span>
                      <button onClick={() => { setSelectedProvince(null); setSelectedTown(null); }} className="hover:text-amber-950 ml-1">×</button>
                    </span>
                  )}
                  {selectedTown && (
                    <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                      <span>Town: {selectedTown}</span>
                      <button onClick={() => setSelectedTown(null)} className="hover:text-amber-950 ml-1">×</button>
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      {selectedCategory}
                      <button onClick={() => setSelectedCategory(null)} className="hover:text-blue-900 ml-1">×</button>
                    </span>
                  )}
                  {selectedVehicleType && (
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      Type: {selectedVehicleType === "Truck" ? "Trucks" : selectedVehicleType === "Car" ? "Cars" : "Other"}
                      <button onClick={() => setSelectedVehicleType(null)} className="hover:text-blue-900 ml-1">×</button>
                    </span>
                  )}
                  {selectedCondition && (
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      {selectedCondition}
                      <button onClick={() => setSelectedCondition(null)} className="hover:text-blue-900 ml-1">×</button>
                    </span>
                  )}
                  {searchQuery && (
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      Query: "{searchQuery}"
                      <button onClick={() => setSearchQuery("")} className="hover:text-blue-900 ml-1">×</button>
                    </span>
                  )}
                  {(minPrice || maxPrice) && (
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                      Price: R{minPrice || 0} - R{maxPrice || "Max"}
                      <button onClick={() => { setMinPrice(""); setMaxPrice(""); }} className="hover:text-blue-900 ml-1">×</button>
                    </span>
                  )}
                  <button 
                    onClick={clearAllFilters}
                    className="text-xs text-slate-500 hover:text-slate-900 underline font-semibold ml-auto cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}

              {/* Error Alert Panel */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="text-sm">{error}</p>
                  <button onClick={() => setError(null)} className="text-xs text-red-600 underline font-semibold ml-auto">
                    Dismiss
                  </button>
                </div>
              )}

              {/* Recently Viewed Section */}
              {recentlyViewed.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-slate-900">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">Recently Viewed Spares</h3>
                    </div>
                    <button 
                      onClick={() => {
                        setRecentlyViewed([]);
                        sessionStorage.removeItem("partssource_recently_viewed");
                      }}
                      className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      Clear History
                    </button>
                  </div>
                  
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                    {recentlyViewed.map((item) => (
                      <div 
                        key={`recent-${item.id}`} 
                        onClick={() => handleViewListing(item)}
                        className="flex-shrink-0 w-64 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-xl p-3 flex gap-3 cursor-pointer transition-all hover:border-blue-300 group"
                      >
                        {/* Thumbnail Image */}
                        <div className="w-16 h-16 rounded-lg bg-slate-200 overflow-hidden shrink-0 relative">
                          <img 
                            src={item.images && item.images[0] ? item.images[0] : "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=300&q=80"} 
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          {item.isPremium && (
                            <span className="absolute top-1 left-1 bg-amber-500 text-[8px] font-extrabold text-white px-1 py-0.2 rounded-xs">
                              PRO
                            </span>
                          )}
                        </div>
                        
                        {/* Brief info */}
                        <div className="flex flex-col justify-between min-w-0 flex-1">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block truncate">
                              {item.category}
                            </span>
                            <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                              {item.title}
                            </h4>
                          </div>
                          
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-extrabold text-slate-900">
                              {new Intl.NumberFormat("en-ZA", {
                                style: "currency",
                                currency: "ZAR",
                                maximumFractionDigits: 0
                              }).format(item.price)}
                            </span>
                            <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                              {item.condition}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* listings grid */}
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20">
                  <div className="relative w-12 h-12">
                    <div className="w-12 h-12 border-4 border-slate-200 rounded-full animate-spin"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">Loading Marketplace Spares...</span>
                </div>
              ) : listings.length === 0 ? (
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto my-8 space-y-4 shadow-xs">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Search className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No Spares Matching Filters</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    We couldn't find any listings matching your active filters. Try searching for broader terms (e.g., "Hilux", "Brakes", "Toyota") or clear your filters to explore.
                  </p>
                  <button 
                    onClick={clearAllFilters}
                    className="bg-slate-950 hover:bg-blue-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer transition-colors"
                  >
                    Clear Filters & Show All
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto pr-1">
                  {listings.map((item) => (
                    <div key={item.id} className="h-full">
                      <ListingCard 
                        listing={item} 
                        onViewDetails={() => handleViewListing(item)} 
                        onViewSellerProfile={(sellerId) => {
                          setSelectedSellerId(sellerId);
                          setActiveTab("seller-profile");
                        }}
                        isCompared={comparedListingIds.includes(item.id)}
                        onToggleCompare={handleToggleCompare}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* PRICING VIEW */}
          {activeTab === "pricing" && (
            <div className="max-w-4xl mx-auto w-full py-6 space-y-8 animate-fade-in">
              <div className="text-center space-y-3">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">
                  Pricing Plans
                </span>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">
                  Zero Commission, Just Clean Leads
                </h1>
                <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
                  We don't take a single cent of your parts sales. Advertisers subscribe to simple monthly plans based on active inventory. Sourced with premium leads.
                </p>
              </div>

              {/* Three Tier Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Tier 1: Starter */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Starter Plan
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Individual Mechanic</h3>
                    <div className="flex items-baseline gap-1 py-4 border-b border-slate-100">
                      <span className="text-3xl font-bold text-slate-900">R249</span>
                      <span className="text-xs text-slate-400 font-medium">/ month</span>
                    </div>
                    
                    <ul className="space-y-3 pt-6 text-xs text-slate-600 font-medium">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Up to 5 active advertisements</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Standard Search visibility</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Direct phone and email contact</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Basic Lead Contact Forms</span>
                      </li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => handleSelectPricingPlan("Starter")}
                    className="w-full border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors py-2.5 rounded-xl text-xs font-bold mt-8 cursor-pointer"
                  >
                    Select Starter Plan
                  </button>
                </div>

                {/* Tier 2: Pro */}
                <div className="bg-white border-2 border-blue-600 rounded-2xl p-6 flex flex-col justify-between shadow-md relative">
                  <div className="absolute top-0 right-6 -translate-y-1/2 bg-blue-600 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block mb-1">
                      Pro Plan
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Automotive Workshops</h3>
                    <div className="flex items-baseline gap-1 py-4 border-b border-slate-100">
                      <span className="text-3xl font-bold text-slate-900">R499</span>
                      <span className="text-xs text-slate-400 font-medium">/ month</span>
                    </div>
                    
                    <ul className="space-y-3 pt-6 text-xs text-slate-600 font-medium">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Up to 35 active advertisements</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-blue-700 font-bold">Premium Spotlight Badge</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Priority Search Visibility</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Instant WhatsApp Direct Lead Routing</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Gemini AI description generator</span>
                      </li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => handleSelectPricingPlan("Pro")}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors py-2.5 rounded-xl text-xs font-bold mt-8 cursor-pointer shadow-sm"
                  >
                    Select Pro Plan
                  </button>
                </div>

                {/* Tier 3: Enterprise */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between shadow-xs">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      Enterprise Plan
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Importers & Yards</h3>
                    <div className="flex items-baseline gap-1 py-4 border-b border-slate-100">
                      <span className="text-3xl font-bold text-slate-900">R999</span>
                      <span className="text-xs text-slate-400 font-medium">/ month</span>
                    </div>
                    
                    <ul className="space-y-3 pt-6 text-xs text-slate-600 font-medium">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-bold text-slate-900">Unlimited advertisements</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Premium Spotlight Badge</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Premium top search ranking</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Auto listing feed sync (CSV / XML)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Dedicated Account Executive</span>
                      </li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => handleSelectPricingPlan("Enterprise")}
                    className="w-full border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-colors py-2.5 rounded-xl text-xs font-bold mt-8 cursor-pointer"
                  >
                    Select Enterprise Plan
                  </button>
                </div>

              </div>

              {/* Secure Transaction Note */}
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs text-slate-500 max-w-xl mx-auto text-center sm:text-left">
                <ShieldCheck className="w-8 h-8 text-blue-600 shrink-0" />
                <p className="leading-relaxed">
                  All transactions are secure and encrypted via South African merchant pathways. You can upgrade, downgrade, or cancel your advertisement plan at any time with no lock-in terms.
                </p>
              </div>
            </div>
          )}

          {/* SELLER PROFILE VIEW */}
          {activeTab === "seller-profile" && selectedSellerId && (() => {
            const profileListings = listings.filter(l => l.sellerId === selectedSellerId);
            const profileSeller = profileListings[0];
            const profileSellerName = profileSeller?.sellerBusinessName || profileSeller?.sellerName || (seller?.id === selectedSellerId ? (seller?.businessName || seller?.name) : "Distributor Profile");
            const profileSellerEmail = profileSeller?.sellerEmail || (seller?.id === selectedSellerId ? seller?.email : "");
            const profileSellerPhone = profileSeller?.sellerPhone || (seller?.id === selectedSellerId ? seller?.phone : "");
            const profileSellerLocation = profileSeller?.location || "South Africa";

            return (
              <div className="max-w-5xl mx-auto w-full py-4 space-y-6 animate-fade-in flex flex-col flex-1 min-h-0">
                {/* Back Button */}
                <button 
                  onClick={() => {
                    setActiveTab("browse");
                    setSelectedSellerId(null);
                  }}
                  className="self-start flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Spares Marketplace</span>
                </button>

                {/* Seller Header Business Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Distributor</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>ZA Standard Vetted</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
                        {profileSellerName}
                      </h1>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Based in {profileSellerLocation}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                      This distributor has undergone standard background verification on Partssource ZA. All transactions and logistics are conducted directly with the seller with zero intermediate commission fees.
                    </p>
                  </div>

                  {/* Direct Connection Pane */}
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 md:w-80 space-y-4 shrink-0">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                      Direct Channel Sourcing
                    </h3>
                    
                    <div className="space-y-2 text-xs">
                      {profileSellerPhone && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone className="w-4 h-4 text-slate-400 font-medium shrink-0" />
                          <span className="font-semibold">{profileSellerPhone}</span>
                        </div>
                      )}
                      {profileSellerEmail && (
                        <div className="flex items-center gap-2 text-slate-700">
                          <Mail className="w-4 h-4 text-slate-400 font-medium shrink-0" />
                          <span className="font-semibold truncate">{profileSellerEmail}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {profileSellerPhone && (
                        <a 
                          href={`https://wa.me/${profileSellerPhone.replace(/\s+/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-[10px] text-center uppercase tracking-wider block transition-colors shadow-xs"
                        >
                          WhatsApp
                        </a>
                      )}
                      {profileSellerEmail && (
                        <a 
                          href={`mailto:${profileSellerEmail}`}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-[10px] text-center uppercase tracking-wider block transition-colors shadow-xs"
                        >
                          Email Inquiry
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seller Location & Clustered Nearby Distributors Google Map */}
                <SellerLocationMap
                  sellerName={profileSellerName}
                  sellerLocation={profileSellerLocation}
                  sellerPhone={profileSellerPhone}
                  sellerBusinessName={profileSeller?.sellerBusinessName || (seller?.id === selectedSellerId ? seller?.businessName : undefined)}
                />

                {/* Seller's Listings Stock Section */}
                <div className="space-y-4 flex-1 flex flex-col min-h-0">
                  <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                      Active Stock Catalog ({profileListings.length})
                    </h2>
                    <span className="text-xs text-slate-500">
                      Indexed stock update live
                    </span>
                  </div>

                  {profileListings.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto space-y-4 shadow-xs mt-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <Truck className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800">No Active Stock Advertisements</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        This seller currently does not have any active spare parts cataloged on the public marketplace. Check back later or make a direct inquiry.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-1 flex-1">
                      {profileListings.map((item) => (
                        <div key={item.id} className="h-full">
                          <ListingCard 
                            listing={item} 
                            onViewDetails={() => handleViewListing(item)} 
                            onViewSellerProfile={(sellerId) => {
                              setSelectedSellerId(sellerId);
                              setActiveTab("seller-profile");
                            }}
                            isCompared={comparedListingIds.includes(item.id)}
                            onToggleCompare={handleToggleCompare}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* SELLER DASHBOARD VIEW */}
          {activeTab === "dashboard" && (
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 overflow-y-auto">
              <SellerDashboard 
                seller={seller}
                setSeller={setSeller}
                onAddListing={handleAddListing}
                onDeleteListing={handleDeleteListing}
                sellerListings={seller ? listings.filter(l => l.sellerId === seller.id) : []}
                bankingDetails={bankingDetails}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            </div>
          )}

          {/* DUSTY ROAD / LIVE FOOTER STATUS BAR */}
          <footer className="h-12 border-t border-slate-200 flex items-center justify-between mt-auto bg-white -mx-6 lg:-mx-8 px-6 lg:px-8 flex-shrink-0">
            <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Active Sellers: {activeSellerCount}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span>Listed Spares: {listedItemsCount.toLocaleString("en-ZA")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Market Live</span>
            </div>
          </footer>

        </main>
      </div>

      {/* FLOAT AI SPARES DIAGNOSTIC ADVISOR PANEL */}
      <DiagnosticAdvisor 
        onSelectListing={(id) => {
          const matched = listings.find(l => l.id === id) || recentlyViewed.find(l => l.id === id);
          if (matched) {
            handleViewListing(matched);
          } else {
            setSelectedListingId(id);
          }
          // Auto switch to browse view if they are elsewhere, to display the modal correctly
          setActiveTab("browse");
        }} 
        listings={listings} 
      />

      {/* LISTING DETAILS MODAL CONTAINER */}
      {selectedListingId && selectedListing && (
        <ListingDetailsModal 
          listing={selectedListing} 
          onClose={() => setSelectedListingId(null)} 
          onViewSellerProfile={(sellerId) => {
            setSelectedSellerId(sellerId);
            setActiveTab("seller-profile");
          }}
          onOpenWebSearch={(q, prov, town) => handleOpenWebSearch(q, prov, town)}
        />
      )}

      {/* WEB SEARCH ENGINE MODAL */}
      <WebSearchEngineModal
        isOpen={isWebSearchOpen}
        onClose={() => setIsWebSearchOpen(false)}
        initialQuery={webSearchQuery}
        initialProvince={webSearchProvince}
        initialTown={webSearchTown}
        onSelectListing={(item) => {
          handleViewListing(item);
          setActiveTab("browse");
        }}
      />

      {/* FLOATING COMPARE FLOATING BAR */}
      {comparedListingIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white rounded-2xl p-3 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 sm:gap-6 animate-slide-up w-[92%] max-w-2xl">
          <div className="flex items-center gap-3 overflow-x-auto py-0.5 max-w-[55%] sm:max-w-[65%]">
            <div className="flex items-center gap-1.5 shrink-0">
              <ArrowLeftRight className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-slate-200">
                Compare ({comparedListingIds.length}/4)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {comparedListingIds.map((id) => {
                const item = listings.find((l) => l.id === id) || recentlyViewed.find((l) => l.id === id);
                if (!item) return null;
                return (
                  <div key={`thumb-${id}`} className="relative shrink-0 group">
                    <img
                      src={item.images[0] || "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&q=80&w=600"}
                      alt={item.title}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-700 bg-slate-800"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      onClick={() => handleToggleCompare(id)}
                      className="absolute -top-1 -right-1 bg-slate-800 hover:bg-red-500 text-slate-300 hover:text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold border border-slate-600 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setComparedListingIds([])}
              className="text-xs font-medium text-slate-400 hover:text-slate-200 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={() => setIsCompareModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Compare Parts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* SIDE-BY-SIDE COMPARE MODAL */}
      {isCompareModalOpen && comparedListingIds.length > 0 && (
        <CompareModal
          comparedListings={comparedListingIds
            .map((id) => listings.find((l) => l.id === id) || recentlyViewed.find((l) => l.id === id))
            .filter((l): l is PartListing => l !== undefined)}
          onClose={() => setIsCompareModalOpen(false)}
          onRemove={(id) => setComparedListingIds((prev) => prev.filter((item) => item !== id))}
          onClearAll={() => {
            setComparedListingIds([]);
            setIsCompareModalOpen(false);
          }}
          onViewDetails={(listing) => handleViewListing(listing)}
        />
      )}

      {/* APP OWNER PASSWORD PROTECTED SETTINGS MODAL */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        bankingDetails={bankingDetails}
      />
    </div>
  );
}
