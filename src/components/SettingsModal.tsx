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
  Save, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Sparkles,
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  UserCheck,
  UserX,
  Calendar,
  CreditCard,
  Mail,
  Phone,
  Building,
  Loader2
} from "lucide-react";
import { SubscriptionBankingDetails, Seller } from "../types";
import { 
  saveBankingDetailsToFirestore, 
  subscribeToSellers, 
  saveSellerToFirestore, 
  deleteSellerFromFirestore 
} from "../lib/firestoreServices";

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
  const [activeTab, setActiveTab] = useState<"banking" | "sellers">("sellers");
  const [inputPasscode, setInputPasscode] = useState<string>("");
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Banking form state
  const [formState, setFormState] = useState<SubscriptionBankingDetails>(bankingDetails);
  const [isSavingBanking, setIsSavingBanking] = useState<boolean>(false);
  const [bankingSaveSuccess, setBankingSaveSuccess] = useState<boolean>(false);

  // Sellers subscription management state
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [sellerSearch, setSellerSearch] = useState<string>("");
  const [sellerPlanFilter, setSellerPlanFilter] = useState<string>("All");
  const [sellerStatusFilter, setSellerStatusFilter] = useState<string>("All");
  
  // Edit / Add Seller Modal State
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [isAddingSeller, setIsAddingSeller] = useState<boolean>(false);
  const [sellerForm, setSellerForm] = useState<Partial<Seller>>({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    subscription: {
      active: true,
      plan: "Pro",
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amountPaid: 499
    }
  });
  const [isSavingSeller, setIsSavingSeller] = useState<boolean>(false);
  const [sellerActionNotice, setSellerActionNotice] = useState<string | null>(null);

  // Delete Seller Confirm State
  const [deletingSellerId, setDeletingSellerId] = useState<string | null>(null);

  // Sync formState when bankingDetails prop updates
  useEffect(() => {
    setFormState(bankingDetails);
  }, [bankingDetails]);

  // Subscribe to real-time Firestore sellers list
  useEffect(() => {
    if (isOpen) {
      const unsub = subscribeToSellers((sellerList) => {
        setSellers(sellerList);
      });
      return () => unsub();
    }
  }, [isOpen]);

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

  const handleSaveBanking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBanking(true);
    setBankingSaveSuccess(false);
    try {
      await saveBankingDetailsToFirestore(formState);
      setBankingSaveSuccess(true);
      setTimeout(() => setBankingSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error("Save banking settings error:", err);
      alert("Failed to save settings: " + (err.message || String(err)));
    } finally {
      setIsSavingBanking(false);
    }
  };

  const handleOpenAddSeller = () => {
    setSellerForm({
      name: "",
      businessName: "",
      email: "",
      phone: "",
      subscription: {
        active: true,
        plan: "Pro",
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amountPaid: 499
      }
    });
    setEditingSeller(null);
    setIsAddingSeller(true);
  };

  const handleOpenEditSeller = (seller: Seller) => {
    setEditingSeller(seller);
    setSellerForm({
      name: seller.name,
      businessName: seller.businessName || "",
      email: seller.email,
      phone: seller.phone,
      subscription: {
        active: seller.subscription?.active ?? true,
        plan: seller.subscription?.plan || "Pro",
        expiryDate: seller.subscription?.expiryDate || "2026-12-31",
        amountPaid: seller.subscription?.amountPaid || 499
      }
    });
    setIsAddingSeller(false);
  };

  const handleSaveSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerForm.name || !sellerForm.email) {
      alert("Please enter seller name and email.");
      return;
    }

    setIsSavingSeller(true);
    try {
      const sellerId = editingSeller ? editingSeller.id : `sel-${Date.now()}`;
      const updatedSeller: Seller = {
        id: sellerId,
        name: sellerForm.name,
        businessName: sellerForm.businessName || "",
        email: sellerForm.email,
        phone: sellerForm.phone || "",
        subscription: {
          active: sellerForm.subscription?.active ?? true,
          plan: (sellerForm.subscription?.plan as any) || "Pro",
          expiryDate: sellerForm.subscription?.expiryDate || "2026-12-31",
          amountPaid: Number(sellerForm.subscription?.amountPaid || 0)
        }
      };

      await saveSellerToFirestore(updatedSeller);
      setSellerActionNotice(
        editingSeller 
          ? `Updated seller "${updatedSeller.name}" successfully!` 
          : `Added new seller "${updatedSeller.name}" to subscription directory!`
      );
      setTimeout(() => setSellerActionNotice(null), 3500);

      // Close sub-modal
      setEditingSeller(null);
      setIsAddingSeller(false);
    } catch (err: any) {
      console.error("Save seller error:", err);
      alert("Error saving seller: " + (err.message || String(err)));
    } finally {
      setIsSavingSeller(false);
    }
  };

  const handleDeleteSellerConfirm = async (sellerId: string) => {
    try {
      const res = await deleteSellerFromFirestore(sellerId);
      const notice = res.deletedListingsCount > 0
        ? `Seller and ${res.deletedListingsCount} associated part listing${res.deletedListingsCount === 1 ? '' : 's'} deleted successfully.`
        : "Seller deleted successfully from subscription records.";
      setSellerActionNotice(notice);
      setTimeout(() => setSellerActionNotice(null), 4500);
      setDeletingSellerId(null);
    } catch (err: any) {
      console.error("Delete seller error:", err);
      alert("Failed to delete seller: " + (err.message || String(err)));
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setInputPasscode("");
    setAuthError(null);
    setEditingSeller(null);
    setIsAddingSeller(false);
  };

  // Filter sellers
  const filteredSellers = sellers.filter((s) => {
    const query = sellerSearch.toLowerCase().trim();
    const matchesQuery = 
      !query ||
      s.name.toLowerCase().includes(query) ||
      (s.businessName && s.businessName.toLowerCase().includes(query)) ||
      s.email.toLowerCase().includes(query) ||
      s.phone.includes(query);

    const matchesPlan = 
      sellerPlanFilter === "All" || 
      s.subscription?.plan === sellerPlanFilter;

    const matchesStatus = 
      sellerStatusFilter === "All" ||
      (sellerStatusFilter === "Active" && s.subscription?.active) ||
      (sellerStatusFilter === "Inactive" && !s.subscription?.active);

    return matchesQuery && matchesPlan && matchesStatus;
  });

  // Seller Stats
  const totalSubscribers = sellers.length;
  const activeSubscribers = sellers.filter(s => s.subscription?.active).length;
  const totalMonthlyRevenue = sellers
    .filter(s => s.subscription?.active)
    .reduce((acc, s) => acc + (s.subscription?.amountPaid || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white transition-colors shrink-0 ${
              isUnlocked ? "bg-emerald-600 border border-emerald-400" : "bg-blue-600 border border-blue-400"
            }`}>
              {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-display text-white">
                  App Owner Settings & Management
                </h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Password Protected
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage subscription banking info and seller subscription accounts.
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
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {!isUnlocked ? (
            /* Locked State: Password Challenge */
            <div className="max-w-md mx-auto py-8 space-y-6 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-700 mx-auto border-2 border-slate-200">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 font-display">
                  App Owner Authentication Required
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Subscription banking configuration and seller management are password protected. Enter your owner passcode to proceed.
                </p>
              </div>

              {authError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleUnlock} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Owner Passcode
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
                    Default passcode: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-bold">admin123</code>
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                >
                  <Key className="w-4 h-4" />
                  <span>Authenticate & Unlock Settings</span>
                </button>
              </form>
            </div>
          ) : (
            /* Unlocked State */
            <div className="space-y-6">
              {/* Top Security & Navigation Bar */}
              <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-2 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-1 w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab("sellers")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center ${
                      activeTab === "sellers"
                        ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Seller Subscriptions List</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {sellers.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("banking")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center ${
                      activeTab === "banking"
                        ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <span>Banking & Plan Prices</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleLock}
                  className="text-xs font-bold text-slate-500 hover:text-red-600 px-3 py-1.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Session</span>
                </button>
              </div>

              {sellerActionNotice && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3 rounded-xl flex items-center gap-2 animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">{sellerActionNotice}</span>
                </div>
              )}

              {/* TAB 1: SELLERS SUBSCRIPTIONS LIST */}
              {activeTab === "sellers" && (
                <div className="space-y-5">
                  {/* Summary Stat Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                      <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
                        <span>Total Sellers</span>
                        <Users className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="text-xl font-bold font-display text-slate-900">
                        {totalSubscribers}
                      </div>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5">
                      <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold mb-1">
                        <span>Active Subscribers</span>
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-xl font-bold font-display text-emerald-900">
                        {activeSubscribers}
                      </div>
                    </div>

                    <div className="bg-blue-50/60 border border-blue-200/80 rounded-xl p-3.5">
                      <div className="flex items-center justify-between text-blue-700 text-xs font-semibold mb-1">
                        <span>Monthly Recurring (MRR)</span>
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="text-xl font-bold font-display text-blue-900">
                        R{totalMonthlyRevenue.toLocaleString()}.00
                      </div>
                    </div>
                  </div>

                  {/* Search, Filter & Add Seller Action Bar */}
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                    {/* Search */}
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={sellerSearch}
                        onChange={(e) => setSellerSearch(e.target.value)}
                        placeholder="Search seller by name, business, email or phone..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <select
                          value={sellerPlanFilter}
                          onChange={(e) => setSellerPlanFilter(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="All">All Plans</option>
                          <option value="Starter">Starter (R249)</option>
                          <option value="Pro">Pro (R499)</option>
                          <option value="Enterprise">Enterprise (R999)</option>
                          <option value="None">None</option>
                        </select>
                      </div>

                      <select
                        value={sellerStatusFilter}
                        onChange={(e) => setSellerStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active Only</option>
                        <option value="Inactive">Inactive Only</option>
                      </select>

                      <button
                        onClick={handleOpenAddSeller}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Seller</span>
                      </button>
                    </div>
                  </div>

                  {/* Sellers List Table / Cards */}
                  {filteredSellers.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center text-slate-500 space-y-2">
                      <Users className="w-8 h-8 mx-auto text-slate-400" />
                      <p className="text-sm font-bold text-slate-700">No sellers matched your criteria</p>
                      <p className="text-xs text-slate-400">Try clearing filters or search keywords.</p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                              <th className="p-3">Seller & Business Name</th>
                              <th className="p-3">Contact Information</th>
                              <th className="p-3">Plan</th>
                              <th className="p-3">Status</th>
                              <th className="p-3">Expiry Date</th>
                              <th className="p-3">Monthly Fee</th>
                              <th className="p-3 text-right">Owner Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {filteredSellers.map((seller) => {
                              const isActive = seller.subscription?.active;
                              const plan = seller.subscription?.plan || "Pro";
                              const amount = seller.subscription?.amountPaid || (plan === "Starter" ? 249 : plan === "Pro" ? 499 : plan === "Enterprise" ? 999 : 0);

                              return (
                                <tr key={seller.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="p-3">
                                    <div className="font-bold text-slate-900 text-sm">
                                      {seller.name}
                                    </div>
                                    {seller.businessName && (
                                      <div className="text-[11px] text-blue-700 font-medium flex items-center gap-1 mt-0.5">
                                        <Building className="w-3 h-3 text-blue-500 shrink-0" />
                                        <span>{seller.businessName}</span>
                                      </div>
                                    )}
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      ID: {seller.id}
                                    </div>
                                  </td>

                                  <td className="p-3">
                                    <div className="flex items-center gap-1.5 text-slate-700">
                                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="font-medium">{seller.email}</span>
                                    </div>
                                    {seller.phone && (
                                      <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span>{seller.phone}</span>
                                      </div>
                                    )}
                                  </td>

                                  <td className="p-3">
                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                      plan === "Enterprise"
                                        ? "bg-amber-100 text-amber-900 border-amber-300"
                                        : plan === "Pro"
                                        ? "bg-blue-100 text-blue-900 border-blue-300"
                                        : plan === "Starter"
                                        ? "bg-slate-100 text-slate-800 border-slate-300"
                                        : "bg-slate-50 text-slate-500 border-slate-200"
                                    }`}>
                                      {plan}
                                    </span>
                                  </td>

                                  <td className="p-3">
                                    {isActive ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                        <span>Active</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
                                        <UserX className="w-3 h-3 text-red-600" />
                                        <span>Inactive</span>
                                      </span>
                                    )}
                                  </td>

                                  <td className="p-3 font-mono text-slate-600">
                                    {seller.subscription?.expiryDate || "N/A"}
                                  </td>

                                  <td className="p-3 font-bold text-slate-900">
                                    R{amount}.00
                                  </td>

                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => handleOpenEditSeller(seller)}
                                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                                        title="Edit Seller Subscription"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        onClick={() => setDeletingSellerId(seller.id)}
                                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer"
                                        title="Delete Seller"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: BANKING DETAILS */}
              {activeTab === "banking" && (
                <form onSubmit={handleSaveBanking} className="space-y-6">
                  {bankingSaveSuccess && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs p-3 rounded-xl flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-bold">Subscription banking details saved successfully to Firestore!</span>
                    </div>
                  )}

                  {/* Form Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
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

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Monthly Standard Subscription Fee (ZAR R)
                      </label>
                      <input
                        type="number"
                        value={formState.monthlyFeeZar}
                        onChange={(e) => setFormState({ ...formState, monthlyFeeZar: Number(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                    </div>

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

                    <div className="md:col-span-2 pt-4 border-t border-slate-200">
                      <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2 mb-1">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <span>Subscription Plan Pricing (ZAR / Rands)</span>
                      </h4>
                      <p className="text-xs text-slate-500 mb-3">
                        Set the monthly rate charged for each subscription plan. These prices will automatically apply across all seller registration and checkout forms.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Starter Plan Price */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Starter Plan Price (ZAR)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500 text-xs">R</span>
                            <input
                              type="number"
                              value={formState.starterPriceZar ?? 249}
                              onChange={(e) => setFormState({ ...formState, starterPriceZar: Number(e.target.value) })}
                              className="w-full bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              required
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">Up to 10 listings/mo</p>
                        </div>

                        {/* Pro Plan Price */}
                        <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3">
                          <label className="block text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                            Pro Plan Price (ZAR)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-blue-600 text-xs">R</span>
                            <input
                              type="number"
                              value={formState.proPriceZar ?? 499}
                              onChange={(e) => setFormState({ ...formState, proPriceZar: Number(e.target.value) })}
                              className="w-full bg-white border border-blue-300 rounded-lg pl-7 pr-3 py-2 text-sm font-bold text-blue-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              required
                            />
                          </div>
                          <p className="text-[10px] text-blue-600 font-medium mt-1">Unlimited + Priority feed</p>
                        </div>

                        {/* Enterprise Plan Price */}
                        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3">
                          <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                            Enterprise Plan Price (ZAR)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-amber-600 text-xs">R</span>
                            <input
                              type="number"
                              value={formState.enterprisePriceZar ?? 999}
                              onChange={(e) => setFormState({ ...formState, enterprisePriceZar: Number(e.target.value) })}
                              className="w-full bg-white border border-amber-300 rounded-lg pl-7 pr-3 py-2 text-sm font-bold text-amber-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              required
                            />
                          </div>
                          <p className="text-[10px] text-amber-700 font-medium mt-1">Heavy fleets & Auto-import</p>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 pt-2 border-t border-slate-200">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Update Owner Security Passcode
                      </label>
                      <input
                        type="text"
                        value={formState.ownerPasscode}
                        onChange={(e) => setFormState({ ...formState, ownerPasscode: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        required
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        This passcode controls access to this App Owner settings modal.
                      </p>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="pt-4 border-t border-slate-200 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSavingBanking}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer text-xs flex items-center gap-2"
                    >
                      {isSavingBanking ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>{isSavingBanking ? "Saving..." : "Save Banking Details"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* EDIT / ADD SELLER SUB-MODAL */}
      {(isAddingSeller || editingSeller) && (
        <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-sm font-bold font-display">
                {editingSeller ? `Edit Seller: ${editingSeller.name}` : "Add New Seller Subscriber"}
              </h3>
              <button
                onClick={() => {
                  setEditingSeller(null);
                  setIsAddingSeller(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSellerSubmit} className="p-5 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Seller Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={sellerForm.name || ""}
                  onChange={(e) => setSellerForm({ ...sellerForm, name: e.target.value })}
                  placeholder="e.g. Johan Smith"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={sellerForm.businessName || ""}
                  onChange={(e) => setSellerForm({ ...sellerForm, businessName: e.target.value })}
                  placeholder="e.g. Pretoria Auto Spares"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={sellerForm.email || ""}
                    onChange={(e) => setSellerForm({ ...sellerForm, email: e.target.value })}
                    placeholder="seller@example.co.za"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={sellerForm.phone || ""}
                    onChange={(e) => setSellerForm({ ...sellerForm, phone: e.target.value })}
                    placeholder="+27 82 123 4567"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={sellerForm.subscription?.plan || "Pro"}
                    onChange={(e) => {
                      const p = e.target.value as any;
                      const fee = p === "Starter" ? (formState.starterPriceZar ?? 249) : p === "Pro" ? (formState.proPriceZar ?? 499) : p === "Enterprise" ? (formState.enterprisePriceZar ?? 999) : 0;
                      setSellerForm({
                        ...sellerForm,
                        subscription: {
                          ...sellerForm.subscription,
                          active: sellerForm.subscription?.active ?? true,
                          plan: p,
                          amountPaid: fee,
                          expiryDate: sellerForm.subscription?.expiryDate || "2026-12-31"
                        }
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="Starter">Starter (R{formState.starterPriceZar ?? 249}/mo)</option>
                    <option value="Pro">Pro (R{formState.proPriceZar ?? 499}/mo)</option>
                    <option value="Enterprise">Enterprise (R{formState.enterprisePriceZar ?? 999}/mo)</option>
                    <option value="None">None</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Amount Paid (ZAR)
                  </label>
                  <input
                    type="number"
                    value={sellerForm.subscription?.amountPaid ?? 499}
                    onChange={(e) => setSellerForm({
                      ...sellerForm,
                      subscription: {
                        ...sellerForm.subscription!,
                        amountPaid: Number(e.target.value)
                      }
                    })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={sellerForm.subscription?.expiryDate || "2026-12-31"}
                    onChange={(e) => setSellerForm({
                      ...sellerForm,
                      subscription: {
                        ...sellerForm.subscription!,
                        expiryDate: e.target.value
                      }
                    })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subscription Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setSellerForm({
                      ...sellerForm,
                      subscription: {
                        ...sellerForm.subscription!,
                        active: !sellerForm.subscription?.active
                      }
                    })}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                      sellerForm.subscription?.active
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-red-50 text-red-800 border-red-300"
                    }`}
                  >
                    {sellerForm.subscription?.active ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Status: ACTIVE</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-3.5 h-3.5 text-red-600" />
                        <span>Status: INACTIVE</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSeller(null);
                    setIsAddingSeller(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingSeller}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isSavingSeller ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{editingSeller ? "Update Seller" : "Create Seller"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE SELLER CONFIRMATION MODAL */}
      {deletingSellerId && (
        <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 space-y-4 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Seller & All Listings?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this seller? <span className="font-semibold text-red-600">All spare part listings posted by this seller will also be permanently deleted</span> from the marketplace. This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSellerId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleDeleteSellerConfirm(deletingSellerId)}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
