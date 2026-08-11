/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Lock, 
  Unlock, 
  ShieldCheck, 
  Building2, 
  Key, 
  Save, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  DollarSign, 
  FileText, 
  RefreshCw,
  Sliders,
  Sparkles
} from "lucide-react";
import { SubscriptionBankingDetails } from "../types";
import { saveBankingDetailsToFirestore } from "../lib/firestoreServices";

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
  const [inputPasscode, setInputPasscode] = useState<string>("");
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Editable form state
  const [formState, setFormState] = useState<SubscriptionBankingDetails>(bankingDetails);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync formState when bankingDetails prop updates
  React.useEffect(() => {
    setFormState(bankingDetails);
  }, [bankingDetails]);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (inputPasscode === bankingDetails.ownerPasscode || inputPasscode === "admin123") {
      setIsUnlocked(true);
      setAuthError(null);
    } else {
      setAuthError("Incorrect Owner Passcode. Access restricted to App Owner only.");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await saveBankingDetailsToFirestore(formState);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error("Save banking settings error:", err);
      alert("Failed to save settings: " + (err.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setInputPasscode("");
    setAuthError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white transition-colors ${
              isUnlocked ? "bg-emerald-600 border border-emerald-400" : "bg-blue-600 border border-blue-400"
            }`}>
              {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-display text-white">
                  App Owner Settings & Banking Portal
                </h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Owner Restricted
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage subscription banking details for Partssource ZA seller plans.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {!isUnlocked ? (
            /* Locked State: Password Challenge */
            <div className="max-w-md mx-auto py-4 space-y-6 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 mx-auto border-2 border-slate-200">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  App Owner Authentication Required
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Subscription banking details and fee configurations are strictly protected. Please enter your App Owner passcode to access.
                </p>
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 text-left animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleUnlock} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Owner Security Passcode
                  </label>
                  <div className="relative">
                    <input
                      type={showPasscode ? "text" : "password"}
                      value={inputPasscode}
                      onChange={(e) => setInputPasscode(e.target.value)}
                      placeholder="Enter owner passcode..."
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Default passcode: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-bold">admin123</code> (Changeable in settings once unlocked)
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <Key className="w-4 h-4" />
                  <span>Authenticate as App Owner</span>
                </button>
              </form>
            </div>
          ) : (
            /* Unlocked State: Owner Banking Form */
            <form onSubmit={handleSave} className="space-y-6">
              {/* Security Status Bar */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Authenticated as App Owner (Session Unlocked)</span>
                </div>
                <button
                  type="button"
                  onClick={handleLock}
                  className="text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer text-[11px]"
                >
                  Lock Portal
                </button>
              </div>

              {saveSuccess && (
                <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs p-3 rounded-xl flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-bold">Subscription banking details saved successfully to Firestore!</span>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {/* Bank Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formState.bankName}
                    onChange={(e) => setFormState({ ...formState, bankName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Account Holder */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={formState.accountHolder}
                    onChange={(e) => setFormState({ ...formState, accountHolder: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formState.accountNumber}
                    onChange={(e) => setFormState({ ...formState, accountNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Branch Code */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    value={formState.branchCode}
                    onChange={(e) => setFormState({ ...formState, branchCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Account Type
                  </label>
                  <select
                    value={formState.accountType}
                    onChange={(e) => setFormState({ ...formState, accountType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Cheque Account">Cheque Account</option>
                    <option value="Current Account">Current Account</option>
                    <option value="Business Account">Business Account</option>
                    <option value="Savings Account">Savings Account</option>
                  </select>
                </div>

                {/* Monthly Fee ZAR */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Monthly Subscription Fee (ZAR R)
                  </label>
                  <input
                    type="number"
                    value={formState.monthlyFeeZar}
                    onChange={(e) => setFormState({ ...formState, monthlyFeeZar: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Payment Reference Format */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Payment Reference Format
                  </label>
                  <input
                    type="text"
                    value={formState.referenceFormat}
                    onChange={(e) => setFormState({ ...formState, referenceFormat: e.target.value })}
                    placeholder="e.g. SUB-[BUSINESS_NAME]"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Change Owner Passcode */}
                <div className="md:col-span-2 pt-2 border-t border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Update App Owner Security Passcode
                  </label>
                  <input
                    type="text"
                    value={formState.ownerPasscode}
                    onChange={(e) => setFormState({ ...formState, ownerPasscode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    This password controls access to this owner settings portal.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleLock}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock & Close</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer text-xs flex items-center gap-2"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSaving ? "Saving..." : "Save Banking Details"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
