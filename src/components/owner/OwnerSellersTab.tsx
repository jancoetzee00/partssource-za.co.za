/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  Users,
  UserCheck,
  UserX,
  CreditCard,
  Search,
  Plus,
  Edit,
  Trash2,
  Building,
  Mail,
  Phone,
  Calendar,
  Save,
  X,
  Loader2,
  Sparkles,
  MapPin,
  Globe,
  CheckCircle2,
  ShieldCheck,
  Package,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Eye
} from "lucide-react";
import { Seller, PartListing, SubscriptionBankingDetails } from "../../types";
import {
  saveSellerToFirestore,
  deleteSellerFromFirestore
} from "../../lib/firestoreServices";

interface OwnerSellersTabProps {
  sellers: Seller[];
  listings: PartListing[];
  bankingDetails: SubscriptionBankingDetails;
  onFilterInventoryBySeller: (sellerId: string) => void;
  onShowNotice: (msg: string) => void;
}

const ZA_PROVINCES = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape"
];

export const OwnerSellersTab: React.FC<OwnerSellersTabProps> = ({
  sellers,
  listings,
  bankingDetails,
  onFilterInventoryBySeller,
  onShowNotice
}) => {
  const [sellerSearch, setSellerSearch] = useState<string>("");
  const [sellerPlanFilter, setSellerPlanFilter] = useState<string>("All");
  const [sellerStatusFilter, setSellerStatusFilter] = useState<string>("All");

  // Profile View / Inspect State
  const [inspectingSeller, setInspectingSeller] = useState<Seller | null>(null);

  // Edit / Add Seller Modal State
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [isAddingSeller, setIsAddingSeller] = useState<boolean>(false);
  const [sellerForm, setSellerForm] = useState<Partial<Seller>>({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    whatsapp: "",
    avatar: "",
    province: "Gauteng",
    city: "Pretoria",
    address: "",
    description: "",
    isVerified: true,
    joinedDate: new Date().toISOString().split("T")[0],
    website: "",
    bankDetails: {
      bankName: "FNB",
      accountHolder: "",
      accountNumber: "",
      branchCode: ""
    },
    subscription: {
      active: true,
      plan: "Pro",
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      amountPaid: bankingDetails.proPriceZar ?? 499,
      paymentRef: "SUB-NEW"
    }
  });

  const [isSavingSeller, setIsSavingSeller] = useState<boolean>(false);
  const [deletingSellerId, setDeletingSellerId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Filtered sellers
  const filteredSellers = sellers.filter((s) => {
    const query = sellerSearch.toLowerCase().trim();
    const matchesQuery =
      !query ||
      s.name.toLowerCase().includes(query) ||
      (s.businessName && s.businessName.toLowerCase().includes(query)) ||
      s.email.toLowerCase().includes(query) ||
      s.phone.includes(query) ||
      (s.city && s.city.toLowerCase().includes(query)) ||
      (s.province && s.province.toLowerCase().includes(query));

    const matchesPlan =
      sellerPlanFilter === "All" || s.subscription?.plan === sellerPlanFilter;

    const matchesStatus =
      sellerStatusFilter === "All" ||
      (sellerStatusFilter === "Active" && s.subscription?.active) ||
      (sellerStatusFilter === "Inactive" && !s.subscription?.active);

    return matchesQuery && matchesPlan && matchesStatus;
  });

  // Metrics
  const totalSubscribers = sellers.length;
  const activeSubscribers = sellers.filter((s) => s.subscription?.active).length;
  const totalMonthlyRevenue = sellers
    .filter((s) => s.subscription?.active)
    .reduce((acc, s) => acc + (s.subscription?.amountPaid || 0), 0);

  // Open Edit Form
  const handleOpenEdit = (seller: Seller) => {
    setEditingSeller(seller);
    setSellerForm({
      ...seller,
      bankDetails: seller.bankDetails || {
        bankName: "FNB",
        accountHolder: seller.businessName || seller.name,
        accountNumber: "",
        branchCode: ""
      },
      subscription: {
        active: seller.subscription?.active ?? true,
        plan: seller.subscription?.plan || "Pro",
        expiryDate: seller.subscription?.expiryDate || "2026-12-31",
        amountPaid: seller.subscription?.amountPaid || bankingDetails.proPriceZar || 499,
        paymentRef: seller.subscription?.paymentRef || `SUB-${(seller.businessName || seller.name).toUpperCase().replace(/[^A-Z0-9]/g, '')}`
      }
    });
    setInspectingSeller(null);
  };

  // Open Add Form
  const handleOpenAdd = () => {
    setEditingSeller(null);
    setSellerForm({
      name: "",
      businessName: "",
      email: "",
      phone: "",
      whatsapp: "",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200",
      province: "Gauteng",
      city: "Johannesburg",
      address: "",
      description: "",
      isVerified: true,
      joinedDate: new Date().toISOString().split("T")[0],
      website: "",
      bankDetails: {
        bankName: "FNB",
        accountHolder: "",
        accountNumber: "",
        branchCode: ""
      },
      subscription: {
        active: true,
        plan: "Pro",
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        amountPaid: bankingDetails.proPriceZar ?? 499,
        paymentRef: "SUB-AUTO"
      }
    });
    setIsAddingSeller(true);
  };

  // Save Seller
  const handleSaveSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerForm.name || !sellerForm.email) {
      alert("Please fill in Seller Name and Email Address.");
      return;
    }

    setIsSavingSeller(true);
    try {
      const sellerId = editingSeller ? editingSeller.id : `sel-${Date.now()}`;
      const updatedSeller: Seller = {
        id: sellerId,
        name: sellerForm.name.trim(),
        businessName: sellerForm.businessName?.trim() || "",
        email: sellerForm.email.trim(),
        phone: sellerForm.phone?.trim() || "",
        whatsapp: sellerForm.whatsapp?.trim() || sellerForm.phone?.trim() || "",
        avatar: sellerForm.avatar?.trim() || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200",
        province: sellerForm.province || "Gauteng",
        city: sellerForm.city?.trim() || "Pretoria",
        address: sellerForm.address?.trim() || "",
        description: sellerForm.description?.trim() || "",
        isVerified: sellerForm.isVerified !== undefined ? sellerForm.isVerified : true,
        joinedDate: sellerForm.joinedDate || new Date().toISOString().split("T")[0],
        website: sellerForm.website?.trim() || "",
        bankDetails: sellerForm.bankDetails || undefined,
        subscription: {
          active: sellerForm.subscription?.active ?? true,
          plan: (sellerForm.subscription?.plan as any) || "Pro",
          expiryDate: sellerForm.subscription?.expiryDate || "2026-12-31",
          amountPaid: Number(sellerForm.subscription?.amountPaid || 0),
          paymentRef: sellerForm.subscription?.paymentRef || `SUB-${(sellerForm.businessName || sellerForm.name).toUpperCase().replace(/[^A-Z0-9]/g, '')}`
        }
      };

      await saveSellerToFirestore(updatedSeller);
      onShowNotice(
        editingSeller
          ? `Updated seller profile for "${updatedSeller.businessName || updatedSeller.name}" successfully!`
          : `Created new seller account "${updatedSeller.businessName || updatedSeller.name}" in Firestore!`
      );

      setEditingSeller(null);
      setIsAddingSeller(false);
    } catch (err: any) {
      console.error("Save seller error:", err);
      alert("Error saving seller profile: " + (err.message || String(err)));
    } finally {
      setIsSavingSeller(false);
    }
  };

  // Delete Seller
  const handleDeleteSellerConfirm = async (sellerId: string) => {
    setIsDeleting(true);
    try {
      const res = await deleteSellerFromFirestore(sellerId);
      const notice =
        res.deletedListingsCount > 0
          ? `Seller and ${res.deletedListingsCount} associated part listing${res.deletedListingsCount === 1 ? "" : "s"} deleted successfully.`
          : "Seller deleted successfully from database.";
      onShowNotice(notice);
      setDeletingSellerId(null);
      if (inspectingSeller?.id === sellerId) {
        setInspectingSeller(null);
      }
    } catch (err: any) {
      console.error("Delete seller error:", err);
      alert("Failed to delete seller: " + (err.message || String(err)));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Registered Sellers</span>
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
            R{totalMonthlyRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sellerSearch}
              onChange={(e) => setSellerSearch(e.target.value)}
              placeholder="Search seller by name, company, email, city, province..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={sellerPlanFilter}
            onChange={(e) => setSellerPlanFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Plans</option>
            <option value="Starter">Starter (R{bankingDetails.starterPriceZar ?? 249})</option>
            <option value="Pro">Pro (R{bankingDetails.proPriceZar ?? 499})</option>
            <option value="Enterprise">Enterprise (R{bankingDetails.enterprisePriceZar ?? 999})</option>
          </select>

          <select
            value={sellerStatusFilter}
            onChange={(e) => setSellerStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive Only</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Seller</span>
        </button>
      </div>

      {/* Sellers Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Seller / Scrap Yard</th>
                <th className="p-3">Location & Contact</th>
                <th className="p-3">Subscription Tier</th>
                <th className="p-3">Live Parts</th>
                <th className="p-3">Status & Renewal</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No sellers found matching your search.
                  </td>
                </tr>
              ) : (
                filteredSellers.map((seller) => {
                  const sellerListingsCount = listings.filter((l) => l.sellerId === seller.id).length;
                  return (
                    <tr key={seller.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Seller info */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={seller.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150"}
                            alt={seller.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100 cursor-pointer"
                            onClick={() => setInspectingSeller(seller)}
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInspectingSeller(seller)}
                                className="font-bold text-slate-900 hover:text-blue-600 text-left line-clamp-1 cursor-pointer"
                              >
                                {seller.businessName || seller.name}
                              </button>
                              {seller.isVerified && (
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" title="Verified Automotive Seller" />
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium truncate">
                              Contact: {seller.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Location & Contact */}
                      <td className="p-3 space-y-0.5">
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">
                            {seller.city ? `${seller.city}, ${seller.province || "ZA"}` : seller.province || "South Africa"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px]">{seller.email}</span>
                        </div>
                        {seller.phone && (
                          <div className="flex items-center gap-1 text-slate-500 font-mono text-[10px]">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{seller.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Subscription Plan */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              seller.subscription?.plan === "Enterprise"
                                ? "bg-purple-100 text-purple-800"
                                : seller.subscription?.plan === "Pro"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {seller.subscription?.plan || "Standard"}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700">
                            R{seller.subscription?.amountPaid || bankingDetails.monthlyFeeZar || 499}/mo
                          </span>
                        </div>
                      </td>

                      {/* Live Parts Count */}
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => onFilterInventoryBySeller(seller.id)}
                          className="inline-flex items-center gap-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold px-2.5 py-1 rounded-xl transition-colors cursor-pointer text-xs"
                          title="Click to view and manage inventory for this seller"
                        >
                          <Package className="w-3 h-3 text-blue-600" />
                          <span>{sellerListingsCount} part{sellerListingsCount === 1 ? '' : 's'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>

                      {/* Status & Renewal */}
                      <td className="p-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            {seller.subscription?.active ? (
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-emerald-600" />
                                <span>ACTIVE</span>
                              </span>
                            ) : (
                              <span className="bg-red-100 text-red-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <UserX className="w-3 h-3 text-red-600" />
                                <span>INACTIVE</span>
                              </span>
                            )}
                          </div>
                          {seller.subscription?.expiryDate && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Renews: {seller.subscription.expiryDate}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setInspectingSeller(seller)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View Full Seller Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(seller)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Seller Profile"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingSellerId(seller.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Seller & Parts"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SELLER PROFILE INSPECTION MODAL */}
      {/* ======================================================== */}
      {inspectingSeller && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150 text-left max-h-[90vh] flex flex-col">
            {/* Header Banner */}
            <div className="bg-slate-900 text-white p-5 flex items-start justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-4">
                <img
                  src={inspectingSeller.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200"}
                  alt={inspectingSeller.name}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-blue-500 shrink-0 bg-slate-800"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold font-display text-white">
                      {inspectingSeller.businessName || inspectingSeller.name}
                    </h3>
                    {inspectingSeller.isVerified && (
                      <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Contact: {inspectingSeller.name} • Member Since: {inspectingSeller.joinedDate || "2024"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectingSeller(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Stat Highlights */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Listed Spares</span>
                  <span className="text-base font-bold text-slate-900">
                    {listings.filter((l) => l.sellerId === inspectingSeller.id).length} parts
                  </span>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-emerald-600 font-bold uppercase block">Active Plan</span>
                  <span className="text-base font-bold text-emerald-900">
                    {inspectingSeller.subscription?.plan || "Pro"} (R{inspectingSeller.subscription?.amountPaid || 499})
                  </span>
                </div>
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-2.5">
                  <span className="text-[10px] text-blue-600 font-bold uppercase block">Subscription Status</span>
                  <span className="text-base font-bold text-blue-900">
                    {inspectingSeller.subscription?.active ? "ACTIVE" : "INACTIVE"}
                  </span>
                </div>
              </div>

              {/* Location & Contact Grid */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Contact Channels & Physical Scrap Yard
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{inspectingSeller.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 font-mono">
                    <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{inspectingSeller.phone}</span>
                  </div>
                  {inspectingSeller.whatsapp && (
                    <div className="flex items-center gap-2 text-slate-700 font-mono">
                      <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>WhatsApp: {inspectingSeller.whatsapp}</span>
                    </div>
                  )}
                  {inspectingSeller.website && (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                      <a
                        href={inspectingSeller.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 underline truncate"
                      >
                        {inspectingSeller.website}
                      </a>
                    </div>
                  )}
                  <div className="col-span-1 sm:col-span-2 flex items-start gap-2 text-slate-700 pt-1 border-t border-slate-200/80">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">
                        {inspectingSeller.address ? `${inspectingSeller.address}, ` : ""}
                        {inspectingSeller.city || "Pretoria"}, {inspectingSeller.province || "Gauteng"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio & Speciality */}
              {inspectingSeller.description && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Scrap Yard Speciality & Bio:
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 leading-relaxed">
                    {inspectingSeller.description}
                  </div>
                </div>
              )}

              {/* Seller's Active Inventory Mini-Feed */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>Live Parts by This Seller ({listings.filter((l) => l.sellerId === inspectingSeller.id).length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      onFilterInventoryBySeller(inspectingSeller.id);
                      setInspectingSeller(null);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    Open in Inventory Tab
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50 p-2 text-xs">
                  {listings.filter((l) => l.sellerId === inspectingSeller.id).length === 0 ? (
                    <div className="text-slate-400 py-3 text-center">No parts currently posted by this seller.</div>
                  ) : (
                    listings
                      .filter((l) => l.sellerId === inspectingSeller.id)
                      .map((p) => (
                        <div key={p.id} className="py-2 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">{p.title}</div>
                            <div className="text-[10px] text-slate-500">OEM #{p.partNumber || "N/A"} • {p.category}</div>
                          </div>
                          <span className="font-mono font-bold text-slate-900 shrink-0">R{Number(p.price).toLocaleString()}</span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleOpenEdit(inspectingSeller)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Full Profile</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectingSeller(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Done / Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* EDIT / ADD SELLER FULL PROFILE MODAL */}
      {/* ======================================================== */}
      {(isAddingSeller || editingSeller) && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display text-white">
                    {editingSeller ? `Edit Profile: ${editingSeller.businessName || editingSeller.name}` : "Add New Seller Account"}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Update profile credentials, workshop address, verification badge, and subscription tier
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingSeller(null);
                  setIsAddingSeller(false);
                }}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveSellerSubmit} className="p-5 overflow-y-auto space-y-4 text-left flex-1">
              {/* Identity & Business */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  1. Business Identity & Representative
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Business / Scrap Yard Name
                    </label>
                    <input
                      type="text"
                      value={sellerForm.businessName || ""}
                      onChange={(e) => setSellerForm({ ...sellerForm, businessName: e.target.value })}
                      placeholder="e.g. Pretoria Truck & Auto Spares"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Primary Contact Person *
                    </label>
                    <input
                      type="text"
                      required
                      value={sellerForm.name || ""}
                      onChange={(e) => setSellerForm({ ...sellerForm, name: e.target.value })}
                      placeholder="e.g. Gert van der Merwe"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Avatar / Logo URL
                    </label>
                    <input
                      type="url"
                      value={sellerForm.avatar || ""}
                      onChange={(e) => setSellerForm({ ...sellerForm, avatar: e.target.value })}
                      placeholder="https://..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Verification Badge
                    </label>
                    <button
                      type="button"
                      onClick={() => setSellerForm({ ...sellerForm, isVerified: !sellerForm.isVerified })}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                        sellerForm.isVerified
                          ? "bg-blue-50 text-blue-800 border-blue-300"
                          : "bg-slate-100 text-slate-600 border-slate-300"
                      }`}
                    >
                      <ShieldCheck className={`w-4 h-4 ${sellerForm.isVerified ? "text-blue-600" : "text-slate-400"}`} />
                      <span>{sellerForm.isVerified ? "Verified Automotive Seller" : "Standard Unverified"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Location & Address */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  2. Location & Scrap Yard Address
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Province
                    </label>
                    <select
                      value={sellerForm.province || "Gauteng"}
                      onChange={(e) => setSellerForm({ ...sellerForm, province: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {ZA_PROVINCES.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      City / Town
                    </label>
                    <input
                      type="text"
                      value={sellerForm.city || ""}
                      onChange={(e) => setSellerForm({ ...sellerForm, city: e.target.value })}
                      placeholder="e.g. Pretoria, Durban, Cape Town"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Physical Workshop / Yard Street Address
                    </label>
                    <input
                      type="text"
                      value={sellerForm.address || ""}
                      onChange={(e) => setSellerForm({ ...sellerForm, address: e.target.value })}
                      placeholder="e.g. 144 Van Der Hoff Rd, Pretoria West"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Channels */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  3. Contact Channels & Digital Presence
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      WhatsApp Direct Number
                    </label>
                    <input
                      type="text"
                      value={sellerForm.whatsapp || ""}
                      onChange={(e) => setSellerForm({ ...sellerForm, whatsapp: e.target.value })}
                      placeholder="+27821234567"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={sellerForm.website || ""}
                      onChange={(e) => setSellerForm({ ...sellerForm, website: e.target.value })}
                      placeholder="https://myspares.co.za"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Speciality / Scrap Yard Overview
                  </label>
                  <textarea
                    rows={2}
                    value={sellerForm.description || ""}
                    onChange={(e) => setSellerForm({ ...sellerForm, description: e.target.value })}
                    placeholder="e.g. Specialist yard for Hilux & Quantum commercial fleet teardowns, OEM diesel injectors..."
                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Subscription Tier & Status */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  4. Subscription Tier & Payment Status
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Subscription Plan
                    </label>
                    <select
                      value={sellerForm.subscription?.plan || "Pro"}
                      onChange={(e) => {
                        const p = e.target.value as any;
                        const fee =
                          p === "Starter"
                            ? (bankingDetails.starterPriceZar ?? 249)
                            : p === "Pro"
                            ? (bankingDetails.proPriceZar ?? 499)
                            : p === "Enterprise"
                            ? (bankingDetails.enterprisePriceZar ?? 999)
                            : 0;
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
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="Starter">Starter (R{bankingDetails.starterPriceZar ?? 249}/mo)</option>
                      <option value="Pro">Pro (R{bankingDetails.proPriceZar ?? 499}/mo)</option>
                      <option value="Enterprise">Enterprise (R{bankingDetails.enterprisePriceZar ?? 999}/mo)</option>
                      <option value="None">None</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Monthly Fee (ZAR)
                    </label>
                    <input
                      type="number"
                      value={sellerForm.subscription?.amountPaid ?? 499}
                      onChange={(e) =>
                        setSellerForm({
                          ...sellerForm,
                          subscription: {
                            ...sellerForm.subscription!,
                            amountPaid: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Renewal / Expiry Date
                    </label>
                    <input
                      type="date"
                      value={sellerForm.subscription?.expiryDate || "2026-12-31"}
                      onChange={(e) =>
                        setSellerForm({
                          ...sellerForm,
                          subscription: {
                            ...sellerForm.subscription!,
                            expiryDate: e.target.value
                          }
                        })
                      }
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subscription Account Status
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSellerForm({
                        ...sellerForm,
                        subscription: {
                          ...sellerForm.subscription!,
                          active: !sellerForm.subscription?.active
                        }
                      })
                    }
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                      sellerForm.subscription?.active
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : "bg-red-50 text-red-800 border-red-300"
                    }`}
                  >
                    {sellerForm.subscription?.active ? (
                      <>
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>Status: ACTIVE (Seller can post and sell parts)</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-4 h-4 text-red-600" />
                        <span>Status: INACTIVE / SUSPENDED</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSeller(null);
                    setIsAddingSeller(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingSeller}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  {isSavingSeller ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{editingSeller ? "Update Seller Profile" : "Create Seller Account"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE SELLER CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {deletingSellerId && (
        <div className="fixed inset-0 z-70 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-5 space-y-4 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Seller & All Listings?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove this seller? <span className="font-semibold text-red-600">All spare part listings posted by this seller will also be permanently deleted</span> from the marketplace.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSellerId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleDeleteSellerConfirm(deletingSellerId)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
