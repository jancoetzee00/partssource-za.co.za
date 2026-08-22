/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  Lock,
  Unlock,
  ShieldCheck,
  Building2,
  Key,
  X,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Boxes,
  Users,
  CreditCard,
  Layers
} from "lucide-react";
import { SubscriptionBankingDetails, Seller, PartListing } from "../types";
import {
  subscribeToSellers,
  subscribeToListings
} from "../lib/firestoreServices";
import { OwnerInventoryTab } from "./owner/OwnerInventoryTab";
import { OwnerSellersTab } from "./owner/OwnerSellersTab";
import { OwnerBankingTab } from "./owner/OwnerBankingTab";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankingDetails: SubscriptionBankingDetails;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  bankingDetails
}) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"inventory" | "sellers" | "banking">("inventory");
  const [inputPasscode, setInputPasscode] = useState<string>("");
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Firestore live subscriptions
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [listings, setListings] = useState<PartListing[]>([]);

  // Navigation between tabs
  const [initialInventorySellerFilter, setInitialInventorySellerFilter] = useState<string>("All");

  // Temporary Success / Notice Banner
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNoticeMessage(msg);
    setTimeout(() => {
      setNoticeMessage(null);
    }, 6000);
  };

  useEffect(() => {
    if (!isOpen) {
      setInputPasscode("");
      setAuthError(null);
      setNoticeMessage(null);
      return;
    }

    // Subscribe to Firestore collections
    const unsubSellers = subscribeToSellers((updatedSellers) => {
      setSellers(updatedSellers);
    });

    const unsubListings = subscribeToListings((updatedListings) => {
      setListings(updatedListings);
    });

    return () => {
      unsubSellers();
      unsubListings();
    };
  }, [isOpen]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPasscode = bankingDetails.ownerPasscode || "admin123";
    if (inputPasscode === correctPasscode) {
      setIsUnlocked(true);
      setAuthError(null);
    } else {
      setAuthError("Incorrect owner passcode. Default demo passcode is: admin123");
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setInputPasscode("");
    setAuthError(null);
  };

  // Cross tab navigation helpers
  const handleFilterInventoryBySeller = (sellerId: string) => {
    setInitialInventorySellerFilter(sellerId);
    setActiveTab("inventory");
  };

  const handleSelectSellerInSellersTab = (sellerId: string) => {
    setActiveTab("sellers");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden my-auto animate-in zoom-in-95 duration-150 text-left max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold font-display text-white">
                  Owner Administrative Portal
                </h2>
                {isUnlocked && (
                  <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>UNLOCKED</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage inventory deletion, scrap yard seller profiles, subscription pricing, and EFT settings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUnlocked && (
              <button
                onClick={handleLock}
                className="text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Lock Administrative Access"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Lock Portal</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Notice Banner */}
        {noticeMessage && (
          <div className="bg-emerald-600 text-white px-5 py-2.5 text-xs font-medium flex items-center justify-between shrink-0 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{noticeMessage}</span>
            </div>
            <button
              onClick={() => setNoticeMessage(null)}
              className="text-white/80 hover:text-white ml-2 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        {!isUnlocked ? (
          /* PASSCODE GATE SCREEN */
          <div className="p-6 sm:p-10 flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-bold font-display text-slate-900">
                Owner Authentication Required
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your administrative passcode to view and delete inventory, inspect or edit seller profiles, and configure subscription bank accounts.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="w-full max-w-sm space-y-4">
              <div className="relative">
                <input
                  type={showPasscode ? "text" : "password"}
                  value={inputPasscode}
                  onChange={(e) => {
                    setInputPasscode(e.target.value);
                    if (authError) setAuthError(null);
                  }}
                  placeholder="Enter passcode (Default: admin123)"
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-center tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium flex items-center gap-2 text-left animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>Unlock Owner Portal</span>
              </button>
            </form>

            <div className="text-[11px] text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>Default owner passcode: <strong className="text-slate-700 font-mono">admin123</strong> (Change in Banking tab)</span>
            </div>
          </div>
        ) : (
          /* UNLOCKED TABBED INTERFACE */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Navigation */}
            <div className="bg-slate-100/90 border-b border-slate-200 px-5 pt-3 flex gap-2 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("inventory")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-t border-x ${
                  activeTab === "inventory"
                    ? "bg-white text-red-600 border-slate-200 border-b-white -mb-px shadow-xs"
                    : "bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Boxes className="w-4 h-4" />
                <span>Inventory & Deletion</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === "inventory" ? "bg-red-100 text-red-800" : "bg-slate-200 text-slate-700"
                }`}>
                  {listings.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("sellers")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-t border-x ${
                  activeTab === "sellers"
                    ? "bg-white text-blue-600 border-slate-200 border-b-white -mb-px shadow-xs"
                    : "bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Seller Profiles & Plans</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeTab === "sellers" ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-700"
                }`}>
                  {sellers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("banking")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-t border-x ${
                  activeTab === "banking"
                    ? "bg-white text-emerald-600 border-slate-200 border-b-white -mb-px shadow-xs"
                    : "bg-transparent text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Banking & Plan Pricing</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-white">
              {activeTab === "inventory" && (
                <OwnerInventoryTab
                  listings={listings}
                  sellers={sellers}
                  ownerPasscode={bankingDetails.ownerPasscode || "admin123"}
                  initialSellerFilter={initialInventorySellerFilter}
                  onSelectSellerInSellersTab={handleSelectSellerInSellersTab}
                  onShowNotice={showNotice}
                />
              )}

              {activeTab === "sellers" && (
                <OwnerSellersTab
                  sellers={sellers}
                  listings={listings}
                  bankingDetails={bankingDetails}
                  onFilterInventoryBySeller={handleFilterInventoryBySeller}
                  onShowNotice={showNotice}
                />
              )}

              {activeTab === "banking" && (
                <OwnerBankingTab
                  bankingDetails={bankingDetails}
                  onShowNotice={showNotice}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
