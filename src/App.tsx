/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { PartListing, PartRequest, Seller, SubscriptionBankingDetails, SellerReview } from "./types";
import { SA_PROVINCES, getTownsForProvince, matchesLocation } from "./data/saLocations";
import { ListingCard } from "./components/ListingCard";
import { ListingDetailsModal } from "./components/ListingDetailsModal";
import { SellerDashboard } from "./components/SellerDashboard";
import { DiagnosticAdvisor } from "./components/DiagnosticAdvisor";
import { CompareModal } from "./components/CompareModal";
import { SellerLocationMap } from "./components/SellerLocationMap";
import { SettingsModal } from "./components/SettingsModal";
import { WebSearchEngineModal } from "./components/WebSearchEngineModal";
import { RequestPartModal } from "./components/RequestPartModal";
import { PartRequestsView } from "./components/PartRequestsView";
import { EftPaymentModal } from "./components/EftPaymentModal";
import { DesktopDownloadModal } from "./components/DesktopDownloadModal";
import { QuickFiltersBar } from "./components/QuickFiltersBar";
import { LeaveReviewModal } from "./components/LeaveReviewModal";
import { SellerReviewsSection } from "./components/SellerReviewsSection";
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  subscribeToListings, 
  addListingToFirestore, 
  deleteListingFromFirestore, 
  subscribeToBankingDetails,
  subscribeToPartRequests,
  subscribeToSellerReviews,
  calculateSellerRatingStats,
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
  Navigation,
  ChevronDown,
  ChevronUp,
  Layers,
  Building2,
  Filter,
  Star,
  Monitor,
  Download,
  Laptop
} from "lucide-react";

