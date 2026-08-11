/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PartListing } from "../types";
import { 
  X, 
  Check, 
  MapPin, 
  Truck, 
  Car, 
  MessageSquare, 
  ExternalLink, 
  Tag, 
  ShieldCheck, 
  DollarSign,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface CompareModalProps {
  comparedListings: PartListing[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onViewDetails: (listing: PartListing) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  comparedListings,
  onClose,
  onRemove,
  onClearAll,
  onViewDetails
}) => {
  if (comparedListings.length === 0) {
    return null;
  }

  // Find lowest price item for highlighting
  const minPrice = Math.min(...comparedListings.map((l) => l.price));

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
                Side-by-Side Parts Comparison
                <span className="text-xs bg-blue-600/80 font-mono text-blue-100 px-2.5 py-0.5 rounded-full font-bold">
                  {comparedListings.length} {comparedListings.length === 1 ? "Item" : "Items"}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Compare pricing, compatibility, part numbers and condition before contacting distributors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClearAll}
              className="text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-slate-800 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body / Scrollable Table */}
        <div className="p-4 sm:p-6 overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full min-w-[650px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="p-3 text-left w-44 min-w-[170px] text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 rounded-tl-xl align-top">
                  Part Specification
                </th>
                {comparedListings.map((listing) => {
                  const isLowestPrice = listing.price === minPrice && comparedListings.length > 1;
                  return (
                    <th 
                      key={listing.id} 
                      className="p-3 text-left min-w-[220px] max-w-[280px] bg-white align-top border-l border-slate-100 relative group"
                    >
                      <div className="relative space-y-3">
                        {/* Remove Button */}
                        <button
                          onClick={() => onRemove(listing.id)}
                          title="Remove from comparison"
                          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-100 hover:bg-red-100 hover:text-red-600 text-slate-400 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>

                        {/* Lowest Price Badge */}
                        {isLowestPrice && (
                          <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            <Check className="w-3 h-3" /> Best Value Price
                          </div>
                        )}

                        {/* Image */}
                        <div className="w-full h-32 rounded-xl bg-slate-100 overflow-hidden relative border border-slate-200/80">
                          <img
                            src={listing.images[0] || "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&q=80&w=600"}
                            alt={listing.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Title & Category */}
                        <div>
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                            {listing.category}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm line-clamp-2 mt-0.5">
                            {listing.title}
                          </h3>
                        </div>

                        {/* Price Display */}
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                          <span className="text-[10px] text-slate-400 font-medium uppercase block">Asking Price</span>
                          <span className={`text-lg font-bold font-display ${isLowestPrice ? "text-emerald-600" : "text-slate-900"}`}>
                            {formatPrice(listing.price)}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <a
                            href={`https://wa.me/${listing.sellerPhone.replace(/\s+/g, "").replace("+", "")}?text=${encodeURIComponent(
                              `Hi ${listing.sellerName}, I am comparing spare parts on Partssource ZA and interested in "${listing.title}" (R${listing.price.toLocaleString("en-ZA")}). Is this still available?`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 transition-colors shadow-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>

                          <button
                            onClick={() => {
                              onViewDetails(listing);
                              onClose();
                            }}
                            className="bg-slate-900 hover:bg-blue-600 text-white text-[11px] font-bold py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 transition-colors shadow-xs cursor-pointer"
                          >
                            <span>Inspect</span>
                          </button>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {/* PRICE ROW */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-semibold text-slate-500 bg-slate-50/70">
                  Price (ZAR)
                </td>
                {comparedListings.map((l) => (
                  <td key={l.id} className="p-3 font-bold text-slate-900 border-l border-slate-100">
                    <span className={l.price === minPrice && comparedListings.length > 1 ? "text-emerald-600 font-extrabold" : ""}>
                      {formatPrice(l.price)}
                    </span>
                  </td>
                ))}
              </tr>

              {/* VEHICLE TYPE ROW */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-semibold text-slate-500 bg-slate-50/70">
                  Vehicle Suitability
                </td>
                {comparedListings.map((l) => (
                  <td key={l.id} className="p-3 border-l border-slate-100">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      {l.vehicleType === "Truck" ? (
                        <>
                          <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>Heavy Truck</span>
                        </>
                      ) : l.vehicleType === "Car" ? (
                        <>
                          <Car className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Passenger Car</span>
                        </>
                      ) : (
                        <span>{l.vehicleType}</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* CONDITION ROW */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-semibold text-slate-500 bg-slate-50/70">
                  Condition Rating
                </td>
                {comparedListings.map((l) => (
                  <td key={l.id} className="p-3 border-l border-slate-100">
                    <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${getConditionColor(l.condition)}`}>
                      {l.condition}
                    </span>
                  </td>
                ))}
              </tr>

              {/* PART NUMBER ROW */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-semibold text-slate-500 bg-slate-50/70">
                  OEM / Part Number
                </td>
                {comparedListings.map((l) => (
                  <td key={l.id} className="p-3 border-l border-slate-100 font-mono text-slate-800">
                    {l.partNumber ? (
                      <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-bold">
                        {l.partNumber}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unspecified</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* BRAND ROW */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-semibold text-slate-500 bg-slate-50/70">
                  Brand / Manufacturer
                </td>
                {comparedListings.map((l) => (
                  <td key={l.id} className="p-3 border-l border-slate-100 font-medium text-slate-800">
                    {l.brand || "Generic / Aftermarket"}
                  </td>
                ))}
              </tr>

              {/* COMPATIBILITY ROW */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-semibold text-slate-500 bg-slate-50/70">
                  Engine & Vehicle Fitment
                </td>
                {comparedListings.map((l) => (
                  <td key={l.id} className="p-3 border-l border-slate-100 text-slate-700 leading-relaxed">
                    <p className="bg-blue-50/60 border border-blue-100 p-2 rounded-lg text-xs font-medium">
                      {l.compatibility}
                    </p>
                  </td>
                ))}
              </tr>

              {/* LOCATION ROW */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-semibold text-slate-500 bg-slate-50/70">
                  Location (South Africa)
                </td>
                {comparedListings.map((l) => (
                  <td key={l.id} className="p-3 border-l border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{l.location}</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* DISTRIBUTOR / SELLER ROW */}
              <tr className="hover:bg-slate-50/50">
                <td className="p-3 font-semibold text-slate-500 bg-slate-50/70">
                  Verified Advertiser
                </td>
                {comparedListings.map((l) => (
                  <td key={l.id} className="p-3 border-l border-slate-100">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 block">
                        {l.sellerBusinessName || l.sellerName}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Vetted Distributor
                      </span>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Tip: You can compare up to 4 spare parts simultaneously to find the best match for your fleet.</span>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
