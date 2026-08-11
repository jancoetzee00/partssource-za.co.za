/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PartListing } from "../types";
import { X, MapPin, Phone, Mail, CheckCircle, MessageSquare, ShieldCheck, Info, Sparkles, AlertCircle, Loader2 } from "lucide-react";

interface ListingDetailsModalProps {
  listing: PartListing;
  onClose: () => void;
  onViewSellerProfile?: (sellerId: string) => void;
}

export const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({ listing, onClose, onViewSellerProfile }) => {
  const [activeTab, setActiveTab] = useState<"phone" | "message">("phone");
  
  // Message Form State
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [messageBody, setMessageBody] = useState(`Hi ${listing.sellerName}, is the "${listing.title}" still available? I would like to arrange purchase or delivery.`);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getConditionStyle = (cond: string) => {
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

  const handleSendMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    
    // Simulate API delivery
    setTimeout(() => {
      setSending(false);
      setSentSuccess(true);
      setBuyerName("");
      setBuyerEmail("");
      setBuyerPhone("");
    }, 1200);
  };

  // Generate pre-filled WhatsApp link
  const whatsAppText = encodeURIComponent(`Hi ${listing.sellerName}, I saw your listing for "${listing.title}" (R${listing.price.toLocaleString("en-ZA")}) on Partssource ZA. Is this still available?`);
  const cleanPhone = listing.sellerPhone.replace(/\s+/g, '').replace('+', '');
  const whatsAppLink = `https://wa.me/${cleanPhone}?text=${whatsAppText}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-scale-in my-auto flex flex-col md:flex-row max-h-[90vh] md:max-h-[85vh]">
        
        {/* Left Half: Spares Image & Key Badges */}
        <div className="md:w-1/2 bg-slate-900 relative flex flex-col justify-between p-6">
          {/* Close button for mobile inside image pane */}
          <button
            onClick={onClose}
            className="md:hidden absolute top-4 right-4 bg-slate-850/80 backdrop-blur-xs text-white p-1.5 rounded-full hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-md border border-slate-800">
            {listing.category}
          </div>

          <div className="my-auto py-8">
            <img 
              src={listing.images[0] || "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&q=80&w=600"} 
              alt={listing.title}
              referrerPolicy="no-referrer"
              className="w-full max-h-56 object-cover rounded-xl shadow-lg border border-slate-700/50"
            />
          </div>

          {/* Quick Specifications */}
          <div className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Condition:</span>
              <span className={`px-2 py-0.5 rounded-xs font-semibold ${getConditionStyle(listing.condition)}`}>
                {listing.condition}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Brand / OEM:</span>
              <span className="font-semibold text-white">{listing.brand || "OEM Genuine"}</span>
            </div>
            {listing.partNumber && (
              <div className="flex justify-between">
                <span className="text-slate-500">Part Number:</span>
                <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded-sm text-slate-200">
                  {listing.partNumber}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Fitment Group:</span>
              <span className="font-semibold text-blue-400">
                {listing.vehicleType === "Truck" ? "Heavy Duty Truck Spares" : listing.vehicleType === "Car" ? "Light Motor Vehicle Spares" : "Universal Fit"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Half: Details & Communications form */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          {/* Header Title Pane */}
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                ID: {listing.id}
              </span>
              <h2 className="text-lg md:text-xl font-display font-bold text-slate-900 mt-1">
                {listing.title}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{listing.location}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="hidden md:block text-slate-400 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description Block */}
          <div className="my-4 border-t border-b border-slate-100 py-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Seller Description:
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed max-h-36 overflow-y-auto pr-1">
              {listing.description}
            </p>

            <div className="mt-3 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
              <span className="block text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                Verified Fitment Compatibility:
              </span>
              <p className="text-xs text-slate-700 font-semibold mt-0.5">{listing.compatibility}</p>
            </div>
          </div>

          {/* Price & Seller Connection Pane */}
          <div className="space-y-4">
            <div className="flex justify-between items-end bg-slate-950 text-white rounded-2xl p-4">
              <div>
                <span className="block text-[9px] uppercase tracking-wider text-slate-400">
                  Asking Price (ZAR)
                </span>
                <span className="text-xl md:text-2xl font-display font-bold text-blue-400">
                  {formatPrice(listing.price)}
                </span>
              </div>
              <div className="text-right text-[10px] text-slate-400">
                {onViewSellerProfile ? (
                  <button 
                    onClick={() => {
                      onViewSellerProfile(listing.sellerId);
                      onClose();
                    }}
                    className="block font-bold text-blue-400 hover:text-blue-300 underline text-right cursor-pointer"
                  >
                    {listing.sellerBusinessName || listing.sellerName}
                  </button>
                ) : (
                  <span className="block font-semibold text-white">{listing.sellerBusinessName || listing.sellerName}</span>
                )}
                <span>Active Advertiser</span>
              </div>
            </div>

            {/* Communication Tabs */}
            <div className="space-y-3">
              <div className="flex border-b border-slate-100 text-xs">
                <button
                  onClick={() => setActiveTab("phone")}
                  className={`flex-1 pb-2 font-semibold text-center transition-all ${
                    activeTab === "phone" 
                      ? "border-b-2 border-slate-900 text-slate-900" 
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Direct Spares Contact
                </button>
                <button
                  onClick={() => setActiveTab("message")}
                  className={`flex-1 pb-2 font-semibold text-center transition-all ${
                    activeTab === "message" 
                      ? "border-b-2 border-slate-900 text-slate-900" 
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Send Spare Request
                </button>
              </div>

              {activeTab === "phone" ? (
                <div className="space-y-2.5 animate-fade-in">
                  <a 
                    href={whatsAppLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 fill-white" />
                    <span>WhatsApp Seller Instantly</span>
                  </a>

                  <div className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase">Call/WhatsApp</span>
                        <span className="font-semibold">{listing.sellerPhone}</span>
                      </div>
                    </div>
                    <a 
                      href={`tel:${listing.sellerPhone}`}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Call Now
                    </a>
                  </div>

                  <div className="flex items-center gap-2 p-2.5 bg-sky-50 text-sky-800 rounded-xl text-[10px]">
                    <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>This advertiser is fully subscribed and holds an verified contact number. Always trade in daylight hours.</span>
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in">
                  {sentSuccess ? (
                    <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl text-center space-y-1">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                      <h5 className="font-bold text-xs">Request Sent Successfully!</h5>
                      <p className="text-[10px] text-green-600">
                        The advertiser has been notified. They will contact you at {buyerEmail} or via phone shortly.
                      </p>
                      <button 
                        onClick={() => setSentSuccess(false)}
                        className="text-[10px] text-slate-500 underline mt-2 hover:text-slate-900"
                      >
                        Send another message
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessageSubmit} className="space-y-2.5">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] text-slate-900 focus:outline-hidden focus:border-blue-500"
                        />
                        <input
                          type="email"
                          required
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          placeholder="Your Email"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] text-slate-900 focus:outline-hidden focus:border-blue-500"
                        />
                      </div>
                      <input
                        type="tel"
                        required
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="Your Phone Number"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] text-slate-900 focus:outline-hidden focus:border-blue-500"
                      />
                      <textarea
                        rows={2}
                        required
                        value={messageBody}
                        onChange={(e) => setMessageBody(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] text-slate-900 focus:outline-hidden focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={sending}
                        className="w-full bg-slate-950 hover:bg-blue-600 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {sending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Submit Spares Request Offer</span>
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
