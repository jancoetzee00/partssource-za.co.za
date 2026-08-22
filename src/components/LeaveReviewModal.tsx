/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  X, 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  ThumbsUp, 
  MessageSquare, 
  User, 
  Package, 
  Mail, 
  Phone 
} from "lucide-react";
import { SellerReview } from "../types";
import { addSellerReview } from "../lib/firestoreServices";

interface LeaveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName: string;
  sellerBusinessName?: string;
  initialPartPurchased?: string;
  onReviewSubmitted?: (newReview: SellerReview) => void;
}

const RATING_LABELS: Record<number, { title: string; desc: string; color: string }> = {
  5: { title: "5 Stars - Excellent Experience", desc: "Fast dispatch, genuine parts, excellent communication!", color: "text-amber-500" },
  4: { title: "4 Stars - Good & Reliable", desc: "Accurate description, good quality and smooth transaction.", color: "text-amber-500" },
  3: { title: "3 Stars - Average / Satisfactory", desc: "Standard transaction, parts as described.", color: "text-amber-500" },
  2: { title: "2 Stars - Below Expectations", desc: "Minor delays or communication issues encountered.", color: "text-orange-500" },
  1: { title: "1 Star - Poor Experience", desc: "Unsatisfied with parts quality or transaction.", color: "text-rose-500" },
};

const POPULAR_QUICK_TAGS = [
  "⚡ Fast Courier Dispatch",
  "🛡️ Genuine OEM Part",
  "💬 Great WhatsApp Communication",
  "🔬 Bench Tested & Verified",
  "📦 Securely Packaged",
  "🤝 Fair Pricing"
];

export const LeaveReviewModal: React.FC<LeaveReviewModalProps> = ({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  sellerBusinessName,
  initialPartPurchased = "",
  onReviewSubmitted
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewerName, setReviewerName] = useState<string>("");
  const [reviewerContact, setReviewerContact] = useState<string>("");
  const [partPurchased, setPartPurchased] = useState<string>(initialPartPurchased);
  const [comment, setComment] = useState<string>("");
  const [verifiedPurchase, setVerifiedPurchase] = useState<boolean>(true);
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const displayName = sellerBusinessName || sellerName || "Distributor";
  const activeRating = hoverRating || rating;

  const handleQuickTagClick = (tagText: string) => {
    if (comment.includes(tagText)) return;
    const cleanTag = tagText.replace(/^[^\w\s]+/, "").trim();
    if (!comment) {
      setComment(cleanTag + ". ");
    } else {
      setComment(comment.trim() + " " + cleanTag + ". ");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) {
      setErrorMsg("Please enter your name or business name.");
      return;
    }
    if (!comment.trim() || comment.trim().length < 5) {
      setErrorMsg("Please provide at least a brief comment about your transaction experience.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const newReviewPayload: Omit<SellerReview, 'id'> = {
        sellerId,
        sellerName: displayName,
        rating,
        comment: comment.trim(),
        reviewerName: reviewerName.trim(),
        reviewerContact: reviewerContact.trim() || undefined,
        partPurchased: partPurchased.trim() || undefined,
        verifiedPurchase,
        createdAt: new Date().toISOString()
      };

      const reviewId = await addSellerReview(newReviewPayload);
      
      const fullReview: SellerReview = {
        id: reviewId,
        ...newReviewPayload
      };

      if (onReviewSubmitted) {
        onReviewSubmitted(fullReview);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error("Failed to submit seller review:", err);
      setErrorMsg(err?.message || "Failed to submit review. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 animate-scale-in my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between relative">
          <div className="space-y-1 pr-6">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-slate-950" />
                Verified Buyer Rating
              </span>
              <span className="text-blue-300 text-xs font-semibold">
                Post-Transaction Feedback
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Rate {displayName}
            </h2>
            <p className="text-slate-300 text-xs leading-relaxed">
              Share your direct experience to help other truck & car owners source spares with confidence.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {success ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Thank You for Your Feedback!</h3>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              Your 5-star transaction review for <strong className="text-slate-800">{displayName}</strong> has been saved and is now live on their seller profile.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
            {/* Interactive 5-Star Rating Selector */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Overall Transaction Rating
              </span>

              {/* Star buttons */}
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = starVal <= activeRating;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 rounded-lg transition-transform hover:scale-120 active:scale-95 cursor-pointer focus:outline-hidden"
                      title={`${starVal} Star${starVal > 1 ? "s" : ""}`}
                    >
                      <Star 
                        className={`w-8 h-8 transition-colors ${
                          isFilled 
                            ? "text-amber-400 fill-amber-400 drop-shadow-xs" 
                            : "text-slate-300 hover:text-amber-200"
                        }`} 
                      />
                    </button>
                  );
                })}
              </div>

              {/* Rating Label descriptor */}
              <div className="pt-1 min-h-[38px] flex flex-col items-center justify-center">
                <span className={`text-xs font-bold ${RATING_LABELS[activeRating].color}`}>
                  {RATING_LABELS[activeRating].title}
                </span>
                <span className="text-[10px] text-slate-500">
                  {RATING_LABELS[activeRating].desc}
                </span>
              </div>
            </div>

            {/* Quick Experience Badges */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                Quick Highlight Badges (Click to append):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickTagClick(tag)}
                    className="text-[11px] font-medium bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Your Name / Workshop Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Pieter Nagel or Highveld Fleet Services"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    <span>Part / Item Sourced (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={partPurchased}
                    onChange={(e) => setPartPurchased(e.target.value)}
                    placeholder="e.g. Scania R480 Injectors"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Contact / WhatsApp (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={reviewerContact}
                    onChange={(e) => setReviewerContact(e.target.value)}
                    placeholder="e.g. +27 82 000 0000"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                  <span>Feedback & Review Details *</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details regarding part fitment, condition accuracy, delivery time, and seller communication..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-normal text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              {/* Verified purchase checkbox */}
              <label className="flex items-center gap-2.5 bg-emerald-50/70 border border-emerald-200/80 p-2.5 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={verifiedPurchase}
                  onChange={(e) => setVerifiedPurchase(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-emerald-950 block">Verified Transaction</span>
                  <span className="text-[11px] text-emerald-700 font-medium">
                    I conducted or finalized a spare part inquiry/order with this seller.
                  </span>
                </div>
              </label>
            </div>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Review...</span>
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 fill-white" />
                    <span>Publish 5-Star Review</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
