/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PartRequest, Seller } from "../types";
import { SA_PROVINCES } from "../data/saLocations";
import { 
  Search, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Mail, 
  Car, 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PlusCircle, 
  Filter, 
  Flame, 
  Sparkles, 
  Share2, 
  Layers, 
  Check, 
  Trash2,
  HelpCircle,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { updatePartRequestStatusInFirestore, deletePartRequestFromFirestore } from "../lib/firestoreServices";

interface PartRequestsViewProps {
  requests: PartRequest[];
  onOpenRequestModal: () => void;
  seller?: Seller | null;
}

const CATEGORIES = [
  "All Categories",
  "Engines & Drivetrain",
  "Gearboxes & Transmissions",
  "Body Panels & Bumpers",
  "Brakes & Hydraulics",
  "Suspension & Steering",
  "Electrical & ECU Modules",
  "Cooling & Radiators",
  "Exhaust & Turbo Systems",
  "Lighting & Headlamps",
  "Interior & Airbags",
  "Wheels, Hubs & Tyres",
  "Other Spare Parts"
];

export const PartRequestsView: React.FC<PartRequestsViewProps> = ({
  requests,
  onOpenRequestModal,
  seller
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedProvince, setSelectedProvince] = useState("All Provinces");
  const [selectedUrgency, setSelectedUrgency] = useState<"all" | "urgent" | "standard" | "flexible">("all");
  const [selectedVehicleType, setSelectedVehicleType] = useState<"all" | "Car" | "Truck">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "fulfilled">("all");
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Filter requests
  const filteredRequests = requests.filter((req) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches = 
        req.partName.toLowerCase().includes(q) ||
        req.vehicleMake.toLowerCase().includes(q) ||
        req.vehicleModel.toLowerCase().includes(q) ||
        req.description.toLowerCase().includes(q) ||
        (req.partNumber && req.partNumber.toLowerCase().includes(q)) ||
        (req.engineCodeOrVin && req.engineCodeOrVin.toLowerCase().includes(q)) ||
        req.town.toLowerCase().includes(q);
      if (!matches) return false;
    }

    if (selectedCategory !== "All Categories" && req.category !== selectedCategory) {
      return false;
    }

    if (selectedProvince !== "All Provinces" && req.province !== selectedProvince) {
      return false;
    }

    if (selectedUrgency !== "all" && req.urgency !== selectedUrgency) {
      return false;
    }

    if (selectedVehicleType !== "all") {
      if (req.vehicleType !== selectedVehicleType && req.vehicleType !== "Both") {
        return false;
      }
    }

    if (statusFilter === "open" && req.status === "fulfilled") return false;
    if (statusFilter === "fulfilled" && req.status !== "fulfilled") return false;

    return true;
  });

  // Calculate statistics
  const totalActive = requests.filter((r) => r.status !== "fulfilled" && r.status !== "closed").length;
  const urgentCount = requests.filter((r) => r.urgency === "urgent" && r.status !== "fulfilled").length;

  const handleToggleFulfilled = async (req: PartRequest) => {
    const nextStatus = req.status === "fulfilled" ? "open" : "fulfilled";
    try {
      await updatePartRequestStatusInFirestore(req.id, nextStatus);
      setActionSuccessMessage(
        nextStatus === "fulfilled"
          ? `Marked "${req.partName}" as Fulfilled / Part Found!`
          : `Re-opened "${req.partName}" for quotes.`
      );
      setTimeout(() => setActionSuccessMessage(null), 3500);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleDeleteRequest = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to remove the part request for "${title}"?`)) {
      try {
        await deletePartRequestFromFirestore(id);
        setActionSuccessMessage(`Removed part request for "${title}".`);
        setTimeout(() => setActionSuccessMessage(null), 3500);
      } catch (err) {
        console.error("Failed to delete part request", err);
      }
    }
  };

  const formatCleanPhone = (phone: string) => {
    // Format to international 27... for WhatsApp link
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "27" + clean.substring(1);
    }
    return clean;
  };

  const getWhatsAppQuoteUrl = (req: PartRequest) => {
    const cleanPhone = formatCleanPhone(req.buyerPhone);
    const sellerTag = seller ? ` (${seller.businessName || seller.name})` : "";
    const msg = `Hi ${req.buyerName}, I saw your part sourcing request on PartsSource ZA for *${req.partName}* (${req.vehicleMake} ${req.vehicleModel} ${req.vehicleYear || ""}).%0A%0AWe are a verified supplier${sellerTag} and have options available for your location in ${req.town}, ${req.province}. Please let us know if you are still looking for this spare!`;
    return `https://wa.me/${cleanPhone}?text=${msg}`;
  };

  return (
    <div className="flex-1 bg-slate-100 overflow-y-auto min-h-screen">
      {/* Hero / Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  Live Sourcing Broadcast
                </span>
                <span className="text-blue-300 text-xs font-semibold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  {totalActive} Active Buyer Inquiries Across South Africa
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
                Part Sourcing Requests Hub
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Connect directly with car and truck owners, mechanics, and fleet managers searching for spares. Quote directly on WhatsApp or submit your own request.
              </p>
            </div>

            {/* Quick Sourcing CTA Card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 max-w-md shadow-xl">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Need a Hard-to-Find Part?
                </h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  Broadcast to 450+ verified scrap yards in seconds.
                </p>
              </div>
              <button
                onClick={onOpenRequestModal}
                className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Post a Request</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-white/10 text-xs">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Active Inquiries</span>
              <span className="text-lg sm:text-xl font-black text-white">{totalActive}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-amber-400 block text-[10px] uppercase font-bold flex items-center gap-1">
                <Flame className="w-3 h-3" /> Urgent Breakdowns
              </span>
              <span className="text-lg sm:text-xl font-black text-amber-300">{urgentCount}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Average Quote Speed</span>
              <span className="text-lg sm:text-xl font-black text-emerald-400">&lt; 15 Mins</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Direct Scrapyard Access</span>
              <span className="text-lg sm:text-xl font-black text-blue-300">0% Commission</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Action Notice */}
        {actionSuccessMessage && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-2xs animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
              Dismiss
            </button>
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search part names, vehicle model, town, OEM #..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            {/* Category Select */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Province Select */}
            <div>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="All Provinces">All SA Provinces</option>
                {SA_PROVINCES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Urgency Select */}
            <div>
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Urgencies</option>
                <option value="urgent">🚨 Urgent Breakdowns</option>
                <option value="standard">⏳ Standard (1-3 Days)</option>
                <option value="flexible">💡 Flexible / Best Price</option>
              </select>
            </div>
          </div>

          {/* Secondary Filter Chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Vehicle:</span>
              {[
                { id: "all", label: "All Vehicles" },
                { id: "Car", label: "Cars / Bakkies" },
                { id: "Truck", label: "Heavy Trucks" }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedVehicleType(item.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    selectedVehicleType === item.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-200 mx-1"></div>

              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Status:</span>
              {[
                { id: "all", label: "All" },
                { id: "open", label: "Open for Quotes" },
                { id: "fulfilled", label: "Fulfilled" }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStatusFilter(item.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === item.id
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="text-slate-500 font-semibold text-xs">
              Showing <strong>{filteredRequests.length}</strong> sourcing requests
            </div>
          </div>
        </div>

        {/* Requests Cards Feed */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 max-w-lg mx-auto shadow-2xs">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Search className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">No Sourcing Requests Found</h3>
              <p className="text-slate-500 text-xs mt-1">
                No active buyer inquiries matched your filter criteria. Try clearing filters or submit a new part request.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All Categories");
                  setSelectedProvince("All Provinces");
                  setSelectedUrgency("all");
                  setSelectedVehicleType("all");
                  setStatusFilter("all");
                }}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Clear Filters
              </button>
              <button
                onClick={onOpenRequestModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Post New Request
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredRequests.map((req) => {
              const isUrgent = req.urgency === "urgent";
              const isFulfilled = req.status === "fulfilled";

              return (
                <div 
                  key={req.id}
                  className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md ${
                    isUrgent ? "border-amber-300 ring-1 ring-amber-200/50" : "border-slate-200"
                  } ${isFulfilled ? "opacity-75 bg-slate-50/80" : ""}`}
                >
                  {/* Card Header Top */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Urgency Badge */}
                        {isUrgent ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                            <Flame className="w-3 h-3 text-rose-600" />
                            Urgent Breakdown
                          </span>
                        ) : req.urgency === "standard" ? (
                          <span className="bg-blue-50 text-blue-700 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Standard (1-3 Days)
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                            Best Price / Flexible
                          </span>
                        )}

                        {/* Category */}
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {req.category}
                        </span>
                      </div>

                      {/* Status Indicator */}
                      {isFulfilled ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Part Found
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Open for Quotes
                        </span>
                      )}
                    </div>

                    {/* Part Title */}
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug tracking-tight">
                      {req.partName}
                    </h3>

                    {/* Vehicle Details */}
                    <div className="flex items-center gap-2 mt-1.5 text-xs font-semibold text-slate-600 flex-wrap">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                        {req.vehicleType === "Truck" ? <Truck className="w-3 h-3 text-amber-600" /> : <Car className="w-3 h-3 text-blue-600" />}
                        {req.vehicleMake} {req.vehicleModel} {req.vehicleYear ? `(${req.vehicleYear})` : ""}
                      </span>

                      {req.engineCodeOrVin && (
                        <span className="text-slate-500 font-mono text-[11px]">
                          Code: {req.engineCodeOrVin}
                        </span>
                      )}

                      {req.partNumber && (
                        <span className="text-blue-600 font-mono text-[11px]">
                          OEM #{req.partNumber}
                        </span>
                      )}
                    </div>

                    {/* Description Text */}
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      "{req.description}"
                    </p>
                  </div>

                  {/* Card Meta Footer */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1 font-medium text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{req.town}, {req.province}</span>
                      </div>

                      {req.targetBudgetZar ? (
                        <div className="font-bold text-slate-900">
                          Budget: <span className="text-emerald-700 font-black">R{req.targetBudgetZar.toLocaleString()}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 font-medium">
                          Market Quote Requested
                        </div>
                      )}
                    </div>

                    {/* Buyer Information Strip */}
                    <div className="bg-blue-50/50 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Buyer Contact</span>
                        <span className="font-bold text-slate-900">{req.buyerName}</span>
                        <span className="text-slate-500 text-[11px] block">{req.buyerPhone}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Preferred</span>
                        <span className="font-bold uppercase text-emerald-700 bg-emerald-100 text-[10px] px-2 py-0.5 rounded">
                          {req.preferredContact}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons for Sellers & Scrap Yards */}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={getWhatsAppQuoteUrl(req)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                        title="Send pre-filled WhatsApp quote directly to this buyer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp Quote</span>
                      </a>

                      <a
                        href={`tel:${req.buyerPhone}`}
                        className="bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1 shadow-2xs transition-colors"
                        title="Call buyer directly"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Call</span>
                      </a>

                      {req.buyerEmail && (
                        <a
                          href={`mailto:${req.buyerEmail}?subject=Quote%20for%20Partssource%20ZA%20Request:%20${encodeURIComponent(req.partName)}`}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs p-2.5 rounded-xl flex items-center justify-center transition-colors"
                          title="Send email quote"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {/* Toggle status / Delete buttons */}
                      <button
                        onClick={() => handleToggleFulfilled(req)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                          isFulfilled
                            ? "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                        title={isFulfilled ? "Reopen Request" : "Mark as Part Found"}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteRequest(req.id, req.partName)}
                        className="p-2.5 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs transition-colors cursor-pointer"
                        title="Delete Request"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
