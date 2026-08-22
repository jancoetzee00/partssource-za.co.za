/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  MessageSquare, 
  Plus, 
  ThumbsUp, 
  Package, 
  Calendar, 
  User, 
  Sparkles,
  Filter,
  Check
} from "lucide-react";
import { SellerReview, SellerRatingStats } from "../types";

interface SellerReviewsSectionProps {
  sellerId: string;
  sellerName: string;
  sellerBusinessName?: string;
  ratingStats: SellerRatingStats;
  onOpenLeaveReview: () => void;
}

export const SellerReviewsSection: React.FC<SellerReviewsSectionProps> = ({
  sellerId,
  sellerName,
  sellerBusinessName,
  ratingStats,
  onOpenLeaveReview
}) => {
  const [selectedFilter, setSelectedFilter] = useState<number | "all">("all");
  const [helpfulClicked, setHelpfulClicked] = useState<Record<string, boolean>>({});

  const displayName = sellerBusinessName || sellerName || "Distributor";
  const { averageRating, totalReviews, ratingDistribution, reviews } = ratingStats;

  const filteredReviews = selectedFilter === "all" 
    ? reviews 
    : reviews.filter((r) => Math.round(r.rating) === selectedFilter);

  const handleHelpfulClick = (reviewId: string) => {
    setHelpfulClicked((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return "Recent";
    }
  };

  return (
    <div id="seller-reviews-section" className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-8 space-y-6 shadow-xs">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
              Verified Trust Score
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Direct Post-Transaction Feedback
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Customer Reviews & 5-Star Ratings
          </h2>
          <p className="text-xs text-slate-500">
            Real feedback from workshops, fleet managers, and private buyers who purchased parts from {displayName}.
          </p>
        </div>

        <button
          id="open-leave-review-btn"
          type="button"
          onClick={onOpenLeaveReview}
          className="bg-slate-900 hover:bg-blue-600 active:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Rate Seller / Leave Feedback</span>
        </button>
      </div>

      {/* Rating Summary Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 lg:p-6">
        {/* Left: Big Score display */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-2 border-b md:border-b-0 md:border-r border-slate-200/80">
          <span className="text-4xl lg:text-5xl font-black font-display tracking-tight text-slate-900">
            {averageRating.toFixed(1)}
          </span>
          
          <div className="flex items-center gap-1 my-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFull = star <= Math.floor(averageRating);
              const isHalf = !isFull && star - 0.5 <= averageRating;
              return (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    isFull
                      ? "text-amber-400 fill-amber-400"
                      : isHalf
                      ? "text-amber-400 fill-amber-400/50"
                      : "text-slate-300"
                  }`}
                />
              );
            })}
          </div>

          <span className="text-xs font-bold text-slate-700">
            Based on {totalReviews} Verified Review{totalReviews === 1 ? "" : "s"}
          </span>

          <div className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>100% Vetted Transactions</span>
          </div>
        </div>

        {/* Middle: Rating Distribution Bars */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingDistribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            const isFilterActive = selectedFilter === stars;

            return (
              <button
                key={stars}
                type="button"
                onClick={() => setSelectedFilter(selectedFilter === stars ? "all" : (stars as 1 | 2 | 3 | 4 | 5))}
                className={`flex items-center gap-3 text-xs w-full text-left py-0.5 px-1.5 rounded-lg transition-colors cursor-pointer group ${
                  isFilterActive ? "bg-blue-50/80 font-bold" : "hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-1 w-14 shrink-0 font-semibold text-slate-700">
                  <span>{stars}</span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>

                <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 group-hover:bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="text-[11px] text-slate-500 w-8 text-right shrink-0 font-medium">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 flex-wrap text-xs pt-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Filter:
          </span>
          <button
            type="button"
            onClick={() => setSelectedFilter("all")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              selectedFilter === "all"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Reviews ({totalReviews})
          </button>

          {[5, 4, 3, 2, 1].map((s) => {
            const cnt = ratingDistribution[s as 1 | 2 | 3 | 4 | 5] || 0;
            if (cnt === 0 && selectedFilter !== s) return null;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedFilter(selectedFilter === s ? "all" : (s as 1 | 2 | 3 | 4 | 5))}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  selectedFilter === s
                    ? "bg-amber-500 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{s} Stars</span>
                <span className="text-[10px] opacity-80">({cnt})</span>
              </button>
            );
          })}
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          Showing {filteredReviews.length} feedback record{filteredReviews.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-8 text-center space-y-3">
          <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-700">No Reviews Match This Filter</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Try choosing a different star filter or leave the first review for this rating category.
          </p>
          <button
            type="button"
            onClick={onOpenLeaveReview}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
          >
            Leave a review now
          </button>
        </div>
      ) : (
        <div className="space-y-3.5 divide-y divide-slate-100">
          {filteredReviews.map((rev) => {
            const isHelpful = helpfulClicked[rev.id];
            return (
              <div key={rev.id} className="pt-3.5 first:pt-0 space-y-2">
                {/* Reviewer Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                      {rev.reviewerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">
                        {rev.reviewerName}
                      </span>
                    </div>

                    {rev.verifiedPurchase && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full flex items-center gap-1">
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Verified Buyer</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(rev.createdAt)}</span>
                  </div>
                </div>

                {/* Stars and Part reference */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= rev.rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    ))}
                  </div>

                  {rev.partPurchased && (
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                      <Package className="w-3 h-3 text-slate-400" />
                      <span>Item: {rev.partPurchased}</span>
                    </span>
                  )}
                </div>

                {/* Comment Text */}
                <p className="text-xs text-slate-700 leading-relaxed pl-0.5">
                  {rev.comment}
                </p>

                {/* Helpful button */}
                <div className="flex items-center justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => handleHelpfulClick(rev.id)}
                    className={`text-[11px] font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      isHelpful
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <ThumbsUp className={`w-3 h-3 ${isHelpful ? "fill-blue-600 text-blue-600" : ""}`} />
                    <span>{isHelpful ? "Helpful (1)" : "Helpful"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
