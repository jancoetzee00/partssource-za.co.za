/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { PartListing } from "../types";
import { 
  Truck, 
  Car, 
  Layers, 
  Zap, 
  Wrench, 
  Sparkles, 
  RotateCcw, 
  Check, 
  X, 
  SlidersHorizontal,
  CircleDot,
  ShieldCheck,
  Package,
  Cpu
} from "lucide-react";

interface QuickFiltersBarProps {
  selectedVehicleType: "Truck" | "Car" | null;
  onSelectVehicleType: (type: "Truck" | "Car" | null) => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  selectedCondition: string | null;
  onSelectCondition: (condition: string | null) => void;
  categoriesList: string[];
  allListings: PartListing[];
  totalFilteredCount: number;
  onClearFilters: () => void;
}

export const QuickFiltersBar: React.FC<QuickFiltersBarProps> = ({
  selectedVehicleType,
  onSelectVehicleType,
  selectedCategory,
  onSelectCategory,
  selectedCondition,
  onSelectCondition,
  categoriesList,
  allListings,
  totalFilteredCount,
  onClearFilters
}) => {
  // Compute vehicle type counts from raw listings
  const vehicleCounts = React.useMemo(() => {
    let truck = 0;
    let car = 0;
    allListings.forEach((item) => {
      if (item.vehicleType === "Truck") truck++;
      else if (item.vehicleType === "Car") car++;
    });
    return { all: allListings.length, truck, car };
  }, [allListings]);

  // Compute category counts
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allListings.forEach((item) => {
      // If a vehicle type is selected, we can count within that type for tighter context
      if (!selectedVehicleType || item.vehicleType === selectedVehicleType) {
        counts[item.category] = (counts[item.category] || 0) + 1;
      }
    });
    return counts;
  }, [allListings, selectedVehicleType]);

  // Map category to an appropriate icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Engine Parts":
        return <Wrench className="w-3.5 h-3.5" />;
      case "Transmission":
        return <RotateCcw className="w-3.5 h-3.5" />;
      case "Brakes":
        return <CircleDot className="w-3.5 h-3.5" />;
      case "Suspension & Steering":
        return <SlidersHorizontal className="w-3.5 h-3.5" />;
      case "Body Panels":
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case "Electrical":
        return <Zap className="w-3.5 h-3.5" />;
      case "Wheels & Tyres":
        return <CircleDot className="w-3.5 h-3.5" />;
      case "Interior":
        return <Cpu className="w-3.5 h-3.5" />;
      case "Accessories":
        return <Sparkles className="w-3.5 h-3.5" />;
      default:
        return <Package className="w-3.5 h-3.5" />;
    }
  };

  const hasActiveQuickFilter = Boolean(selectedVehicleType || selectedCategory || selectedCondition);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
      {/* Top Header & Vehicle Fleet Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
        {/* Left: Quick Filters Title & Vehicle Type Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-xs tracking-tight mr-1">
            <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </span>
            <span className="uppercase text-[11px] font-black tracking-wider text-slate-700">
              Quick Filters:
            </span>
          </div>

          {/* Vehicle Type Pills */}
          <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-xl gap-1">
            <button
              id="filter-vehicle-all"
              type="button"
              onClick={() => onSelectVehicleType(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedVehicleType === null
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Vehicles</span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                selectedVehicleType === null ? "bg-slate-700 text-slate-200" : "bg-slate-200 text-slate-600"
              }`}>
                {vehicleCounts.all}
              </span>
            </button>

            <button
              id="filter-vehicle-truck"
              type="button"
              onClick={() => onSelectVehicleType(selectedVehicleType === "Truck" ? null : "Truck")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedVehicleType === "Truck"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Heavy Trucks</span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                selectedVehicleType === "Truck" ? "bg-blue-800 text-blue-100" : "bg-slate-200 text-slate-600"
              }`}>
                {vehicleCounts.truck}
              </span>
            </button>

            <button
              id="filter-vehicle-car"
              type="button"
              onClick={() => onSelectVehicleType(selectedVehicleType === "Car" ? null : "Car")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedVehicleType === "Car"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Cars & Bakkies</span>
              <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                selectedVehicleType === "Car" ? "bg-blue-800 text-blue-100" : "bg-slate-200 text-slate-600"
              }`}>
                {vehicleCounts.car}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Condition Quick Toggles & Reset */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {/* Quick Condition Pills */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {["Used", "Refurbished", "New"].map((cond) => {
              const isSelected = selectedCondition === cond;
              return (
                <button
                  key={cond}
                  id={`filter-cond-${cond.toLowerCase()}`}
                  type="button"
                  onClick={() => onSelectCondition(isSelected ? null : cond)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? "bg-slate-800 text-white border-slate-800 shadow-2xs"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  <span>{cond}</span>
                </button>
              );
            })}
          </div>

          {/* Clear Filters Button if any active */}
          {hasActiveQuickFilter && (
            <button
              id="clear-quick-filters-btn"
              type="button"
              onClick={onClearFilters}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
              title="Reset all quick filters"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Categories Horizontal Scroll Row */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            Popular Part Categories
          </span>
          <span className="text-[10px] font-bold text-slate-500">
            Showing <strong className="text-slate-900">{totalFilteredCount}</strong> matching spares
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {/* "All Categories" Pill */}
          <button
            id="filter-category-all"
            type="button"
            onClick={() => onSelectCategory(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedCategory === null
                ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/20"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200/80 border border-slate-200/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </button>

          {/* Individual Category Pills */}
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;

            return (
              <button
                key={cat}
                id={`filter-category-${cat.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                type="button"
                onClick={() => onSelectCategory(isSelected ? null : cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                  isSelected
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-600/20 font-bold"
                    : "bg-white text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <span className={isSelected ? "text-white" : "text-slate-500"}>
                  {getCategoryIcon(cat)}
                </span>
                <span>{cat}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                    isSelected 
                      ? "bg-blue-800 text-blue-100" 
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
