/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import {
  Boxes,
  TrendingUp,
  Car,
  Truck,
  Building,
  Search,
  X,
  Trash2,
  CheckSquare,
  Square,
  RotateCcw,
  AlertOctagon,
  Eye,
  Tag,
  MapPin,
  Mail,
  Phone,
  MessageCircle,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Layers,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { PartListing, Seller } from "../../types";
import {
  deleteListingFromFirestore,
  deleteMultipleListingsFromFirestore,
  deleteAllListingsFromFirestore,
  resetInventoryToDefaultSeed
} from "../../lib/firestoreServices";

interface OwnerInventoryTabProps {
  listings: PartListing[];
  sellers: Seller[];
  ownerPasscode: string;
  initialSellerFilter?: string;
  onSelectSellerInSellersTab?: (sellerId: string) => void;
  onShowNotice: (msg: string) => void;
}

export const OwnerInventoryTab: React.FC<OwnerInventoryTabProps> = ({
  listings,
  sellers,
  ownerPasscode,
  initialSellerFilter = "All",
  onSelectSellerInSellersTab,
  onShowNotice
}) => {
  // Filters & Search
  const [listingSearch, setListingSearch] = useState<string>("");
  const [listingTypeFilter, setListingTypeFilter] = useState<string>("All");
  const [listingCategoryFilter, setListingCategoryFilter] = useState<string>("All");
  const [listingSellerFilter, setListingSellerFilter] = useState<string>(initialSellerFilter);
  const [listingConditionFilter, setListingConditionFilter] = useState<string>("All");
  const [listingSortBy, setListingSortBy] = useState<"newest" | "oldest" | "price_desc" | "price_asc" | "title">("newest");

  // Selection & Action states
  const [selectedListingIds, setSelectedListingIds] = useState<string[]>([]);
  const [inspectingListing, setInspectingListing] = useState<PartListing | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [deletingListing, setDeletingListing] = useState<PartListing | null>(null);
  const [isBatchDeleteConfirmOpen, setIsBatchDeleteConfirmOpen] = useState<boolean>(false);
  const [isPurgeAllConfirmOpen, setIsPurgeAllConfirmOpen] = useState<boolean>(false);
  const [isResetSeedConfirmOpen, setIsResetSeedConfirmOpen] = useState<boolean>(false);
  const [purgeInputText, setPurgeInputText] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Filtered & Sorted listings
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      const q = listingSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        l.title.toLowerCase().includes(q) ||
        (l.partNumber && l.partNumber.toLowerCase().includes(q)) ||
        (l.brand && l.brand.toLowerCase().includes(q)) ||
        (l.location && l.location.toLowerCase().includes(q)) ||
        (l.sellerName && l.sellerName.toLowerCase().includes(q)) ||
        (l.sellerBusinessName && l.sellerBusinessName.toLowerCase().includes(q)) ||
        (l.compatibility && l.compatibility.toLowerCase().includes(q)) ||
        (l.category && l.category.toLowerCase().includes(q)) ||
        (l.description && l.description.toLowerCase().includes(q));

      const matchesType =
        listingTypeFilter === "All" || l.vehicleType === listingTypeFilter;

      const matchesCategory =
        listingCategoryFilter === "All" || l.category === listingCategoryFilter;

      const matchesSeller =
        listingSellerFilter === "All" || l.sellerId === listingSellerFilter;

      const matchesCondition =
        listingConditionFilter === "All" || l.condition === listingConditionFilter;

      return matchesSearch && matchesType && matchesCategory && matchesSeller && matchesCondition;
    }).sort((a, b) => {
      if (listingSortBy === "price_desc") return b.price - a.price;
      if (listingSortBy === "price_asc") return a.price - b.price;
      if (listingSortBy === "title") return a.title.localeCompare(b.title);
      if (listingSortBy === "oldest") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [listings, listingSearch, listingTypeFilter, listingCategoryFilter, listingSellerFilter, listingConditionFilter, listingSortBy]);

  // Inventory Metrics
  const totalInventoryCount = listings.length;
  const totalInventoryValueZar = listings.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
  const carPartsCount = listings.filter((l) => l.vehicleType === "Car").length;
  const truckPartsCount = listings.filter((l) => l.vehicleType === "Truck").length;
  const uniqueSellersWithListings = new Set(listings.map((l) => l.sellerId)).size;

  // Selected items data
  const selectedListingsData = listings.filter((l) => selectedListingIds.includes(l.id));
  const selectedListingsTotalZar = selectedListingsData.reduce((acc, l) => acc + (Number(l.price) || 0), 0);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedListingIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredListings.map((l) => l.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedListingIds.includes(id));
    if (allSelected) {
      setSelectedListingIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedListingIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Single Delete
  const handleDeleteSingleConfirm = async () => {
    if (!deletingListing) return;
    setIsProcessing(true);
    try {
      await deleteListingFromFirestore(deletingListing.id);
      setSelectedListingIds((prev) => prev.filter((id) => id !== deletingListing.id));
      if (inspectingListing?.id === deletingListing.id) {
        setInspectingListing(null);
      }
      onShowNotice(`Listing "${deletingListing.title}" was permanently deleted from the marketplace inventory.`);
      setDeletingListing(null);
    } catch (err: any) {
      console.error("Delete single listing error:", err);
      alert("Failed to delete listing: " + (err.message || String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Delete
  const handleDeleteBatchConfirm = async () => {
    if (selectedListingIds.length === 0) return;
    setIsProcessing(true);
    try {
      const count = await deleteMultipleListingsFromFirestore(selectedListingIds);
      setSelectedListingIds([]);
      setIsBatchDeleteConfirmOpen(false);
      onShowNotice(`Successfully deleted ${count} selected part listing${count === 1 ? '' : 's'} from marketplace inventory.`);
    } catch (err: any) {
      console.error("Batch delete error:", err);
      alert("Failed to delete selected items: " + (err.message || String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  // Purge All
  const handlePurgeAllConfirm = async () => {
    const isAuthorized =
      purgeInputText.trim().toUpperCase() === "DELETE ALL" ||
      purgeInputText === (ownerPasscode || "admin123");

    if (!isAuthorized) {
      alert('Please type "DELETE ALL" or your owner passcode to authorize master inventory purge.');
      return;
    }

    setIsProcessing(true);
    try {
      const count = await deleteAllListingsFromFirestore();
      setSelectedListingIds([]);
      setIsPurgeAllConfirmOpen(false);
      setPurgeInputText("");
      onShowNotice(`Complete Master Inventory Purge: ${count} listings permanently removed.`);
    } catch (err: any) {
      console.error("Purge all error:", err);
      alert("Failed to purge inventory: " + (err.message || String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset Demo
  const handleResetDemoSeed = async () => {
    setIsProcessing(true);
    try {
      const count = await resetInventoryToDefaultSeed();
      setSelectedListingIds([]);
      setIsResetSeedConfirmOpen(false);
      onShowNotice(`Restored default South African sample catalog with ${count} OEM parts.`);
    } catch (err: any) {
      console.error("Reset inventory error:", err);
      alert("Failed to reset sample inventory: " + (err.message || String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Total Listings</span>
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-display text-slate-900">
            {totalInventoryCount}
          </div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold mb-1">
            <span>Catalog Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-display text-emerald-900">
            R{totalInventoryValueZar.toLocaleString()}
          </div>
        </div>

        <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-blue-700 text-xs font-semibold mb-1">
            <span>Cars vs Trucks</span>
            <div className="flex gap-1 text-blue-600">
              <Car className="w-3.5 h-3.5" />
              <Truck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-sm font-bold text-slate-900 flex items-center gap-2 mt-1">
            <span>{carPartsCount} Car</span>
            <span className="text-slate-300">|</span>
            <span>{truckPartsCount} Truck</span>
          </div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold mb-1">
            <span>Active Sellers</span>
            <Building className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-display text-amber-900">
            {uniqueSellersWithListings}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={listingSearch}
              onChange={(e) => setListingSearch(e.target.value)}
              placeholder="Search title, OEM part #, brand, seller, town..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {listingSearch && (
              <button
                onClick={() => setListingSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Vehicle Type Filter */}
          <select
            value={listingTypeFilter}
            onChange={(e) => setListingTypeFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="All">All Vehicle Types</option>
            <option value="Car">Cars Only</option>
            <option value="Truck">Trucks Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={listingCategoryFilter}
            onChange={(e) => setListingCategoryFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 max-w-[140px] truncate"
          >
            <option value="All">All Categories</option>
            <option value="Engine Parts">Engine Parts</option>
            <option value="Brakes">Brakes</option>
            <option value="Suspension & Steering">Suspension</option>
            <option value="Gearboxes & Transmissions">Transmissions</option>
            <option value="Body Parts">Body Parts</option>
            <option value="Electrical">Electrical</option>
            <option value="Wheels & Tyres">Wheels & Tyres</option>
            <option value="Interior">Interior</option>
          </select>

          {/* Seller Filter */}
          <select
            value={listingSellerFilter}
            onChange={(e) => setListingSellerFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500 max-w-[150px] truncate"
          >
            <option value="All">All Sellers</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.businessName || s.name}
              </option>
            ))}
          </select>

          {/* Sort dropdown */}
          <select
            value={listingSortBy}
            onChange={(e) => setListingSortBy(e.target.value as any)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="newest">Newest Listed</option>
            <option value="oldest">Oldest Listed</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="title">Title: A to Z</option>
          </select>
        </div>

        {/* Master Action & Bulk Operations Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
          <div className="flex items-center gap-2">
            {/* Select All Checkbox */}
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
            >
              {filteredListings.length > 0 &&
              filteredListings.every((l) => selectedListingIds.includes(l.id)) ? (
                <CheckSquare className="w-4 h-4 text-red-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                {filteredListings.length > 0 &&
                filteredListings.every((l) => selectedListingIds.includes(l.id))
                  ? "Deselect All Filtered"
                  : `Select All (${filteredListings.length})`}
              </span>
            </button>

            {selectedListingIds.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="bg-red-100 text-red-800 text-xs font-extrabold px-2.5 py-1 rounded-xl">
                  {selectedListingIds.length} item{selectedListingIds.length === 1 ? "" : "s"} selected (R{selectedListingsTotalZar.toLocaleString()})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedListingIds([])}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Deletion & Restore Actions */}
          <div className="flex items-center gap-2">
            {/* Bulk Delete Selected Button */}
            {selectedListingIds.length > 0 && (
              <button
                type="button"
                onClick={() => setIsBatchDeleteConfirmOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer animate-in fade-in"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Selected ({selectedListingIds.length})</span>
              </button>
            )}

            {/* Restore Demo Catalog */}
            <button
              type="button"
              onClick={() => setIsResetSeedConfirmOpen(true)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Restore demo South African spare parts"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span>Reset Demo Spares</span>
            </button>

            {/* Master Purge All Inventory */}
            <button
              type="button"
              onClick={() => setIsPurgeAllConfirmOpen(true)}
              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Purge all inventory items from Firestore"
            >
              <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
              <span>Purge All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Listings Table */}
      {filteredListings.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">No Inventory Listings Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {listingSearch || listingTypeFilter !== "All" || listingCategoryFilter !== "All" || listingSellerFilter !== "All"
                ? "No spare parts match your current search and filter combination."
                : "Your marketplace inventory is currently empty. You can restore sample demo parts or wait for sellers to post new spares."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsResetSeedConfirmOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl inline-flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Default Demo Spares</span>
          </button>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="p-3">Part Details</th>
                  <th className="p-3">Category & Type</th>
                  <th className="p-3">Seller / Scrapyard</th>
                  <th className="p-3 text-right">Price (ZAR)</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredListings.map((item) => {
                  const isSelected = selectedListingIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? "bg-red-50/40" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                        />
                      </td>

                      {/* Part Details */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.images?.[0] || "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=300"}
                            alt={item.title}
                            className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100 cursor-pointer hover:opacity-90"
                            onClick={() => {
                              setInspectingListing(item);
                              setActiveImageIndex(0);
                            }}
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingListing(item);
                                setActiveImageIndex(0);
                              }}
                              className="font-bold text-slate-900 hover:text-blue-600 line-clamp-1 text-left cursor-pointer"
                            >
                              {item.title}
                            </button>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                              {item.partNumber && (
                                <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                  OEM #{item.partNumber}
                                </span>
                              )}
                              {item.brand && (
                                <span className="text-slate-600 font-medium">
                                  {item.brand}
                                </span>
                              )}
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500 truncate">
                                {item.location || "South Africa"}
                              </span>
                            </div>
                            {item.compatibility && (
                              <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                                Fits: {item.compatibility}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category & Type */}
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                item.vehicleType === "Truck"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {item.vehicleType === "Truck" ? (
                                <Truck className="w-3 h-3" />
                              ) : (
                                <Car className="w-3 h-3" />
                              )}
                              <span>{item.vehicleType}</span>
                            </span>

                            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                              {item.condition}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium truncate max-w-[120px]">
                            {item.category}
                          </div>
                        </div>
                      </td>

                      {/* Seller / Scrapyard */}
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 truncate max-w-[150px]">
                            {item.sellerBusinessName || item.sellerName}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                            {item.sellerPhone || item.sellerEmail}
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="p-3 text-right">
                        <div className="font-extrabold text-slate-900 text-sm">
                          R{Number(item.price).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-ZA") : "Live"}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setInspectingListing(item);
                              setActiveImageIndex(0);
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View Full Part Details & Specifications"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingListing(item)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete this listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-800">{filteredListings.length}</strong> of <strong className="text-slate-800">{listings.length}</strong> total listings
            </span>
            {selectedListingIds.length > 0 && (
              <span className="text-red-600 font-semibold">
                {selectedListingIds.length} item{selectedListingIds.length === 1 ? "" : "s"} flagged for deletion
              </span>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DETAILED PART INSPECTION MODAL */}
      {/* ======================================================== */}
      {inspectingListing && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150 text-left max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                      inspectingListing.vehicleType === "Truck" ? "bg-purple-900 text-purple-300" : "bg-blue-900 text-blue-300"
                    }`}>
                      {inspectingListing.vehicleType}
                    </span>
                    <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {inspectingListing.condition}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold font-display text-white mt-0.5 line-clamp-1">
                    {inspectingListing.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setInspectingListing(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Image Gallery */}
              <div className="space-y-2">
                <div className="aspect-video sm:aspect-2/1 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                  <img
                    src={inspectingListing.images?.[activeImageIndex] || inspectingListing.images?.[0] || "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800"}
                    alt={inspectingListing.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-mono font-bold px-3 py-1 rounded-full">
                    R{Number(inspectingListing.price).toLocaleString()}
                  </div>
                </div>

                {inspectingListing.images && inspectingListing.images.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {inspectingListing.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                          activeImageIndex === idx ? "border-blue-600 ring-2 ring-blue-500/20" : "border-slate-200 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt="thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">OEM Part Number</span>
                  <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                    {inspectingListing.partNumber || "Not specified"}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Brand / Manufacturer</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {inspectingListing.brand || "OEM Original"}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Category</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {inspectingListing.category}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Location</span>
                  <span className="font-bold text-slate-900 mt-0.5 block flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{inspectingListing.location || "South Africa"}</span>
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Listing Date</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {inspectingListing.createdAt ? new Date(inspectingListing.createdAt).toLocaleDateString("en-ZA") : "Live"}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Listing ID</span>
                  <span className="font-mono text-slate-600 text-[10px] mt-0.5 block truncate">
                    {inspectingListing.id}
                  </span>
                </div>
              </div>

              {/* Compatibility */}
              {inspectingListing.compatibility && (
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 space-y-1">
                  <span className="text-xs font-bold text-blue-900 block flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-blue-600" />
                    <span>Vehicle & Engine Compatibility:</span>
                  </span>
                  <p className="text-xs text-blue-800 leading-relaxed font-medium">
                    {inspectingListing.compatibility}
                  </p>
                </div>
              )}

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                  Description & Item Condition Notes:
                </span>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                  {inspectingListing.description || "No specific description provided for this spare part."}
                </div>
              </div>

              {/* Seller Information Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>Listed By Seller / Scrap Yard:</span>
                  </span>
                  {onSelectSellerInSellersTab && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSellerInSellersTab(inspectingListing.sellerId);
                        setInspectingListing(null);
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer flex items-center gap-1"
                    >
                      <span>View Seller Profile</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Business Name:</span>
                    <span className="font-bold text-slate-900">
                      {inspectingListing.sellerBusinessName || inspectingListing.sellerName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Contact Person:</span>
                    <span className="font-bold text-slate-900">{inspectingListing.sellerName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{inspectingListing.sellerEmail}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{inspectingListing.sellerPhone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDeletingListing(inspectingListing);
                }}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete This Part</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectingListing(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Done / Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SINGLE LISTING DELETION CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deletingListing && (
        <div className="fixed inset-0 z-70 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4 text-left animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Part from Inventory?</h3>
                <p className="text-xs text-slate-500">This action will remove the listing from PartsSource ZA immediately.</p>
              </div>
            </div>

            {/* Part Preview Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <img
                src={deletingListing.images?.[0] || "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=300"}
                alt={deletingListing.title}
                className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 truncate">{deletingListing.title}</h4>
                <div className="text-xs font-extrabold text-blue-700 mt-0.5">
                  R{Number(deletingListing.price).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  Seller: {deletingListing.sellerBusinessName || deletingListing.sellerName}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
              <span className="font-bold block">Permanent Deletion Notice:</span>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                This spare part will no longer appear in buyer searches, vehicle catalog feeds, or direct WhatsApp inquiries.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingListing(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteSingleConfirm}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Confirm & Delete Item</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* BULK BATCH DELETE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {isBatchDeleteConfirmOpen && (
        <div className="fixed inset-0 z-70 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-5 space-y-4 text-left animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete {selectedListingIds.length} Selected Parts?
                </h3>
                <p className="text-xs text-slate-500">
                  Total inventory value to be deleted: <strong className="text-slate-900">R{selectedListingsTotalZar.toLocaleString()}</strong>
                </p>
              </div>
            </div>

            {/* List of items preview */}
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl p-2 bg-slate-50 text-xs">
              {selectedListingsData.map((item) => (
                <div key={item.id} className="py-1.5 flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800 truncate">{item.title}</span>
                  <span className="font-mono text-slate-600 font-bold shrink-0">R{Number(item.price).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Are you sure you want to permanently delete all {selectedListingIds.length} selected spare part listings? This cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchDeleteConfirmOpen(false)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteBatchConfirm}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>Confirm Bulk Deletion ({selectedListingIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PURGE ALL INVENTORY CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {isPurgeAllConfirmOpen && (
        <div className="fixed inset-0 z-70 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xl w-full max-w-md p-5 space-y-4 text-left animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-700">Master Inventory Purge</h3>
                <p className="text-xs text-slate-500">Wipe all {listings.length} listings from the marketplace.</p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-900 space-y-1.5">
              <span className="font-bold block">⚠️ Danger: Irreversible Operation</span>
              <p className="text-red-800 text-[11px] leading-relaxed">
                This will delete every single spare part listing currently in your Firestore database (Total Catalog Value: <strong>R{totalInventoryValueZar.toLocaleString()}</strong>).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Type <code className="bg-slate-100 text-red-600 px-1 py-0.5 rounded font-mono">DELETE ALL</code> or your passcode:
              </label>
              <input
                type="text"
                value={purgeInputText}
                onChange={(e) => setPurgeInputText(e.target.value)}
                placeholder="Type DELETE ALL..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsPurgeAllConfirmOpen(false);
                  setPurgeInputText("");
                }}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePurgeAllConfirm}
                disabled={isProcessing || (purgeInputText.trim().toUpperCase() !== "DELETE ALL" && purgeInputText !== (ownerPasscode || "admin123"))}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <AlertOctagon className="w-3.5 h-3.5" />
                )}
                <span>Purge Entire Inventory</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* RESET SAMPLE DEMO CATALOG MODAL */}
      {/* ======================================================== */}
      {isResetSeedConfirmOpen && (
        <div className="fixed inset-0 z-70 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4 text-left animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reset Demo Spares Catalog?</h3>
                <p className="text-xs text-slate-500">Restore the default South African sample parts.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This will re-populate Firestore with standard OEM sample parts (Toyota Hilux injectors, Scania R480 brake pads, VW Polo cylinder head, Volvo FH12 airbags).
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetSeedConfirmOpen(false)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleResetDemoSeed}
                disabled={isProcessing}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isProcessing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="w-3.5 h-3.5" />
                )}
                <span>Restore Demo Catalog</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
