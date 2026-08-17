/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  X, 
  Send, 
  Car, 
  Truck, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Layers, 
  Share2, 
  ExternalLink,
  DollarSign
} from "lucide-react";
import { PartRequest } from "../types";
import { SA_PROVINCES, getTownsForProvince } from "../data/saLocations";
import { addPartRequestToFirestore } from "../lib/firestoreServices";

interface RequestPartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (request: PartRequest) => void;
  initialPartQuery?: string;
}

const CATEGORIES = [
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

export const RequestPartModal: React.FC<RequestPartModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPartQuery = ""
}) => {
  // Form State
  const [partName, setPartName] = useState(initialPartQuery);
  const [category, setCategory] = useState("Engines & Drivetrain");
  const [vehicleType, setVehicleType] = useState<"Car" | "Truck" | "Both" | "Other">("Car");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [engineCodeOrVin, setEngineCodeOrVin] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"urgent" | "standard" | "flexible">("standard");
  const [targetBudgetZar, setTargetBudgetZar] = useState<string>("");
  const [province, setProvince] = useState("Gauteng");
  const [town, setTown] = useState("Johannesburg");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [preferredContact, setPreferredContact] = useState<"whatsapp" | "call" | "email">("whatsapp");

  // Flow State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState<PartRequest | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState(false);

  // Update towns when province changes
  const availableTowns = getTownsForProvince(province);

  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    const towns = getTownsForProvince(newProv);
    setTown(towns.length > 0 ? towns[0] : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!partName.trim()) {
      setErrorMessage("Please enter the specific part name you are looking for.");
      return;
    }
    if (!vehicleMake.trim() || !vehicleModel.trim()) {
      setErrorMessage("Please specify the vehicle make and model (e.g., Toyota Hilux or Scania R480).");
      return;
    }
    if (!buyerName.trim()) {
      setErrorMessage("Please provide your name so scrap yards know who to contact.");
      return;
    }
    if (!buyerPhone.trim() || buyerPhone.length < 8) {
      setErrorMessage("Please enter a valid South African contact phone or WhatsApp number.");
      return;
    }

    setLoading(true);

    const requestPayload: Omit<PartRequest, "id"> = {
      partName: partName.trim(),
      category,
      vehicleType,
      vehicleMake: vehicleMake.trim(),
      vehicleModel: vehicleModel.trim(),
      vehicleYear: vehicleYear.trim() || undefined,
      engineCodeOrVin: engineCodeOrVin.trim() || undefined,
      partNumber: partNumber.trim() || undefined,
      description: description.trim() || `Looking for ${partName.trim()} for ${vehicleMake.trim()} ${vehicleModel.trim()} in good condition.`,
      urgency,
      targetBudgetZar: targetBudgetZar ? Number(targetBudgetZar) : undefined,
      province,
      town,
      buyerName: buyerName.trim(),
      buyerPhone: buyerPhone.trim(),
      buyerEmail: buyerEmail.trim() || undefined,
      preferredContact,
      status: "open",
      quotesCount: 0,
      createdAt: new Date().toISOString()
    };

    try {
      // Save directly to Firestore collection
      const newId = await addPartRequestToFirestore(requestPayload);
      const createdObj: PartRequest = { id: newId, ...requestPayload };
      setSubmittedRequest(createdObj);
      if (onSuccess) onSuccess(createdObj);
    } catch (err: any) {
      console.warn("Firestore write error, attempting server endpoint fallback:", err);
      try {
        const res = await fetch("/api/part-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestPayload)
        });
        if (res.ok) {
          const createdObj = await res.json();
          setSubmittedRequest(createdObj);
          if (onSuccess) onSuccess(createdObj);
        } else {
          setErrorMessage("Failed to broadcast part request. Please check connection and retry.");
        }
      } catch (fallbackErr) {
        setErrorMessage("Network error broadcasting request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setPartName("");
    setVehicleMake("");
    setVehicleModel("");
    setVehicleYear("");
    setEngineCodeOrVin("");
    setPartNumber("");
    setDescription("");
    setTargetBudgetZar("");
    setBuyerName("");
    setBuyerPhone("");
    setBuyerEmail("");
    setSubmittedRequest(null);
    setErrorMessage("");
    onClose();
  };

  // WhatsApp share text for direct scrapyards broadcast
  const getWhatsAppBroadcastText = () => {
    if (!submittedRequest) return "";
    return `*PARTS SOURCE ZA - SPARE PART REQUEST*%0A%0A` +
      `*Part Needed:* ${submittedRequest.partName}%0A` +
      `*Vehicle:* ${submittedRequest.vehicleMake} ${submittedRequest.vehicleModel} ${submittedRequest.vehicleYear || ""}%0A` +
      (submittedRequest.engineCodeOrVin ? `*Engine / VIN:* ${submittedRequest.engineCodeOrVin}%0A` : "") +
      (submittedRequest.partNumber ? `*Part #:* ${submittedRequest.partNumber}%0A` : "") +
      `*Location:* ${submittedRequest.town}, ${submittedRequest.province}%0A` +
      `*Urgency:* ${submittedRequest.urgency.toUpperCase()}%0A` +
      (submittedRequest.targetBudgetZar ? `*Budget:* R${submittedRequest.targetBudgetZar.toLocaleString()} ZAR%0A` : "") +
      `*Contact Buyer:* ${submittedRequest.buyerName} (${submittedRequest.buyerPhone})%0A%0A` +
      `_Broadcast via Partssource ZA Marketplace_`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 my-8 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-blue-100 hover:text-white bg-blue-800/50 hover:bg-blue-800 p-1.5 rounded-full transition-all cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              Sourcing Network
            </span>
            <span className="text-blue-200 text-xs font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 450+ Verified South African Scrap Yards
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Request a Part
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1 max-w-lg">
            Can’t find your auto or truck spare? Post your request and vetted distributors, recyclers, and scrap yards across South Africa will quote you directly.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {submittedRequest ? (
            /* Submission Success State */
            <div className="text-center py-6 px-2 space-y-5 animate-fadeIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  Broadcast Live in South Africa
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  Part Request Submitted!
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto">
                  Your request for <strong className="text-slate-900">{submittedRequest.partName}</strong> has been broadcasted to verified sellers in <strong className="text-slate-900">{submittedRequest.province}</strong> and nationwide.
                </p>
              </div>

              {/* Request Summary Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left max-w-md mx-auto space-y-2.5 text-xs text-slate-700">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="font-semibold text-slate-500">Reference ID:</span>
                  <span className="font-mono font-bold text-blue-700">{submittedRequest.id.substring(0, 10).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Vehicle:</span>
                  <span className="font-bold text-slate-800">{submittedRequest.vehicleMake} {submittedRequest.vehicleModel} ({submittedRequest.vehicleYear || "N/A"})</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Location:</span>
                  <span className="font-medium text-slate-800">{submittedRequest.town}, {submittedRequest.province}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-500">Preferred Contact:</span>
                  <span className="font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                    {submittedRequest.preferredContact}
                  </span>
                </div>
                {submittedRequest.targetBudgetZar && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-500">Target Budget:</span>
                    <span className="font-bold text-slate-900">R{submittedRequest.targetBudgetZar.toLocaleString()} ZAR</span>
                  </div>
                )}
              </div>

              {/* Direct Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <a
                  href={`https://wa.me/?text=${getWhatsAppBroadcastText()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Forward to WhatsApp Scrap Yards
                </a>

                <button
                  type="button"
                  onClick={handleResetForm}
                  className="bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-colors cursor-pointer"
                >
                  Done & View Requests Feed
                </button>
              </div>
            </div>
          ) : (
            /* Part Sourcing Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Vehicle Type Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Vehicle Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { type: "Car", label: "Car / Bakkie / SUV", icon: Car },
                    { type: "Truck", label: "Commercial Truck", icon: Truck },
                    { type: "Both", label: "Bus / Fleet / Other", icon: Layers },
                  ].map((item) => (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => setVehicleType(item.type as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        vehicleType === item.type
                          ? "bg-blue-50 border-blue-600 text-blue-700 shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 1: Part Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Part Name / Description Needed <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    placeholder="e.g. Complete 2.8 GD-6 Automatic Gearbox or Front Bumper with Fog Lights"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Urgency Level
                  </label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  >
                    <option value="urgent">🚨 Urgent (Vehicle Breakdown / Same Day)</option>
                    <option value="standard">⏳ Standard (Within a Few Days)</option>
                    <option value="flexible">💡 Flexible (Looking for Best Price)</option>
                  </select>
                </div>
              </div>

              {/* Section 2: Vehicle Fitment Details */}
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-blue-600" />
                  Vehicle Fitment Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Make <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={vehicleMake}
                      onChange={(e) => setVehicleMake(e.target.value)}
                      placeholder="e.g. Toyota / Scania / VW"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Model <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="e.g. Hilux / R480 / Polo"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Year
                    </label>
                    <input
                      type="text"
                      value={vehicleYear}
                      onChange={(e) => setVehicleYear(e.target.value)}
                      placeholder="e.g. 2018"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Engine Code or VIN (Optional)
                    </label>
                    <input
                      type="text"
                      value={engineCodeOrVin}
                      onChange={(e) => setEngineCodeOrVin(e.target.value)}
                      placeholder="e.g. 1GD-FTV or VIN #"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      OEM / Part # (Optional)
                    </label>
                    <input
                      type="text"
                      value={partNumber}
                      onChange={(e) => setPartNumber(e.target.value)}
                      placeholder="e.g. 35000-0K400"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Location & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Province (RSA) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={province}
                    onChange={(e) => handleProvinceChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {SA_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>{prov}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Town / City <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={town}
                    onChange={(e) => setTown(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {availableTowns.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Budget (ZAR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">R</span>
                    <input
                      type="number"
                      value={targetBudgetZar}
                      onChange={(e) => setTargetBudgetZar(e.target.value)}
                      placeholder="e.g. 15000"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Buyer Contact Information */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  Your Contact Details (For Quotations)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Full Name / Workshop <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Kobus Venter / Apex Auto"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Phone or WhatsApp <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="e.g. 082 555 0192 or +27 82..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      placeholder="e.g. buyer@domain.co.za"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Preferred Quote Channel
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
                        { id: "call", label: "Call", icon: Phone },
                        { id: "email", label: "Email", icon: Mail }
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPreferredContact(item.id as any)}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 border transition-all cursor-pointer ${
                            preferredContact === item.id
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <item.icon className="w-3 h-3" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Broadcasting Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Broadcast to Scrap Yards</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
