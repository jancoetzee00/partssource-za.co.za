/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  CreditCard,
  Building,
  Save,
  Loader2,
  Lock,
  DollarSign,
  Tag,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { SubscriptionBankingDetails } from "../../types";
import { saveBankingDetailsToFirestore } from "../../lib/firestoreServices";

interface OwnerBankingTabProps {
  bankingDetails: SubscriptionBankingDetails;
  onShowNotice: (msg: string) => void;
}

export const OwnerBankingTab: React.FC<OwnerBankingTabProps> = ({
  bankingDetails,
  onShowNotice
}) => {
  const [bankingForm, setBankingForm] = useState<SubscriptionBankingDetails>({
    ...bankingDetails
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showPasscode, setShowPasscode] = useState<boolean>(false);

  const handleSaveBankingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveBankingDetailsToFirestore(bankingForm);
      onShowNotice("Subscription banking details and pricing tiers updated successfully in Firestore!");
    } catch (err: any) {
      console.error("Save banking error:", err);
      alert("Failed to save banking details: " + (err.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSaveBankingSubmit} className="space-y-5 text-left">
      {/* Tier Pricing Configuration */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Seller Subscription Pricing (ZAR)</h3>
            <p className="text-xs text-slate-500">Configure monthly fees for each subscription tier</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800">Starter Plan</span>
              <Tag className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500">Up to 25 spare part listings</p>
            <div className="flex items-center gap-1 pt-1">
              <span className="text-xs font-bold text-slate-500">R</span>
              <input
                type="number"
                min="0"
                value={bankingForm.starterPriceZar ?? 249}
                onChange={(e) =>
                  setBankingForm({ ...bankingForm, starterPriceZar: Number(e.target.value) })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">/mo</span>
            </div>
          </div>

          <div className="bg-white border-2 border-blue-300 rounded-xl p-3.5 space-y-1.5 shadow-xs relative">
            <div className="absolute -top-2.5 right-3 bg-blue-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-900">Pro Tier</span>
              <Tag className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-[11px] text-slate-500">Unlimited listings & premium boost</p>
            <div className="flex items-center gap-1 pt-1">
              <span className="text-xs font-bold text-slate-500">R</span>
              <input
                type="number"
                min="0"
                value={bankingForm.proPriceZar ?? 499}
                onChange={(e) =>
                  setBankingForm({
                    ...bankingForm,
                    proPriceZar: Number(e.target.value),
                    monthlyFeeZar: Number(e.target.value)
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">/mo</span>
            </div>
          </div>

          <div className="bg-white border border-purple-200 rounded-xl p-3.5 space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-purple-900">Enterprise</span>
              <Tag className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <p className="text-[11px] text-slate-500">Multi-branch scrapyard chain</p>
            <div className="flex items-center gap-1 pt-1">
              <span className="text-xs font-bold text-slate-500">R</span>
              <input
                type="number"
                min="0"
                value={bankingForm.enterprisePriceZar ?? 999}
                onChange={(e) =>
                  setBankingForm({ ...bankingForm, enterprisePriceZar: Number(e.target.value) })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <span className="text-xs text-slate-400">/mo</span>
            </div>
          </div>
        </div>
      </div>

      {/* EFT Banking Credentials */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Marketplace EFT Bank Account Details</h3>
            <p className="text-xs text-slate-500">
              These details are displayed to scrap yard sellers for EFT monthly subscription payments
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Bank Name
            </label>
            <input
              type="text"
              required
              value={bankingForm.bankName}
              onChange={(e) => setBankingForm({ ...bankingForm, bankName: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Account Holder Name
            </label>
            <input
              type="text"
              required
              value={bankingForm.accountHolder}
              onChange={(e) => setBankingForm({ ...bankingForm, accountHolder: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Account Number
            </label>
            <input
              type="text"
              required
              value={bankingForm.accountNumber}
              onChange={(e) => setBankingForm({ ...bankingForm, accountNumber: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Branch Code (Universal)
            </label>
            <input
              type="text"
              required
              value={bankingForm.branchCode}
              onChange={(e) => setBankingForm({ ...bankingForm, branchCode: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Account Type
            </label>
            <input
              type="text"
              required
              value={bankingForm.accountType}
              onChange={(e) => setBankingForm({ ...bankingForm, accountType: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Payment Reference Pattern
            </label>
            <input
              type="text"
              required
              value={bankingForm.referenceFormat}
              onChange={(e) => setBankingForm({ ...bankingForm, referenceFormat: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Security & Owner Passcode */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Owner Portal Access Passcode</h3>
            <p className="text-xs text-slate-500">Used to unlock the Owner Settings and authorize inventory purges</p>
          </div>
        </div>

        <div className="max-w-sm">
          <div className="flex items-center gap-2">
            <input
              type={showPasscode ? "text" : "password"}
              value={bankingForm.ownerPasscode || "admin123"}
              onChange={(e) => setBankingForm({ ...bankingForm, ownerPasscode: e.target.value })}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
            >
              {showPasscode ? "Hide" : "Show"}
            </button>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Banking & Pricing Settings</span>
        </button>
      </div>
    </form>
  );
};
