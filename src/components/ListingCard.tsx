/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PartListing } from "../types";
import { MapPin, ShieldAlert, Tag, Truck, Car, Star, MessageSquare, ArrowLeftRight, Check } from "lucide-react";

interface ListingCardProps {
  listing: PartListing;
  onViewDetails: (id: string) => void;
  onViewSellerProfile?: (sellerId: string) => void;
  isCompared?: boolean;
  onToggleCompare?: (id: string) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ 
  listing, 
  onViewDetails, 
  onViewSellerProfile,
  isCompared = false,
  onToggleCompare
}) => {
  // Format price in South African Rand (ZAR)
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getConditionColor = (cond: string) => {
    switch (cond) {
      case "New": return "bg-green-100 text-green-800 border-green-200";
      case "Like New": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Refurbished": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Good": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Fair": return "bg-orange-100 text-orange-800 border-orange-200";
      case "For Parts": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div 
      id={`listing-${listing.id}`}
      className={`group relative bg-white rounded-2xl shadow-xs hover:shadow-md transition-all duration-300 border overflow-hidden flex flex-col h-full ${
        listing.isPremium 
          ? "border-blue-500/80 ring-2 ring-blue-500/10" 
          : "border-slate-200"
      }`}
    >
      {/* Premium Spotlight Ribbon */}
      {listing.isPremium && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs uppercase tracking-wider">
          <Star className="w-3 h-3 fill-white" />
          <span>PREMIUM</span>
        </div>
      )}

      {/* Vehicle Type Indicator (Top Right) */}
      <div className="absolute top-3 right-3 z-10 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-medium p-1.5 rounded-lg shadow-xs flex items-center justify-center">
        {listing.vehicleType === "Truck" ? (
          <Truck className="w-4 h-4" title="Truck Parts" />
        ) : listing.vehicleType === "Car" ? (
          <Car className="w-4 h-4" title="Car Parts" />
        ) : (
          <span className="text-[10px] px-1 font-bold">CAR & TRUCK</span>
        )}
      </div>

      {/* Image Gallery Thumbnail */}
      <div className="h-48 overflow-hidden bg-slate-100 relative">
        <img 
          src={listing.images[0] || "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&q=80&w=600"} 
          alt={listing.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8 flex items-center justify-between">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm border uppercase tracking-wider ${getConditionColor(listing.condition)}`}>
            {listing.condition}
          </span>

          {onToggleCompare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(listing.id);
              }}
              title={isCompared ? "Remove from comparison" : "Add to side-by-side comparison"}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all duration-200 flex items-center gap-1.5 shadow-xs cursor-pointer ${
                isCompared
                  ? "bg-blue-600 text-white border-blue-500 font-extrabold shadow-blue-500/30 ring-2 ring-blue-400/40"
                  : "bg-slate-900/80 backdrop-blur-xs text-slate-200 border-slate-700/80 hover:bg-blue-600 hover:text-white hover:border-blue-500"
              }`}
            >
              {isCompared ? (
                <>
                  <Check className="w-3 h-3 text-white stroke-[3]" />
                  <span>Compared</span>
                </>
              ) : (
                <>
                  <ArrowLeftRight className="w-3 h-3 text-slate-300" />
                  <span>+ Compare</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-grow">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          {listing.category}
        </span>
        <h3 className="font-display font-bold text-slate-900 text-sm md:text-base line-clamp-2 min-h-[2.5rem] group-hover:text-blue-600 transition-colors">
          {listing.title}
        </h3>
        
        {/* Compatibility highlight */}
        <p className="text-xs text-slate-500 line-clamp-1 mt-1 bg-slate-50 p-1.5 rounded-md border border-slate-100/80">
          <span className="font-semibold text-slate-600">Fits:</span> {listing.compatibility}
        </p>

        {/* Part Number & Brand if present */}
        <div className="flex gap-2 items-center mt-2 text-xs text-slate-400">
          {listing.partNumber && (
            <span className="bg-slate-100 px-1.5 py-0.5 rounded-sm font-mono text-[10px]">
              PN: {listing.partNumber}
            </span>
          )}
          {listing.brand && (
            <span className="text-slate-500 font-medium truncate max-w-[120px]">
              {listing.brand}
            </span>
          )}
        </div>

        {/* Seller Info */}
        <div className="flex items-center gap-1 mt-2.5 text-xs text-slate-500">
          <span className="text-[10px] uppercase font-bold text-slate-400">Seller:</span>
          {onViewSellerProfile ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewSellerProfile(listing.sellerId);
              }}
              className="font-bold text-blue-600 hover:text-blue-800 hover:underline text-left cursor-pointer transition-colors"
            >
              {listing.sellerBusinessName || listing.sellerName}
            </button>
          ) : (
            <span className="font-semibold text-slate-700">
              {listing.sellerBusinessName || listing.sellerName}
            </span>
          )}
        </div>

        {/* Location & Time */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3 border-t border-slate-100 pt-3">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{listing.location}</span>
        </div>

        {/* Price and Action Section */}
        <div className="mt-auto pt-4 flex items-center justify-between gap-2 border-t border-slate-100 mt-4">
          <div className="min-w-0">
            <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Price
            </span>
            <span className="font-display font-bold text-base md:text-lg text-slate-900 truncate block">
              {formatPrice(listing.price)}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            {/* WhatsApp Quick Action Button */}
            <a
              href={`https://wa.me/${listing.sellerPhone.replace(/\s+/g, "").replace("+", "")}?text=${encodeURIComponent(
                `Hi ${listing.sellerName}, I saw your listing for "${listing.title}" (R${listing.price.toLocaleString("en-ZA")}) on Partssource ZA. Is this still available?`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation(); // Stop click propagation to be safe
              }}
              title="WhatsApp Seller Instantly"
              className="bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-200 p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
            </a>

            <button
              onClick={() => onViewDetails(listing.id)}
              className="bg-slate-950 hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all duration-200 shadow-xs cursor-pointer shrink-0"
            >
              Get Spares
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