export default function App() {
  // Navigation & Views
  const [activeTab, setActiveTab] = useState<"browse" | "pricing" | "dashboard" | "seller-profile" | "requests">("browse");
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);

  // Part Requests State & Modal
  const [partRequests, setPartRequests] = useState<PartRequest[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState<boolean>(false);
  const [initialRequestQuery, setInitialRequestQuery] = useState<string>("");

  // Desktop App Installation & PWA State
  const [isDesktopModalOpen, setIsDesktopModalOpen] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  // EFT Payment Modal State
  const [isEftModalOpen, setIsEftModalOpen] = useState<boolean>(false);
  const [eftModalPurpose, setEftModalPurpose] = useState<"subscription" | "part_purchase" | "general">("subscription");
  const [eftModalAmount, setEftModalAmount] = useState<number | undefined>(undefined);
  const [eftModalRef, setEftModalRef] = useState<string | undefined>(undefined);
  const [eftTargetSellerId, setEftTargetSellerId] = useState<string | undefined>(undefined);
  const [eftTargetSellerName, setEftTargetSellerName] = useState<string | undefined>(undefined);
  const [eftTargetListingId, setEftTargetListingId] = useState<string | undefined>(undefined);
  const [eftTargetListingTitle, setEftTargetListingTitle] = useState<string | undefined>(undefined);

  // Seller Reviews & 5-Star Rating State
  const [sellerReviews, setSellerReviews] = useState<SellerReview[]>([]);
  const [isLeaveReviewModalOpen, setIsLeaveReviewModalOpen] = useState<boolean>(false);
  const [reviewTargetSellerId, setReviewTargetSellerId] = useState<string>("");
  const [reviewTargetSellerName, setReviewTargetSellerName] = useState<string>("");
  const [reviewTargetPartPurchased, setReviewTargetPartPurchased] = useState<string>("");

  // Mobile Accordion State
  const [isMobileCategoryAccordionOpen, setIsMobileCategoryAccordionOpen] = useState<boolean>(false);

  // Web Search Engine State
  const [isWebSearchOpen, setIsWebSearchOpen] = useState<boolean>(false);
  const [webSearchQuery, setWebSearchQuery] = useState<string>("");
  const [webSearchProvince, setWebSearchProvince] = useState<string>("All Provinces");
  const [webSearchTown, setWebSearchTown] = useState<string>("All Towns");

  // Listings State
  const [listings, setListings] = useState<PartListing[]>([]);
  const [rawListings, setRawListings] = useState<PartListing[]>([]);
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

  // Recently Viewed State
  const [recentlyViewed, setRecentlyViewed] = useState<PartListing[]>([]);

  // Seller State & Settings State
  const [seller, setSeller] = useState<Seller | null>(null);
  const [bankingDetails, setBankingDetails] = useState<SubscriptionBankingDetails>(DEFAULT_BANKING_DETAILS);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Stats State
  const [activeSellerCount, setActiveSellerCount] = useState<number>(452);
  const [listedItemsCount, setListedItemsCount] = useState<number>(15402);

  // Memoized local app detection
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

  // Listen for browser PWA beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

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

    // Check URL parameters for direct shared listing links (e.g. from WhatsApp sharing)
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const sharedListingId = params.get("listingId") || params.get("partId");
      if (sharedListingId) {
        setSelectedListingId(sharedListingId);
      }
    }
  }, []);

  // Subscribe to Banking Details from Firestore
  useEffect(() => {
    const unsub = subscribeToBankingDetails((data) => {
      setBankingDetails(data);
    });
    return () => unsub();
  }, []);

  // Subscribe to Part Requests from Firestore
  useEffect(() => {
    const unsub = subscribeToPartRequests((reqs) => {
      setPartRequests(reqs);
    });
    return () => unsub();
  }, []);

  // Subscribe to Seller Reviews & 5-Star Feedback from Firestore
  useEffect(() => {
    const unsub = subscribeToSellerReviews((loadedReviews) => {
      setSellerReviews(loadedReviews);
    });
    return () => unsub();
  }, []);

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
  }, [seller]);

  const handleOpenEftModal = (
    purpose: "subscription" | "part_purchase" | "general" = "subscription", 
    amount?: number, 
    ref?: string,
    targetSellerId?: string,
    targetSellerName?: string,
    targetListingId?: string,
    targetListingTitle?: string
  ) => {
    setEftModalPurpose(purpose);
    setEftModalAmount(amount);
    setEftModalRef(ref);
    setEftTargetSellerId(targetSellerId);
    setEftTargetSellerName(targetSellerName);
    setEftTargetListingId(targetListingId);
    setEftTargetListingTitle(targetListingTitle);
    setIsEftModalOpen(true);
  };

  const handleOpenLeaveReview = (sellerId: string, sellerName: string, partPurchased: string = "") => {
    setReviewTargetSellerId(sellerId);
    setReviewTargetSellerName(sellerName);
    setReviewTargetPartPurchased(partPurchased);
    setIsLeaveReviewModalOpen(true);
  };

  const getSellerRatingStats = (sellerId: string) => {
    return calculateSellerRatingStats(sellerId, sellerReviews);
  };

  const handleOpenWebSearch = (initialQ?: string, initialProv?: string, initialTown?: string) => {
    setWebSearchQuery(initialQ || searchQuery || "");
    setWebSearchProvince(initialProv || selectedProvince || "All Provinces");
    setWebSearchTown(initialTown || selectedTown || "All Towns");
    setIsWebSearchOpen(true);
  };

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

  const handleViewListing = (listing: PartListing) => {
    setSelectedListingId(listing.id);
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((item) => item.id !== listing.id);
      const updated = [listing, ...filtered].slice(0, 5);
      sessionStorage.setItem("partssource_recently_viewed", JSON.stringify(updated));
      return updated;
    });
  };

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
        setRawListings(initialWithIds as PartListing[]);
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
        setRawListings(firestoreItems);
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
    <div className="bg-[#f8fafc] w-full min-h-screen overflow-hidden flex flex-col font-sans text-slate-900 tracking-tight selection:bg-blue-600 selection:text-white">
      {/* Top Header Navigation */}
      <nav className="glass-panel sticky top-0 border-b border-slate-200/90 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 z-30 shadow-2xs">
        {/* Left Brand Container */}
        <div 
          className="flex items-center gap-3 cursor-pointer group shrink-0"
          onClick={() => { setActiveTab("browse"); clearAllFilters(); }}
        >
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <div className="w-4 h-4 border-2 border-white rotate-45 flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-amber-400 rotate-45"></div>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-lg font-black tracking-tight text-slate-900 font-display">
                PARTSSOURCE
              </span>
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-2xs">
                .ZA
              </span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase hidden sm:block">
              SA Heavy & Auto Spares Network
            </span>
          </div>
        </div>

        {/* Dynamic Navigation Search (only visible on browse view) */}
        <div className={`flex-1 max-w-xl px-2 sm:px-6 lg:px-8 transition-all ${activeTab === "browse" ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="relative flex items-center">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  handleOpenWebSearch(searchQuery);
                }
              }}
              placeholder="Search truck & car spares, OEM part #, engine code..." 
              className="w-full bg-slate-100/90 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-full py-2 pl-9.5 pr-28 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 placeholder-slate-400 shadow-inner"
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="text-[11px] text-slate-400 hover:text-slate-600 font-bold px-1.5 cursor-pointer"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={() => handleOpenWebSearch(searchQuery)}
                className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-1 rounded-full flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                title="Search live automotive web & scrap yards with AI Grounding"
              >
                <Globe className="w-3 h-3" />
                <span className="hidden md:inline">AI Web</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Nav Options */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3">
          {/* Direct "Request a Part" Action Button */}
          <button
            onClick={() => {
              setInitialRequestQuery(searchQuery || "");
              setIsRequestModalOpen(true);
            }}
            className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 text-xs font-black px-3 sm:px-4 py-2 rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 shrink-0"
            title="Broadcast hard-to-find part request to 450+ scrapyards"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
            <span className="hidden sm:inline">Request Part</span>
            <span className="sm:hidden">Request</span>
          </button>

          {/* Browse Spares Tab */}
          <button 
            onClick={() => { setActiveTab("browse"); }}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer hidden md:flex items-center gap-1 ${
              activeTab === "browse" 
                ? "bg-slate-900 text-white shadow-2xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Spares</span>
          </button>

          {/* Part Requests Live Hub Tab */}
          <button 
            onClick={() => { setActiveTab("requests"); }}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "requests" 
                ? "bg-slate-900 text-white shadow-2xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <span>Requests</span>
            {partRequests.filter(r => r.status !== 'fulfilled' && r.status !== 'closed').length > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                {partRequests.filter(r => r.status !== 'fulfilled' && r.status !== 'closed').length}
              </span>
            )}
          </button>

          {/* Pricing Tab */}
          <button 
            onClick={() => { setActiveTab("pricing"); }}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer hidden lg:block ${
              activeTab === "pricing" 
                ? "bg-slate-900 text-white shadow-2xs" 
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Pricing
          </button>

          {/* EFT Payments Link / Gateway */}
          <button
            onClick={() => handleOpenEftModal("subscription")}
            className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
            title="View verified SA EFT Banking details, bank app links & payment slip"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">EFT Hub</span>
          </button>

          {/* Download / Install Desktop App Header Button */}
          <button
            onClick={() => setIsDesktopModalOpen(true)}
            className="bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold px-2.5 sm:px-3.5 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
            title="Download and install Partssource ZA desktop application"
          >
            <Monitor className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Download App</span>
            <span className="md:hidden">App</span>
          </button>

          {/* Owner Settings: Only visible on local / dev app */}
          {isLocalApp && (
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-700 hover:text-blue-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1.5 rounded-full shadow-2xs"
              title="App Owner Settings & Banking Configuration (Local Mode Only)"
            >
              <Settings className="w-3.5 h-3.5 text-slate-700" />
              <span className="hidden xl:inline">Settings</span>
            </button>
          )}
          
          {seller ? (
            <button 
              onClick={() => { setActiveTab("dashboard"); }}
              className="bg-slate-950 hover:bg-blue-600 text-white px-3.5 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate max-w-[100px]">{seller.businessName || seller.name}</span>
            </button>
          ) : (
            <button 
              onClick={() => { setActiveTab("dashboard"); }}
              className="bg-slate-950 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs hover:shadow-md"
            >
              Seller Hub
            </button>
          )}
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR FILTER PANEL - Only visible during browse mode */}
        {activeTab === "browse" && (
          <aside className="w-72 bg-white border-r border-slate-200/90 p-5 flex flex-col flex-shrink-0 hidden md:flex overflow-y-auto space-y-5">
            {/* Filter Reset Button */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Refine Spares</span>
              </div>
              {(selectedProvince || selectedTown || selectedCategory || selectedVehicleType || selectedCondition || minPrice || maxPrice || searchQuery) && (
                <button 
                  onClick={clearAllFilters}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Reset All
                </button>
              )}
            </div>

            {/* Filter Section: Location Narrowing (Province & Town) */}
            <div className="space-y-3 pb-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Province (RSA)</span>
                </h3>
                {(selectedProvince || selectedTown) && (
                  <button
                    onClick={() => {
                      setSelectedProvince(null);
                      setSelectedTown(null);
                    }}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Province Select Dropdown */}
              <div>
                <select
                  value={selectedProvince || ""}
                  onChange={(e) => handleProvinceSelect(e.target.value ? e.target.value : null)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
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
              {selectedProvince && (
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                    Town in {selectedProvince}
                  </label>
                  <select
                    value={selectedTown || ""}
                    onChange={(e) => setSelectedTown(e.target.value ? e.target.value : null)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">All Towns in {selectedProvince}</option>
                    {availableTowns.map((town) => (
                      <option key={town} value={town}>
                        {town}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quick Major Province Chips */}
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Popular Hubs:
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { name: "Gauteng", label: "GP" },
                    { name: "Western Cape", label: "WC" },
                    { name: "KwaZulu-Natal", label: "KZN" },
                    { name: "Eastern Cape", label: "EC" }
                  ].map((p) => {
                    const isSelected = selectedProvince === p.name;
                    return (
                      <button
                        key={p.name}
                        onClick={() => handleProvinceSelect(isSelected ? null : p.name)}
                        className={`text-[10px] py-1 rounded-lg font-bold transition-all text-center cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Filter Section: Vehicle / Fleet Type */}
            <div className="space-y-3 pb-5 border-b border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Vehicle Fitment</h3>
              <div className="grid grid-cols-3 gap-1 text-xs">
                {[
                  { label: "All", val: null },
                  { label: "Trucks", val: "Truck" },
                  { label: "Cars", val: "Car" }
                ].map((item) => {
                  const isChecked = selectedVehicleType === item.val;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setSelectedVehicleType(item.val as any)}
                      className={`py-1.5 rounded-lg text-center font-bold text-[11px] transition-all cursor-pointer ${
                        isChecked
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/60"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Section: Category Selectors */}
            <div className="space-y-2 pb-5 border-b border-slate-100 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Categories</h3>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-[10px] text-blue-600 hover:underline font-semibold"
                  >
                    All
                  </button>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-600 max-h-56 overflow-y-auto pr-1">
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left p-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                    selectedCategory === null 
                      ? "bg-blue-50 text-blue-700 font-bold" 
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <span>All Categories</span>
                  {selectedCategory === null && <Check className="w-3.5 h-3.5 text-blue-600" />}
                </button>
                {categoriesList.map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={`w-full text-left p-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      selectedCategory === cat 
                        ? "bg-blue-50 text-blue-700 font-bold" 
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className="truncate">{cat}</span>
                    {selectedCategory === cat && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Section: Condition */}
            <div className="space-y-3 pb-5 border-b border-slate-100">
              <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Condition</h3>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                {["New", "Like New", "Refurbished", "Good", "Fair", "For Parts"].map((cond) => {
                  const isChecked = selectedCondition === cond;
                  return (
                    <button
                      key={cond}
                      onClick={() => setSelectedCondition(isChecked ? null : cond)}
                      className={`py-1.5 px-2 rounded-lg border text-center transition-all font-bold cursor-pointer ${
                        isChecked 
                          ? "bg-slate-950 text-white border-slate-950 shadow-xs" 
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
            <div className="space-y-3 pb-4">
              <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">Price Range (ZAR)</h3>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Min (R)" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
                <span className="text-slate-300 text-xs">-</span>
                <input 
                  type="number" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
                  placeholder="Max (R)" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              {/* Quick Price Range Presets */}
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                <button
                  onClick={() => { setMinPrice(0); setMaxPrice(1000); }}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-1.5 rounded-lg border border-slate-200 text-center font-medium"
                >
                  Under R1,000
                </button>
                <button
                  onClick={() => { setMinPrice(1000); setMaxPrice(5000); }}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-1.5 rounded-lg border border-slate-200 text-center font-medium"
                >
                  R1k - R5k
                </button>
                <button
                  onClick={() => { setMinPrice(5000); setMaxPrice(20000); }}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-1.5 rounded-lg border border-slate-200 text-center font-medium"
                >
                  R5k - R20k
                </button>
                <button
                  onClick={() => { setMinPrice(20000); setMaxPrice(""); }}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 p-1.5 rounded-lg border border-slate-200 text-center font-medium"
                >
                  R20,000+
                </button>
              </div>
            </div>

            {/* Sidebar Seller Promo Card */}
            <div className="mt-auto pt-2">
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-4 text-white shadow-xs border border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-black uppercase tracking-wider">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span>SCRAPYARDS & SELLERS</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  List auto & truck spares to thousands of buyers with zero commission.
                </p>
                <button 
                  onClick={() => setActiveTab("dashboard")}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Open Seller Hub
                </button>
              </div>
            </div>
          </aside>
        )}

        {/* MAIN DYNAMIC CONTENT CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-6 overflow-y-auto min-w-0">
          
          {/* BROWSE VIEW */}
          {activeTab === "browse" && (
            <>
              {/* Automotive Hero Banner */}
              <div className="relative bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white rounded-3xl p-5 sm:p-7 shadow-lg border border-slate-800/90 overflow-hidden">
                {/* Decorative background grid & glow */}
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 space-y-4">
                  {/* Top pill & live counter */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <span>🇿🇦</span>
                        <span>South Africa Spares Network</span>
                      </span>
                      <span className="text-slate-400 text-xs hidden sm:inline">•</span>
                      <span className="text-slate-300 text-xs font-semibold hidden sm:inline">
                        450+ Verified Yards & Importers
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold text-[11px]">Direct WhatsApp Quotes</span>
                    </div>
                  </div>

                  {/* Headline & Pitch */}
                  <div className="space-y-1 max-w-3xl">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white font-display">
                      Find Hard-to-Find Truck & Car Spares Fast
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                      Direct connection to verified South African automotive breakers, scrapyards, and spares distributors across all 9 provinces. Zero buyer fees, instant EFT verification.
                    </p>
                  </div>

                  {/* Popular Quick Searches Presets */}
                  <div className="pt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                      Popular:
                    </span>
                    {[
                      "Toyota Hilux GD-6",
                      "Isuzu D-Max",
                      "VW Polo Vivo",
                      "Ford Ranger",
                      "Scania R500",
                      "Quantum Taxi",
                      "BMW N20 Turbo"
                    ].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setSearchQuery(preset)}
                        className="bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/15 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      onClick={() => {
                        setInitialRequestQuery(searchQuery || "");
                        setIsRequestModalOpen(true);
                      }}
                      className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                      <span>Broadcast a Part Request to 450+ Scrapyards</span>
                    </button>

                    <button
                      onClick={() => handleOpenWebSearch(searchQuery)}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-400/30 shadow-sm"
                    >
                      <Globe className="w-4 h-4" />
                      <span>Search Live Automotive Web (AI)</span>
                    </button>

                    <button
                      onClick={() => setIsDesktopModalOpen(true)}
                      className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/15 shadow-sm"
                    >
                      <Monitor className="w-4 h-4 text-blue-400" />
                      <span>Download Desktop App</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Marketplace Header & Sorting */}
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 font-display">
                      {selectedCategory ? selectedCategory : "Available Spares Catalog"}
                    </h2>
                    <span className="bg-slate-200 text-slate-800 text-xs font-black px-2.5 py-0.5 rounded-full">
                      {listings.length}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {selectedProvince ? `Filtered by ${selectedProvince}` : "Vetted stock across South Africa"}
                  </p>
                </div>

                {/* Sorting Controls & Mobile Category Accordion */}
                <div className="flex items-center gap-2">
                  <div className="bg-white border border-slate-200/90 px-3 py-2 rounded-xl text-xs flex items-center gap-2 shadow-2xs">
                    <span className="text-slate-400 font-semibold">Sort:</span>
                    <select 
                      value={sortOrder} 
                      onChange={(e) => setSortOrder(e.target.value)}
                      className="font-bold text-slate-800 bg-transparent border-none outline-hidden p-0 cursor-pointer text-xs"
                    >
                      <option value="newest">Featured / Newest</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                    </select>
                  </div>
                  
                  {/* Mobile Category Trigger */}
                  <div className="md:hidden">
                    <button 
                      onClick={() => setIsMobileCategoryAccordionOpen(!isMobileCategoryAccordionOpen)}
                      className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer ${
                        selectedCategory || isMobileCategoryAccordionOpen
                          ? "bg-blue-600 text-white"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                      title="Toggle Category Filter Menu"
                    >
                      <Layers className="w-4 h-4" />
                      <span>{selectedCategory ? selectedCategory : "Filter"}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMobileCategoryAccordionOpen ? "rotate-180" : ""}`} />
                    </button>
                  </div>
                </div>
              </header>

              {/* MOBILE ACCORDION CATEGORY DROPDOWN PANEL (md:hidden) */}
              <div className="md:hidden">
                <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all">
                  {/* Accordion Trigger Header */}
                  <button
                    type="button"
                    onClick={() => setIsMobileCategoryAccordionOpen(!isMobileCategoryAccordionOpen)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
                    aria-expanded={isMobileCategoryAccordionOpen}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        selectedCategory ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
                      }`}>
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {selectedCategory ? `Category: ${selectedCategory}` : "All Spare Part Categories"}
                          </span>
                          {selectedCategory && (
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                              Filtered
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {isMobileCategoryAccordionOpen ? "Tap to close category menu" : "Tap to browse all 10 part categories & fitments"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 text-slate-500 pl-2">
                      <span className="text-[11px] font-bold text-blue-600">
                        {isMobileCategoryAccordionOpen ? "Close" : "Browse"}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isMobileCategoryAccordionOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {/* Accordion Expandable Menu Body */}
                  {isMobileCategoryAccordionOpen && (
                    <div className="border-t border-slate-100 p-3.5 bg-slate-50/60 space-y-3.5 animate-fadeIn">
                      {/* Top Action Bar in Accordion */}
                      <div className="flex items-center justify-between px-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Select a Category ({categoriesList.length})
                        </span>
                        {selectedCategory && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategory(null);
                              setIsMobileCategoryAccordionOpen(false);
                            }}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                          >
                            Reset Category
                          </button>
                        )}
                      </div>

                      {/* Categories Grid (2 Columns on mobile for quick tap navigation) */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* All Categories Option */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory(null);
                            setIsMobileCategoryAccordionOpen(false);
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between cursor-pointer ${
                            selectedCategory === null
                              ? "bg-blue-600 text-white border-blue-600 shadow-xs font-bold"
                              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <span className="truncate">All Categories</span>
                          {selectedCategory === null && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>

                        {/* List of categories */}
                        {categoriesList.map((cat) => {
                          const isSelected = selectedCategory === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(isSelected ? null : cat);
                                setIsMobileCategoryAccordionOpen(false);
                              }}
                              className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? "bg-blue-600 text-white border-blue-600 shadow-xs font-bold"
                                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                              }`}
                            >
                              <span className="truncate mr-1">{cat}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      {/* Vehicle Fleet Type Quick Bar inside Accordion */}
                      <div className="pt-2.5 border-t border-slate-200/80">
                        <div className="flex items-center justify-between mb-1.5 px-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Vehicle Type Fitment:
                          </span>
                          {selectedVehicleType && (
                            <button 
                              onClick={() => setSelectedVehicleType(null)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-1.5 text-xs">
                          {[
                            { label: "All Types", val: null },
                            { label: "Trucks", val: "Truck" },
                            { label: "Cars", val: "Car" }
                          ].map((item) => {
                            const isSel = selectedVehicleType === item.val;
                            return (
                              <button
                                key={item.label}
                                type="button"
                                onClick={() => setSelectedVehicleType(item.val as any)}
                                className={`py-1.5 px-2 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                                  isSel
                                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {item.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Part Sourcing Broadcast Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                      Live Sourcing Hub
                    </span>
                    <span className="text-xs text-blue-300 font-bold">
                      Can't find your exact spare part?
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Broadcast a Part Request to 450+ verified South African scrap yards & receive direct WhatsApp quotes.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setInitialRequestQuery(searchQuery || "");
                      setIsRequestModalOpen(true);
                    }}
                    className="flex-1 sm:flex-initial bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02] shrink-0"
                  >
                    <PlusCircle className="w-4 h-4 text-slate-950" />
                    <span>Request a Part</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("requests")}
                    className="flex-1 sm:flex-initial bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer border border-white/15 shrink-0"
                  >
                    <span>Part Requests ({partRequests.filter(r => r.status !== 'fulfilled' && r.status !== 'closed').length})</span>
                  </button>
                </div>
              </div>

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

              {/* Quick Filters Pill-Based Navigation Row */}
              <QuickFiltersBar 
                selectedVehicleType={selectedVehicleType === "Truck" || selectedVehicleType === "Car" ? selectedVehicleType : null}
                onSelectVehicleType={(type) => setSelectedVehicleType(type)}
                selectedCategory={selectedCategory}
                onSelectCategory={(cat) => setSelectedCategory(cat)}
                selectedCondition={selectedCondition}
                onSelectCondition={(cond) => setSelectedCondition(cond)}
                categoriesList={categoriesList}
                allListings={rawListings.length > 0 ? rawListings : listings}
                totalFilteredCount={listings.length}
                onClearFilters={clearAllFilters}
              />

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
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto my-8 space-y-4 shadow-xs">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <Search className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">No Spares Matching Current Filters</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Can't find what you're looking for? You can clear filters, search the web with AI, or broadcast a <strong className="text-slate-800">Part Request</strong> to 450+ verified South African scrap yards.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button 
                      onClick={clearAllFilters}
                      className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-colors"
                    >
                      Clear Filters
                    </button>
                    <button 
                      onClick={() => {
                        setInitialRequestQuery(searchQuery || "");
                        setIsRequestModalOpen(true);
                      }}
                      className="w-full sm:w-auto bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Post a Part Request</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto pr-1">
                  {listings.map((item) => {
                    const stats = getSellerRatingStats(item.sellerId);
                    return (
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
                          sellerRating={stats.averageRating}
                          sellerReviewsCount={stats.totalReviews}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* PRICING VIEW */}
          {activeTab === "pricing" && (
            <div className="max-w-5xl mx-auto w-full py-6 space-y-8 animate-fade-in">
              <div className="text-center space-y-3 max-w-2xl mx-auto">
                <span className="text-[11px] font-black text-blue-700 bg-blue-50 border border-blue-200/80 px-3.5 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                  Zero Commission Direct Advertising
                </span>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 font-display">
                  Transparent Plans for Workshops & Importers
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  We don't take a single cent of your parts sales. Advertisers subscribe to simple monthly plans based on active stock. All customer leads go directly to your WhatsApp.
                </p>
              </div>

              {/* Three Tier Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                
                {/* Tier 1: Starter */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      Starter Plan
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mb-2 font-display">Individual Mechanic</h3>
                    <div className="flex items-baseline gap-1 py-4 border-b border-slate-100">
                      <span className="text-3xl font-black text-slate-900 font-display">R{bankingDetails.starterPriceZar ?? 249}</span>
                      <span className="text-xs text-slate-400 font-bold">/ month</span>
                    </div>
                    
                    <ul className="space-y-3 pt-6 text-xs text-slate-600 font-medium">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Up to 5 active advertisements</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Standard search visibility</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Direct phone and email contact</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Direct WhatsApp inquiry links</span>
                      </li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => handleSelectPricingPlan("Starter")}
                    className="w-full border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all py-3 rounded-2xl text-xs font-black mt-8 cursor-pointer active:scale-95 shadow-2xs"
                  >
                    Select Starter Plan
                  </button>
                </div>

                {/* Tier 2: Pro */}
                <div className="bg-gradient-to-b from-blue-50/50 to-white border-2 border-blue-600 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-lg shadow-blue-600/10 relative">
                  <div className="absolute top-0 right-7 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Most Popular
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">
                      Pro Plan
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mb-2 font-display">Automotive Workshops</h3>
                    <div className="flex items-baseline gap-1 py-4 border-b border-blue-100/60">
                      <span className="text-3xl font-black text-slate-900 font-display">R{bankingDetails.proPriceZar ?? 499}</span>
                      <span className="text-xs text-slate-400 font-bold">/ month</span>
                    </div>
                    
                    <ul className="space-y-3 pt-6 text-xs text-slate-700 font-medium">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="font-bold text-slate-900">Up to 35 active advertisements</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="text-blue-700 font-bold">Verified PRO Spotlight Badge</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Priority top catalog search ranking</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>Instant WhatsApp direct lead routing</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>AI parts description & OEM matcher</span>
                      </li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => handleSelectPricingPlan("Pro")}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all py-3 rounded-2xl text-xs font-black mt-8 cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
                  >
                    Select Pro Plan
                  </button>
                </div>

                {/* Tier 3: Enterprise */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                      Enterprise Plan
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mb-2 font-display">Importers & Scrap Yards</h3>
                    <div className="flex items-baseline gap-1 py-4 border-b border-slate-100">
                      <span className="text-3xl font-black text-slate-900 font-display">R{bankingDetails.enterprisePriceZar ?? 999}</span>
                      <span className="text-xs text-slate-400 font-bold">/ month</span>
                    </div>
                    
                    <ul className="space-y-3 pt-6 text-xs text-slate-600 font-medium">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="font-black text-slate-900">Unlimited advertisements</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Enterprise Verified Badge</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Bulk CSV inventory upload</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Dedicated Account Manager</span>
                      </li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => handleSelectPricingPlan("Enterprise")}
                    className="w-full border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all py-3 rounded-2xl text-xs font-black mt-8 cursor-pointer active:scale-95 shadow-2xs"
                  >
                    Select Enterprise Plan
                  </button>
                </div>

              </div>

              {/* EFT Direct Bank Transfer & Banking Slip Banner */}
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-800/80 text-emerald-100 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm">
                <div className="space-y-2 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                    <span className="bg-emerald-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      0% Processing Fees
                    </span>
                    <span className="text-xs font-bold text-emerald-300">
                      Direct South African Bank EFT Transfer
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white font-display">
                    Official EFT Banking Details & Instant Proof of Payment
                  </h4>
                  <p className="text-xs text-emerald-200/90 max-w-xl leading-relaxed">
                    Pay subscriptions or secure stock deposits directly via FNB, Standard Bank, Capitec, Nedbank, Absa, Discovery, or TymeBank. Upload your POP slip to activate listings instantly.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenEftModal("subscription", 499)}
                  className="bg-emerald-400 hover:bg-emerald-300 active:scale-95 text-slate-950 font-black text-xs px-6 py-3.5 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0 w-full md:w-auto"
                >
                  <Building2 className="w-4 h-4 text-slate-950" />
                  <span>View EFT Banking Details & Slip</span>
                </button>
              </div>

              {/* Secure Transaction Note */}
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-white border border-slate-200/80 p-5 rounded-2xl text-xs text-slate-500 max-w-xl mx-auto text-center sm:text-left shadow-2xs">
                <ShieldCheck className="w-8 h-8 text-blue-600 shrink-0" />
                <p className="leading-relaxed font-medium">
                  All transactions and banking details are encrypted and verified against official South African clearing regulations. Cancel or modify your plan anytime without penalties.
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
            const ratingStats = getSellerRatingStats(selectedSellerId);

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

                      {/* 5-Star Rating Header Pill */}
                      <button
                        type="button"
                        onClick={() => {
                          const revSection = document.getElementById("seller-reviews-section");
                          revSection?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/90 text-amber-900 text-xs font-bold px-3 py-1 rounded-full transition-colors cursor-pointer"
                        title="View reviews and feedback breakdown"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span className="font-extrabold">{ratingStats.averageRating.toFixed(1)}</span>
                        <span className="text-slate-600 font-medium">({ratingStats.totalReviews} Review{ratingStats.totalReviews === 1 ? "" : "s"})</span>
                      </button>

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

                    <button
                      type="button"
                      onClick={() => handleOpenLeaveReview(selectedSellerId, profileSellerName)}
                      className="w-full bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-bold py-2 rounded-xl text-[11px] text-center flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>Rate This Seller</span>
                    </button>
                  </div>
                </div>

                {/* Seller Location & Clustered Nearby Distributors Google Map */}
                <SellerLocationMap
                  sellerName={profileSellerName}
                  sellerLocation={profileSellerLocation}
                  sellerPhone={profileSellerPhone}
                  sellerBusinessName={profileSeller?.sellerBusinessName || (seller?.id === selectedSellerId ? seller?.businessName : undefined)}
                />

                {/* 5-STAR CUSTOMER REVIEWS & FEEDBACK SECTION */}
                <SellerReviewsSection
                  sellerId={selectedSellerId}
                  sellerName={profileSellerName}
                  sellerBusinessName={profileSeller?.sellerBusinessName || (seller?.id === selectedSellerId ? seller?.businessName : undefined)}
                  ratingStats={ratingStats}
                  onOpenLeaveReview={() => handleOpenLeaveReview(selectedSellerId, profileSellerName)}
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
                            sellerRating={ratingStats.averageRating}
                            sellerReviewsCount={ratingStats.totalReviews}
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
                onOpenEftModal={handleOpenEftModal}
              />
            </div>
          )}

          {/* PART REQUESTS SOURCING FEED VIEW */}
          {activeTab === "requests" && (
            <PartRequestsView 
              requests={partRequests}
              onOpenRequestModal={() => {
                setInitialRequestQuery(searchQuery || "");
                setIsRequestModalOpen(true);
              }}
              seller={seller}
            />
          )}

          {/* MODERN AUTOMOTIVE MARKETPLACE FOOTER */}
          <footer className="border-t border-slate-200/80 bg-white/90 backdrop-blur-md -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 flex-shrink-0 mt-auto flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold text-slate-500">
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="uppercase tracking-wider font-extrabold text-slate-900">Network Live</span>
              </div>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-slate-600">
                <strong className="text-slate-900">{activeSellerCount}</strong> Vetted Yards
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="text-slate-600">
                <strong className="text-slate-900">{listedItemsCount.toLocaleString("en-ZA")}</strong> Cataloged Spares
              </span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 text-xs">
              <button
                onClick={() => setIsDesktopModalOpen(true)}
                className="text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1 rounded-full flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title="Download & Install Partssource ZA to Desktop"
              >
                <Monitor className="w-3 h-3 text-blue-600" />
                <span>Download Desktop App</span>
              </button>

              <button
                onClick={() => handleOpenEftModal("general")}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title="View South African EFT Banking Details, Bank Links & POP submission"
              >
                <Building2 className="w-3 h-3 text-emerald-600" />
                <span>EFT Trust & POP</span>
              </button>

              <button
                onClick={() => {
                  setInitialRequestQuery(searchQuery || "");
                  setIsRequestModalOpen(true);
                }}
                className="text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1 rounded-full flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <PlusCircle className="w-3 h-3 text-amber-500" />
                <span>Request Part</span>
              </button>
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
      {selectedListingId && selectedListing && (() => {
        const stats = getSellerRatingStats(selectedListing.sellerId);
        return (
          <ListingDetailsModal 
            listing={selectedListing} 
            onClose={() => setSelectedListingId(null)} 
            onViewSellerProfile={(sellerId) => {
              setSelectedSellerId(sellerId);
              setActiveTab("seller-profile");
            }}
            onOpenWebSearch={(q, prov, town) => handleOpenWebSearch(q, prov, town)}
            onOpenEftModal={handleOpenEftModal}
            sellerRating={stats.averageRating}
            sellerReviewsCount={stats.totalReviews}
            onRateSeller={(sid, sname, ptitle) => handleOpenLeaveReview(sid, sname, ptitle)}
          />
        );
      })()}

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

      {/* REQUEST A PART SOURCING MODAL */}
      <RequestPartModal 
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        initialPartQuery={initialRequestQuery}
      />

      {/* EFT PAYMENT & BANKING DETAILS MODAL */}
      <EftPaymentModal
        isOpen={isEftModalOpen}
        onClose={() => setIsEftModalOpen(false)}
        bankingDetails={bankingDetails}
        initialPurpose={eftModalPurpose}
        initialAmountZar={eftModalAmount}
        initialReference={eftModalRef}
        targetSellerId={eftTargetSellerId}
        targetSellerName={eftTargetSellerName}
        targetListingId={eftTargetListingId}
        targetListingTitle={eftTargetListingTitle}
        sellerBusinessName={seller?.businessName || seller?.name}
        onOpenReviewModal={(sid, sname, ptitle) => handleOpenLeaveReview(sid, sname, ptitle)}
      />

      {/* 5-STAR SELLER RATING & FEEDBACK MODAL */}
      <LeaveReviewModal
        isOpen={isLeaveReviewModalOpen}
        onClose={() => setIsLeaveReviewModalOpen(false)}
        sellerId={reviewTargetSellerId}
        sellerName={reviewTargetSellerName}
        initialPartPurchased={reviewTargetPartPurchased}
      />

      {/* APP OWNER PASSWORD PROTECTED SETTINGS MODAL */}
      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        bankingDetails={bankingDetails}
      />

      {/* DESKTOP APP DOWNLOAD & INSTALLATION MODAL */}
      <DesktopDownloadModal
        isOpen={isDesktopModalOpen}
        onClose={() => setIsDesktopModalOpen(false)}
        deferredPrompt={deferredPrompt}
        onInstalled={() => setIsAppInstalled(true)}
      />
    </div>
  );
}
