/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { PartListing } from "../types";
import { 
  X, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle, 
  MessageSquare, 
  ShieldCheck, 
  Info, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  Globe, 
  Search, 
  Building2, 
  Share2, 
  Copy, 
  Check,
  Star,
  Truck,
  FileText,
  ChevronDown,
  ChevronUp,
  Send,
  PackageCheck
} from "lucide-react";

interface ListingDetailsModalProps {
  listing: PartListing;
  onClose: () => void;
  onViewSellerProfile?: (sellerId: string) => void;
  onOpenWebSearch?: (query: string, province?: string, town?: string) => void;
  onOpenEftModal?: (
    purpose?: "subscription" | "part_purchase" | "general", 
    amount?: number, 
    ref?: string,
    targetSellerId?: string,
    targetSellerName?: string,
    targetListingId?: string,
    targetListingTitle?: string
  ) => void;
  sellerRating?: number;
  sellerReviewsCount?: number;
  onRateSeller?: (sellerId: string, sellerName: string, partTitle: string) => void;
}

export const ListingDetailsModal: React.FC<ListingDetailsModalProps> = ({ 
  listing, 
  onClose, 
  onViewSellerProfile,
  onOpenWebSearch,
  onOpenEftModal,
  sellerRating,
  sellerReviewsCount,
  onRateSeller
}) => {
  const [activeTab, setActiveTab] = useState<"phone" | "message">("phone");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInquiry, setCopiedInquiry] = useState(false);
  const [showInquiryCustomizer, setShowInquiryCustomizer] = useState(false);
  const [inquiryDestination, setInquiryDestination] = useState("");
  const [inquiryTemplateType, setInquiryTemplateType] = useState<"shipping" | "urgent" | "fitment">("shipping");
  
  // Message Form State
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [messageBody, setMessageBody] = useState(`Hi ${listing.sellerName}, is the "${listing.title}" (Part #: ${listing.partNumber || "OEM"}) still available? Please provide a shipping/courier estimate.`);
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

  // Helper to format South African phone numbers for WhatsApp wa.me links
  const formatWhatsAppPhone = (phoneStr: string) => {
    let cleaned = phoneStr.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('0')) {
      cleaned = '27' + cleaned.substring(1);
    }
    return cleaned;
  };

  const currentListingUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}?listingId=${encodeURIComponent(listing.id)}`
    : `https://partssource.co.za?listingId=${listing.id}`;

  // Generate pre-filled, professional WhatsApp inquiry message template
  const generateWhatsAppInquiry = () => {
    const sellerDisplayName = listing.sellerBusinessName || listing.sellerName || "Seller";
    const destinationNote = inquiryDestination.trim() 
      ? ` to *${inquiryDestination.trim()}*` 
      : ` to my delivery address`;
    
    if (inquiryTemplateType === "urgent") {
      return (
        `Hello ${sellerDisplayName},\n\n` +
        `I would like to urgently purchase this spare part listed on *Partssource ZA*:\n\n` +
        `📦 *Part Title:* ${listing.title}\n` +
        `🔢 *Part / OEM #:* ${listing.partNumber || "OEM Genuine"}\n` +
        (listing.brand ? `🏷️ *Brand:* ${listing.brand}\n` : "") +
        `💰 *Listed Price:* ${formatPrice(listing.price)}\n` +
        `🔧 *Condition:* ${listing.condition}\n` +
        `📍 *Seller Location:* ${listing.location}\n\n` +
        `Could you please confirm immediate availability and provide an *urgent courier/shipping quotation*${destinationNote} (e.g. Courier Guy / RAM / Dawn Wing)? Please also share your EFT banking details for swift payment.\n\n` +
        `🔗 *Listing Reference:* ${currentListingUrl}\n\n` +
        `Thank you!`
      );
    }

    if (inquiryTemplateType === "fitment") {
      return (
        `Hello ${sellerDisplayName},\n\n` +
        `I am inquiring about fitment compatibility and shipping for this part on *Partssource ZA*:\n\n` +
        `📦 *Part Title:* ${listing.title}\n` +
        `🔢 *Part / OEM #:* ${listing.partNumber || "OEM Genuine"}\n` +
        (listing.brand ? `🏷️ *Brand:* ${listing.brand}\n` : "") +
        `🚗 *Compatibility / Fitment:* ${listing.compatibility || listing.vehicleType}\n` +
        `💰 *Listed Price:* ${formatPrice(listing.price)} (${listing.condition})\n` +
        `📍 *Location:* ${listing.location}\n\n` +
        `Could you please verify that this part matches my vehicle and provide a *shipping estimate*${destinationNote}?\n\n` +
        `🔗 *Listing Reference:* ${currentListingUrl}\n\n` +
        `Looking forward to your confirmation!`
      );
    }

    // Default: Professional Standard Inquiry & Shipping Estimate Template
    return (
      `Hello ${sellerDisplayName},\n\n` +
      `I saw your listing on *Partssource ZA* and would like to inquire about purchasing this part:\n\n` +
      `📦 *Part Title:* ${listing.title}\n` +
      `🔢 *Part / OEM #:* ${listing.partNumber || "OEM Genuine"}\n` +
      (listing.brand ? `🏷️ *Brand:* ${listing.brand}\n` : "") +
      `💰 *Listed Price:* ${formatPrice(listing.price)}\n` +
      `🔧 *Condition:* ${listing.condition}\n` +
      `🚗 *Fitment:* ${listing.compatibility || listing.vehicleType}\n` +
      `📍 *Seller Yard / Location:* ${listing.location}\n\n` +
      `Could you please confirm if this item is currently available, and provide a *shipping / courier estimate*${destinationNote}? Please let me know your preferred payment and dispatch arrangements.\n\n` +
      `🔗 *Listing Reference:* ${currentListingUrl}\n\n` +
      `Thank you!`
    );
  };

  const whatsAppInquiryMessage = generateWhatsAppInquiry();
  const cleanPhone = formatWhatsAppPhone(listing.sellerPhone);
  const whatsAppLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsAppInquiryMessage)}`;

  // Generate pre-filled WhatsApp share link (with title, price, vehicle type & direct link)
  const shareWhatsAppMessage = encodeURIComponent(
    `*${listing.title}*\n` +
    `💰 Price: ${formatPrice(listing.price)}\n` +
    `📍 Location: ${listing.location}\n` +
    `🏷️ Category: ${listing.category} (${listing.vehicleType === "Truck" ? "Heavy Truck Spares" : listing.vehicleType === "Car" ? "Car & Bakkie Spares" : "Universal Spares"})\n` +
    (listing.partNumber ? `🔢 OEM / Part #: ${listing.partNumber}\n` : "") +
    (listing.brand ? `⚙️ Brand: ${listing.brand}\n` : "") +
    `\n🔗 View full listing on Partssource ZA:\n${currentListingUrl}`
  );

  const shareWhatsAppUrl = `https://api.whatsapp.com/send?text=${shareWhatsAppMessage}`;

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentListingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyInquiryText = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(whatsAppInquiryMessage);
      setCopiedInquiry(true);
      setTimeout(() => setCopiedInquiry(false), 2500);
    }
  };

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

            {onOpenWebSearch && (
              <button
                type="button"
                onClick={() => {
                  onOpenWebSearch(
                    listing.partNumber ? `${listing.title} ${listing.partNumber}` : listing.title,
                    listing.province,
                    listing.town
                  );
                }}
                className="mt-2 w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Search Web Engine & Cross-References</span>
              </button>
            )}
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
                
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  {sellerRating !== undefined ? (
                    <div className="inline-flex items-center gap-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-1.5 py-0.2 rounded font-bold">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span>{sellerRating.toFixed(1)}</span>
                      {sellerReviewsCount !== undefined && <span className="opacity-80 font-normal">({sellerReviewsCount})</span>}
                    </div>
                  ) : (
                    <span>Active Advertiser</span>
                  )}
                  {onRateSeller && (
                    <button
                      type="button"
                      onClick={() => onRateSeller(listing.sellerId, listing.sellerBusinessName || listing.sellerName, listing.title)}
                      className="text-blue-300 hover:text-white underline cursor-pointer ml-1"
                    >
                      Rate
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Share to WhatsApp Action Box */}
            <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Share2 className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-emerald-950 leading-tight">
                    Share Spare via WhatsApp
                  </span>
                  <span className="block text-[10px] text-emerald-700 font-medium truncate">
                    Includes title, price, location & listing link
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  id="share-to-whatsapp-btn"
                  href={shareWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer hover:shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5 fill-white" />
                  <span>Share to WhatsApp</span>
                </a>
                <button
                  id="copy-listing-link-btn"
                  type="button"
                  onClick={handleCopyLink}
                  className="bg-white hover:bg-emerald-100/70 border border-emerald-300 text-emerald-800 text-xs font-semibold px-2.5 py-1.5 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Copy listing URL to clipboard"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-emerald-700" />}
                  <span>{copiedLink ? "Copied" : "Copy Link"}</span>
                </button>
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
                <div className="space-y-3 animate-fade-in">
                  {/* Primary WhatsApp Action with Part # & Shipping Quote Pre-fill */}
                  <div className="space-y-1.5">
                    <a 
                      id="whatsapp-seller-direct-btn"
                      href={whatsAppLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer hover:shadow-md"
                    >
                      <MessageSquare className="w-4 h-4 fill-white" />
                      <span>WhatsApp Seller (Pre-filled Inquiry & Shipping Request)</span>
                    </a>
                    <div className="flex items-center justify-between text-[10px] text-emerald-800 px-1">
                      <span className="flex items-center gap-1">
                        <PackageCheck className="w-3 h-3 text-emerald-600" />
                        <span>Includes {listing.partNumber ? `Part #${listing.partNumber}` : "Part details"} & Courier Quote</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowInquiryCustomizer(!showInquiryCustomizer)}
                        className="text-emerald-700 hover:text-emerald-950 font-semibold underline flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{showInquiryCustomizer ? "Hide Template" : "Customize / Preview Template"}</span>
                        {showInquiryCustomizer ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp Inquiry Customizer & Live Template Preview */}
                  {showInquiryCustomizer && (
                    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 space-y-2.5 animate-scale-in text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-950 flex items-center gap-1.5 text-[11px]">
                          <FileText className="w-3.5 h-3.5 text-emerald-700" />
                          <span>WhatsApp Inquiry Template Builder</span>
                        </span>
                        <span className="text-[10px] bg-emerald-200/60 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                          Pre-filled
                        </span>
                      </div>

                      {/* Template Selector Pills */}
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInquiryTemplateType("shipping")}
                          className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer ${
                            inquiryTemplateType === "shipping"
                              ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-100/50"
                          }`}
                        >
                          🚚 Shipping Quote
                        </button>
                        <button
                          type="button"
                          onClick={() => setInquiryTemplateType("urgent")}
                          className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer ${
                            inquiryTemplateType === "urgent"
                              ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-100/50"
                          }`}
                        >
                          ⚡ Urgent Dispatch
                        </button>
                        <button
                          type="button"
                          onClick={() => setInquiryTemplateType("fitment")}
                          className={`py-1 px-1.5 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer ${
                            inquiryTemplateType === "fitment"
                              ? "bg-emerald-700 text-white border-emerald-800 shadow-xs"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-100/50"
                          }`}
                        >
                          🔍 Fitment Check
                        </button>
                      </div>

                      {/* Optional Delivery Destination Input */}
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-900 mb-1">
                          Delivery Town / City for Shipping Estimate:
                        </label>
                        <div className="relative">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={inquiryDestination}
                            onChange={(e) => setInquiryDestination(e.target.value)}
                            placeholder="e.g. Pretoria, Durban, Polokwane, Cape Town..."
                            className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-[11px] text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Formatted Template Preview Box */}
                      <div className="bg-slate-900 text-emerald-300 p-2.5 rounded-lg text-[10px] font-mono whitespace-pre-wrap max-h-32 overflow-y-auto leading-relaxed border border-slate-800">
                        {whatsAppInquiryMessage}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <a
                          href={whatsAppLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Open in WhatsApp</span>
                        </a>
                        <button
                          type="button"
                          onClick={handleCopyInquiryText}
                          className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-semibold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedInquiry ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-600" />}
                          <span>{copiedInquiry ? "Copied" : "Copy Text"}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Phone Call Box */}
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
                    <span>This advertiser is fully subscribed and holds a verified contact number. Always trade in daylight hours.</span>
                  </div>

                  {onOpenEftModal && (
                    <button
                      type="button"
                      onClick={() => {
                        const cleanTitle = listing.title.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase();
                        onOpenEftModal(
                          "part_purchase", 
                          listing.price, 
                          `PART-${cleanTitle}`,
                          listing.sellerId,
                          listing.sellerName,
                          listing.id,
                          listing.title
                        );
                      }}
                      className="w-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 text-slate-700 text-[11px] font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>EFT Banking Details & Upload Proof of Payment</span>
                    </button>
                  )}
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
