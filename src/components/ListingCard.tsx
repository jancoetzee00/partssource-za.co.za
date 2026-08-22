/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PartListing } from "../types";
import { MapPin, Truck, Car, Star, MessageSquare, ArrowLeftRight, Check, ShieldCheck, ArrowUpRight } from "lucide-react";

interface ListingCardProps {
  listing: PartListing;
  onViewDetails: (id: string) => void;
  onViewSellerProfile?: (sellerId: string) => void;
  isCompared?: boolean;
  onToggleCompare?: (id: string) => void;
  sellerRating?: number;
  sellerReviewsCount?: number;
}

export const ListingCard: React.FC<ListingCardProps> = ({ 
  listing, 
  onViewDetails, 
  onViewSellerProfile,
  isCompared = false,
  onToggleCompare,
  sellerRating,
  sellerReviewsCount
}) => {
  // Format price in South African Rand (ZAR)
  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getConditionBadge = (cond: string) => {
    switch (cond) {
      case "New": 
        return { dot: "bg-emerald-500", text: "text-emerald-800", bg: "bg-emerald-50 border-emerald-200/80" };
      case "Like New": 
        return { dot: "bg-teal-500", text: "text-teal-800", bg: "bg-teal-50 border-teal-200/80" };
      case "Refurbished": 
        return { dot: "bg-blue-500", text: "text-blue-800", bg: "bg-blue-50 border-blue-200/80" };
      case "Good": 
        return { dot: "bg-amber-500", text: "text-amber-800", bg: "bg-amber-50 border-amber-200/80" };
      case "Fair": 
        return { dot: "bg-orange-500", text: "text-orange-800", bg: "bg-orange-50 border-orange-200/80" };
      case "For Parts": 
        return { dot: "bg-rose-500", text: "text-rose-800", bg: "bg-rose-50 border-rose-200/80" };
      default: 
        return { dot: "bg-slate-400", text: "text-slate-700", bg: "bg-slate-50 border-slate-200" };
    }
  };

  const condStyle = getConditionBadge(listing.condition);

  return (
    <div 
      id={`listing-${listing.id}`}
      className={`group relative bg-white rounded-2xl transition-all duration-300 border flex flex-col h-full overflow-hidden hover:-translate-y-1 hover:shadow-xl cursor-pointer ${
        listing.isPremium 
          ? "border-blue-300 ring-2 ring-blue-500/10 shadow-sm" 
          : "border-slate-200/90 shadow-2xs hover:border-slate-300"
      }`}
      onClick={() => onViewDetails(listing.id)}
    >
      {/* Image Gallery Thumbnail */}
      <div className="h-48 sm:h-52 overflow-hidden bg-slate-100 relative">
        <img 
          src={listing.images[0] || "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&q=80&w=600"} 
          alt={listing.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
        />

        {/* Top Badges Bar */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          {/* Left: Premium / Featured Tag */}
          <div className="flex items-center gap-1.5">
            {listing.isPremium ? (
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-white" />
                <span>Verified Stock</span>
              </span>
            ) : (
              <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Verified Yard</span>
              </span>
            )}
          </div>

          {/* Right: Vehicle Fleet Indicator */}
          <div className="bg-slate-900/85 backdrop-blur-md text-white text-[11px] font-bold px-2 py-1 rounded-xl shadow-xs flex items-center gap-1">
            {listing.vehicleType === "Truck" ? (
              <>
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px]">Truck</span>
              </>
            ) : listing.vehicleType === "Car" ? (
              <>
                <Car className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px]">Car</span>
              </>
            ) : (
              <span className="text-[10px]">Fleet</span>
            )}
          </div>
        </div>

        {/* Bottom Overlay Info */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-3 pt-7 flex items-center justify-between">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 backdrop-blur-md bg-white/90 shadow-2xs ${condStyle.text} ${condStyle.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${condStyle.dot}`} />
            {listing.condition}
          </span>

          {onToggleCompare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare(listing.id);
              }}
              title={isCompared ? "Remove from comparison" : "Add to side-by-side comparison"}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all duration-200 flex items-center gap-1 shadow-xs cursor-pointer ${
                isCompared
                  ? "bg-blue-600 text-white border-blue-500 font-extrabold ring-2 ring-blue-400/40"
                  : "bg-slate-900/80 backdrop-blur-md text-slate-200 border-slate-700/80 hover:bg-blue-600 hover:text-white hover:border-blue-500"
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
                  <span>Compare</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-grow justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
              {listing.category}
            </span>
            {listing.brand && (
              <span className="text-[11px] font-semibold text-slate-500 truncate max-w-[120px]">
                {listing.brand}
              </span>
            )}
          </div>

          <h3 className="font-display font-bold text-slate-900 text-sm md:text-[15px] leading-snug line-clamp-2 min-h-[2.4rem] group-hover:text-blue-600 transition-colors">
            {listing.title}
          </h3>
          
          {/* Fitment Compatibility */}
          <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 text-xs">
            <p className="text-slate-600 line-clamp-1 text-[11px]">
              <strong className="text-slate-800">Fits:</strong> {listing.compatibility}
            </p>
          </div>

          {/* OEM Part Number & Seller */}
          <div className="flex items-center justify-between pt-1 text-xs">
            {listing.partNumber ? (
              <span className="font-mono text-[10px] bg-slate-100 border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                OEM: {listing.partNumber}
              </span>
            ) : <span />}

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 min-w-0">
              <span className="text-slate-400 shrink-0">By:</span>
              {onViewSellerProfile ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewSellerProfile(listing.sellerId);
                  }}
                  className="font-bold text-slate-800 hover:text-blue-600 hover:underline truncate max-w-[120px] cursor-pointer"
                >
                  {listing.sellerBusinessName || listing.sellerName}
                </button>
              ) : (
                <span className="font-semibold text-slate-800 truncate max-w-[120px]">
                  {listing.sellerBusinessName || listing.sellerName}
                </span>
              )}

              {sellerRating !== undefined && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded-md shrink-0">
                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  <span>{sellerRating.toFixed(1)}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Section: Location & Pricing */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1 text-[11px] truncate">
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate font-medium">{listing.location}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                Price (ZAR)
              </span>
              <span className="font-display font-black text-base md:text-lg text-slate-900 tracking-tight">
                {formatPrice(listing.price)}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Direct WhatsApp Quick Launch */}
              <a
                href={`https://wa.me/${listing.sellerPhone.replace(/\s+/g, "").replace("+", "")}?text=${encodeURIComponent(
                  `Hi ${listing.sellerName}, I saw your listing for "${listing.title}" (R${listing.price.toLocaleString("en-ZA")}) on Partssource ZA. Is this still available?`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title="WhatsApp Seller Directly"
                className="bg-emerald-500 hover:bg-emerald-600 text-white p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer shadow-xs hover:scale-105"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
              </a>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(listing.id);
                }}
                className="bg-slate-950 hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all duration-200 shadow-xs flex items-center gap-1 cursor-pointer group-hover:bg-blue-600"
              >
                <span>View</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
