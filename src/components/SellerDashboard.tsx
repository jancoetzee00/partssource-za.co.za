/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Seller, PartListing, SubscriptionBankingDetails, SellerNotification } from "../types";
import { 
  Plus, 
  Sparkles, 
  Star, 
  CheckCircle, 
  CreditCard, 
  LogIn, 
  LogOut, 
  Package, 
  User, 
  PlusCircle, 
  Trash2, 
  ArrowLeft, 
  Loader2, 
  Building, 
  Phone, 
  Building2, 
  Lock, 
  ShieldCheck, 
  Copy, 
  Check,
  FileText,
  Download,
  Calendar,
  Receipt,
  X,
  ExternalLink,
  Shield,
  FileCheck,
  Bell,
  BellRing,
  UploadCloud,
  Eye,
  MessageSquare
} from "lucide-react";
import { 
  signInWithGoogle, 
  subscribeToSellerNotifications, 
  markNotificationAsReadInFirestore 
} from "../lib/firestoreServices";
import { downloadSubscriptionInvoicePdf } from "../lib/generateInvoicePdf";
import { SA_PROVINCES, getTownsForProvince } from "../data/saLocations";

interface SellerDashboardProps {
  onAddListing: (listing: any) => Promise<any>;
  onDeleteListing: (id: string) => Promise<boolean>;
  seller: Seller | null;
  setSeller: React.Dispatch<React.SetStateAction<Seller | null>>;
  sellerListings: PartListing[];
  bankingDetails?: SubscriptionBankingDetails;
  onOpenSettings?: () => void;
  onOpenEftModal?: (purpose?: "subscription" | "part_purchase" | "general", amount?: number, ref?: string) => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  onAddListing,
  onDeleteListing,
  seller,
  setSeller,
  sellerListings,
  bankingDetails,
  onOpenSettings,
  onOpenEftModal
}) => {
  // Auth Form State
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // New Listing Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("Engine Parts");
  const [formVehicleType, setFormVehicleType] = useState<"Car" | "Truck" | "Both">("Car");
  const [formCondition, setFormCondition] = useState<"New" | "Like New" | "Good" | "Fair" | "Refurbished" | "For Parts">("Good");
  const [formPrice, setFormPrice] = useState("");
  const [formProvince, setFormProvince] = useState("Gauteng");
  const [formTown, setFormTown] = useState("Kempton Park");
  const [formLocation, setFormLocation] = useState("Kempton Park, Gauteng");
  const [formPartNumber, setFormPartNumber] = useState("");
  const [formBrand, setFormBrand] = useState("");
  const [formCompatibility, setFormCompatibility] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formImage, setFormImage] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [postError, setPostError] = useState("");

  // Subscription Checkout State
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"Starter" | "Pro" | "Enterprise">("Pro");
  const [paymentMethod, setPaymentMethod] = useState<"eft" | "card">("eft");
  const [copiedRef, setCopiedRef] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [subscribing, setSubscribing] = useState(false);

  const activeBank = bankingDetails || {
    bankName: "First National Bank (FNB)",
    accountHolder: "Partssource ZA (Pty) Ltd",
    accountNumber: "62890001234",
    branchCode: "250655",
    accountType: "Cheque Account",
    referenceFormat: "SUB-[BUSINESS_NAME]",
    monthlyFeeZar: 499,
    starterPriceZar: 249,
    proPriceZar: 499,
    enterprisePriceZar: 999,
    ownerPasscode: "admin123"
  };

  const getPlanPrice = (plan: "Starter" | "Pro" | "Enterprise") => {
    if (plan === "Starter") return activeBank.starterPriceZar ?? 249;
    if (plan === "Pro") return activeBank.proPriceZar ?? 499;
    return activeBank.enterprisePriceZar ?? 999;
  };

  // Invoice & Billing State
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoiceMonth, setSelectedInvoiceMonth] = useState<string>(() => {
    return new Date().toLocaleString("default", { month: "long", year: "numeric" });
  });
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [downloadSuccessNotice, setDownloadSuccessNotice] = useState<string | null>(null);

  // Live Seller Notifications & Proof of Payments State
  const [notifications, setNotifications] = useState<SellerNotification[]>([]);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [selectedPopDoc, setSelectedPopDoc] = useState<SellerNotification | null>(null);

  // Subscribe to Seller Notifications from Firestore
  React.useEffect(() => {
    if (!seller?.id) return;
    const unsub = subscribeToSellerNotifications(seller.id, (items) => {
      setNotifications(items);
    });
    return () => unsub();
  }, [seller?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await markNotificationAsReadInFirestore(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    } catch (err) {
      console.warn("Failed to mark notification as read:", err);
    }
  };

  const getPastMonthsList = () => {
    const months: { label: string; value: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", { month: "long", year: "numeric" });
      months.push({ label, value: label });
    }
    return months;
  };

  const handleDownloadInvoicePdf = (customMonth?: string) => {
    if (!seller) return;
    setIsDownloadingPdf(true);
    try {
      const targetMonth = customMonth || selectedInvoiceMonth || new Date().toLocaleString("default", { month: "long", year: "numeric" });
      downloadSubscriptionInvoicePdf({
        seller,
        bankingDetails: activeBank,
        month: targetMonth
      });
      setDownloadSuccessNotice(`Downloaded Tax Invoice for ${targetMonth}`);
      setTimeout(() => setDownloadSuccessNotice(null), 4000);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF invoice. Please try again.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Handle Auth Login / Registration
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setAuthLoading(true);

    try {
      const res = await fetch("/api/sellers/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, phone, businessName })
      });
      const data = await res.json();
      setSeller(data);
    } catch (err) {
      console.error("Auth error:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle subscription purchase
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller || subscribing) return;
    setSubscribing(true);

    try {
      const res = await fetch(`/api/sellers/${seller.id}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, cardNumber })
      });
      const data = await res.json();
      if (data.seller) {
        setSeller(data.seller);
        setShowCheckout(false);
        // Reset card fields
        setCardNumber("");
        setCardExpiry("");
        setCardCvv("");
      }
    } catch (err) {
      console.error("Subscribe error:", err);
    } finally {
      setSubscribing(false);
    }
  };

  // AI Description Suggestion
  const handleSuggestDescription = async () => {
    if (!formTitle.trim()) {
      alert("Please enter a listing title first so the AI knows what part to describe!");
      return;
    }
    setAiGenerating(true);

    try {
      const res = await fetch("/api/gemini/suggest-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          condition: formCondition,
          category: formCategory,
          vehicleModel: formCompatibility
        })
      });
      const data = await res.json();
      if (data.description) {
        setFormDescription(data.description);
      }
    } catch (err) {
      console.error("AI Description generation failed:", err);
    } finally {
      setAiGenerating(false);
    }
  };

  // Submit Listing
  const handlePostListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;
    setPostError("");

    if (!formTitle.trim() || !formPrice || !formLocation.trim()) {
      setPostError("Please fill in all mandatory fields: Title, Price, Location.");
      return;
    }

    setPostLoading(true);

    const listingPayload = {
      title: formTitle,
      category: formCategory,
      vehicleType: formVehicleType,
      condition: formCondition,
      price: Number(formPrice),
      location: formLocation,
      province: formProvince,
      town: formTown,
      partNumber: formPartNumber,
      brand: formBrand,
      compatibility: formCompatibility || "Fits standard models of specified vehicles.",
      description: formDescription || `High quality ${formTitle} in ${formCondition} condition.`,
      images: formImage ? [formImage] : [],
      sellerId: seller.id
    };

    const success = await onAddListing(listingPayload);
    setPostLoading(false);

    if (success) {
      // Clear Form and Close
      setFormTitle("");
      setFormPrice("");
      setFormPartNumber("");
      setFormBrand("");
      setFormCompatibility("");
      setFormDescription("");
      setFormImage("");
      setShowAddForm(false);
    } else {
      setPostError("Failed to publish listing. Please make sure your subscription is active.");
    }
  };

  // Handle Google Login via Firebase
  const handleGoogleAuth = async () => {
    setAuthLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      if (fbUser) {
        setSeller({
          id: fbUser.uid,
          name: fbUser.displayName || "Seller",
          businessName: fbUser.displayName ? `${fbUser.displayName} Spares` : "Auto Spares Distributor",
          email: fbUser.email || "",
          phone: fbUser.phoneNumber || "+27 82 000 0000",
          subscription: {
            active: true,
            plan: "Pro",
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            amountPaid: 499
          }
        });
      }
    } catch (err) {
      console.error("Firebase Google Auth error:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  if (!seller) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 max-w-lg mx-auto shadow-xs">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Building className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-900">Sellers Hub</h2>
          <p className="text-sm text-slate-500 mt-1">
            Access your dashboard, manage your inventory and advertise to thousands of automotive buyers in ZA.
          </p>
        </div>

        {/* Firebase Google Auth Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={authLoading}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3 rounded-xl border border-slate-300 transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Sign in with Google Account (Firebase)</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400 font-semibold">Or continue with email</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. johan@scrapyard.co.za"
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Contact Person Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Johan Coetzee"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Business Name (Optional)
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Pretoria Scrap Yard Spares"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              WhatsApp / Phone Number
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +27 12 555 9011"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:bg-white transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full bg-slate-950 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs font-display text-sm"
          >
            {authLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>Sign In to Seller Panel</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seller Header panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 font-bold">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-display font-bold">
                {seller.businessName || seller.name}
              </h2>
              {seller.subscription.active ? (
                <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  ACTIVE SUBSCRIBER ({seller.subscription.plan})
                </span>
              ) : (
                <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  SUBSCRIPTION INACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Seller ID: {seller.id} • {seller.email} • {seller.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Direct Notifications & Proof of Payments Indicator */}
          <button
            onClick={() => setShowNotificationsDrawer(!showNotificationsDrawer)}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 relative ${
              unreadCount > 0 
                ? "bg-amber-500 text-slate-950 shadow-md animate-pulse" 
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            }`}
            title="View Buyer Proof of Payments & System Notifications"
          >
            <Bell className={`w-3.5 h-3.5 ${unreadCount > 0 ? "text-slate-950" : "text-amber-400"}`} />
            <span>Buyer POPs</span>
            {unreadCount > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {seller.subscription.active && (
            <button
              onClick={() => setShowInvoiceModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="View and Download Monthly Subscription Tax Invoice"
            >
              <Receipt className="w-3.5 h-3.5 text-amber-400" />
              <span>Tax Invoice (PDF)</span>
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="App Owner Settings & Password Protected Banking"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Owner Settings</span>
            </button>
          )}

          <button
            onClick={() => setSeller(null)}
            className="border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          {!seller.subscription.active && (
            <button
              onClick={() => setShowCheckout(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Subscribe Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications & Proof of Payments Banner Drawer */}
      {(showNotificationsDrawer || unreadCount > 0) && (
        <div className="bg-white border-2 border-amber-400/80 rounded-2xl p-5 shadow-lg space-y-4 animate-scale-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>Buyer Proof of Payments & Inbound Alerts</span>
                  {unreadCount > 0 && (
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {unreadCount} New Unread
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  Direct notifications received when buyers submit bank EFT payment slips
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowNotificationsDrawer(false)}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No proof of payment slips or notifications yet. When buyers upload EFT slips for your parts or inquiries, they will appear here instantly.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                    !notif.read 
                      ? "bg-amber-50/70 border-amber-300" 
                      : "bg-slate-50/60 border-slate-200"
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-slate-900">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(notif.createdAt).toLocaleString("en-ZA")}
                      </span>
                      {!notif.read && (
                        <span className="bg-amber-200 text-amber-900 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {notif.message}
                    </p>
                    {notif.reference && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        <span>Ref: <strong>{notif.reference}</strong></span>
                        {notif.amount && (
                          <span className="text-emerald-700 font-bold">
                            Amount: R{notif.amount.toLocaleString("en-ZA")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {notif.fileDataUrl && (
                      <button
                        onClick={() => setSelectedPopDoc(notif)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View POP Slip</span>
                      </button>
                    )}

                    {notif.payerContact && (
                      <a
                        href={`https://wa.me/${notif.payerContact.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Reply WhatsApp</span>
                      </a>
                    )}

                    {!notif.read && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* POP Document Viewer Modal */}
      {selectedPopDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{selectedPopDoc.title}</h3>
                  <p className="text-xs text-slate-500">
                    Payer: {selectedPopDoc.payerName} • Ref: {selectedPopDoc.reference}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPopDoc(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-100 rounded-2xl p-4 flex items-center justify-center max-h-[60vh] overflow-auto">
              {selectedPopDoc.fileDataUrl?.startsWith("data:application/pdf") ? (
                <div className="text-center space-y-3 py-6">
                  <FileText className="w-16 h-16 text-rose-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">{selectedPopDoc.fileName || "ProofOfPayment.pdf"}</p>
                  <a
                    href={selectedPopDoc.fileDataUrl}
                    download={selectedPopDoc.fileName || "ProofOfPayment.pdf"}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF Document</span>
                  </a>
                </div>
              ) : selectedPopDoc.fileDataUrl ? (
                <img
                  src={selectedPopDoc.fileDataUrl}
                  alt="Proof of Payment Slip"
                  className="max-h-[50vh] max-w-full rounded-xl object-contain border border-slate-200 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-slate-400 text-xs">No preview available for this document.</div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-slate-500">
                Contact: <strong>{selectedPopDoc.payerContact || "N/A"}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleMarkAsRead(selectedPopDoc.id);
                    setSelectedPopDoc(null);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Confirm & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Success Notice */}
      {downloadSuccessNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{downloadSuccessNotice}</span>
          </div>
          <button 
            onClick={() => setDownloadSuccessNotice(null)} 
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Subscription Paywall Block */}
      {!seller.subscription.active && !showCheckout && (
        <div className="bg-blue-50/40 border border-blue-200/60 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-lg font-display">
              <Star className="w-5 h-5 fill-blue-600 text-blue-600" />
              Monthly Spares Advertisement Subscription Required
            </div>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              At Partssource ZA, all sellers pay a small monthly advertising fee. This model ensures zero commissions, high-quality authentic buyer leads, and a scam-free trading marketplace.
            </p>
          </div>
          <button
            onClick={() => setShowCheckout(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3.5 rounded-xl shadow-md text-sm transition-all cursor-pointer hover:scale-[1.02] shrink-0"
          >
            Unlock Listing Posting
          </button>
        </div>
      )}

      {/* Checkout Screen Overlay */}
      {showCheckout && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <button 
              onClick={() => setShowCheckout(false)} 
              className="p-1 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors mr-1 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-display font-bold text-slate-900">Activate Monthly Advertising</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Plans List */}
            <div className="lg:col-span-7 space-y-4">
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                1. Select your Advertiser Plan
              </span>
              
              {/* Starter */}
              <div 
                onClick={() => setSelectedPlan("Starter")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPlan === "Starter" 
                    ? "border-slate-900 bg-slate-50/50" 
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 font-display">Starter Plan</h4>
                    <p className="text-xs text-slate-500 mt-1">Post up to 10 standard parts per month. Ideal for small local spares yards.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900">R{getPlanPrice("Starter")}</span>
                    <span className="text-xs text-slate-500 block">/month</span>
                  </div>
                </div>
              </div>

              {/* Pro */}
              <div 
                onClick={() => setSelectedPlan("Pro")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all relative overflow-hidden ${
                  selectedPlan === "Pro" 
                    ? "border-blue-600 bg-blue-50/10" 
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 font-display flex items-center gap-1">
                      Pro Plan 
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">Post unlimited spares + sponsored priority exposure highlighted in search feeds.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900">R{getPlanPrice("Pro")}</span>
                    <span className="text-xs text-slate-500 block">/month</span>
                  </div>
                </div>
              </div>

              {/* Enterprise */}
              <div 
                onClick={() => setSelectedPlan("Enterprise")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPlan === "Enterprise" 
                    ? "border-slate-900 bg-slate-50/50" 
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 font-display">Enterprise Plan</h4>
                    <p className="text-xs text-slate-500 mt-1">Unlimited bakkie & heavy duty truck parts + automated daily catalog imports.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-slate-900">R{getPlanPrice("Enterprise")}</span>
                    <span className="text-xs text-slate-500 block">/month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Options Portal */}
            <div className="lg:col-span-5 bg-slate-50 rounded-xl p-5 border border-slate-200">
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                2. Select Subscription Payment Method
              </span>

              {/* Toggle Buttons */}
              <div className="grid grid-cols-2 gap-2 mb-4 bg-slate-200 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("eft")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === "eft"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Direct Bank EFT</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentMethod === "card"
                      ? "bg-white text-blue-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Debit / Credit Card</span>
                </button>
              </div>

              {paymentMethod === "eft" ? (
                /* Bank EFT Details (Configured by App Owner in Settings) */
                <div className="space-y-4 text-left">
                  <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bank Name</span>
                      <span className="text-sm font-bold text-slate-900">{activeBank.bankName}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Holder</span>
                      <span className="text-xs font-bold text-slate-800">{activeBank.accountHolder}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Number</span>
                      <span className="text-sm font-bold font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {activeBank.accountNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Branch Code</span>
                      <span className="text-xs font-mono font-bold text-slate-800">{activeBank.branchCode}</span>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account Type</span>
                      <span className="text-xs font-medium text-slate-700">{activeBank.accountType}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment Reference</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          SUB-{seller.businessName ? seller.businessName.replace(/\s+/g, '').toUpperCase() : seller.name.replace(/\s+/g, '').toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const refStr = `SUB-${seller.businessName ? seller.businessName.replace(/\s+/g, '').toUpperCase() : seller.name.replace(/\s+/g, '').toUpperCase()}`;
                            navigator.clipboard.writeText(refStr);
                            setCopiedRef(true);
                            setTimeout(() => setCopiedRef(false), 2000);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                          title="Copy reference code"
                        >
                          {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-bold">EFT Activation Instructions:</p>
                      {onOpenEftModal && (
                        <button
                          type="button"
                          onClick={() => {
                            const refStr = `SUB-${seller.businessName ? seller.businessName.replace(/\s+/g, '').toUpperCase() : seller.name.replace(/\s+/g, '').toUpperCase()}`;
                            onOpenEftModal("subscription", getPlanPrice(selectedPlan), refStr);
                          }}
                          className="text-[11px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 underline cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Open Bank Links & Slip</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Please transfer <strong className="font-bold text-amber-950">R{getPlanPrice(selectedPlan)}.00</strong> using the reference code above. Click "Confirm EFT Transfer Sent" to notify billing.
                    </p>
                  </div>

                  <form onSubmit={handleSubscribe}>
                    <button
                      type="submit"
                      disabled={subscribing}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer text-xs"
                    >
                      {subscribing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      <span>Confirm EFT Transfer Sent & Activate Plan</span>
                    </button>
                  </form>
                </div>
              ) : (
                /* Card Form */
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={seller.name}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Debit/Credit Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, ''))}
                        maxLength={16}
                        placeholder="4000 1234 5678 9010"
                        className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:border-amber-500 font-mono"
                      />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        CVV Code
                      </label>
                      <input
                        type="password"
                        required
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        maxLength={3}
                        placeholder="•••"
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:border-amber-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-100 p-3 rounded-lg text-xs text-slate-500 flex items-center justify-between border-t border-slate-200/50">
                    <span>To pay now:</span>
                    <span className="font-bold text-slate-900">
                      R{getPlanPrice(selectedPlan)}.00
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={subscribing}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    {subscribing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>Unlock {selectedPlan} Spares Panel</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Panel Content (Active Subscribed Seller) */}
      {seller.subscription.active && !showCheckout && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Post New Listing Form */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-500" />
                Advertise Spares Listing
              </h3>
              
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                {showAddForm ? "Hide Form" : "Open Listing Form"}
              </button>
            </div>

            {showAddForm ? (
              <form onSubmit={handlePostListingSubmit} className="space-y-4">
                {postError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                    {postError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Spares Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Toyota Hilux 2.8 GD-6 OEM Fuel Injectors"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-amber-500 focus:bg-white"
                    >
                      <option value="Engine Parts">Engine Parts</option>
                      <option value="Transmission">Transmission</option>
                      <option value="Brakes">Brakes</option>
                      <option value="Suspension & Steering">Suspension & Steering</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Body Parts">Body Parts</option>
                      <option value="Wheels & Tyres">Wheels & Tyres</option>
                      <option value="Interior">Interior</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Other">Other Spare Parts</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Vehicle Fitment *
                    </label>
                    <select
                      value={formVehicleType}
                      onChange={(e) => setFormVehicleType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
                    >
                      <option value="Car">Car / SUV / LCV</option>
                      <option value="Truck">Heavy Duty Truck / Commercial</option>
                      <option value="Both">Both Car & Truck</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Spares Condition *
                    </label>
                    <select
                      value={formCondition}
                      onChange={(e) => setFormCondition(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
                    >
                      <option value="New">New Spare Parts</option>
                      <option value="Like New">Used - Like New</option>
                      <option value="Good">Used - Good Condition</option>
                      <option value="Fair">Used - Fair Condition</option>
                      <option value="Refurbished">Remanufactured / Refurbished</option>
                      <option value="For Parts">Scrap Spares / For Parts</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Price (ZAR / Rands) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      placeholder="e.g. 12500"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Part/OEM Number
                    </label>
                    <input
                      type="text"
                      value={formPartNumber}
                      onChange={(e) => setFormPartNumber(e.target.value)}
                      placeholder="e.g. 23670-0E010"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Brand / Manufacturer
                    </label>
                    <input
                      type="text"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="e.g. Denso OEM"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Business Location (RSA) *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={formProvince}
                        onChange={(e) => {
                          const newProv = e.target.value;
                          setFormProvince(newProv);
                          const towns = getTownsForProvince(newProv);
                          const newTown = towns[0] || "";
                          setFormTown(newTown);
                          setFormLocation(newTown ? `${newTown}, ${newProv}` : newProv);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
                      >
                        {SA_PROVINCES.map((prov) => (
                          <option key={prov.name} value={prov.name}>
                            {prov.name} ({prov.code})
                          </option>
                        ))}
                      </select>

                      <select
                        value={formTown}
                        onChange={(e) => {
                          const newTown = e.target.value;
                          setFormTown(newTown);
                          setFormLocation(newTown ? `${newTown}, ${formProvince}` : formProvince);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-amber-500"
                      >
                        {getTownsForProvince(formProvince).map((town) => (
                          <option key={town} value={town}>
                            {town}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      required
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      placeholder="e.g. Kempton Park, Gauteng"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Compatibility / Models Fitted
                  </label>
                  <input
                    type="text"
                    value={formCompatibility}
                    onChange={(e) => setFormCompatibility(e.target.value)}
                    placeholder="e.g. Fits Toyota Hilux 2016-2023, Toyota Fortuner 2.8 GD6"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Photo Asset URL
                  </label>
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    placeholder="Provide image URL, or leave empty for a matching default placeholder image"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Item Description
                    </label>
                    <button
                      type="button"
                      onClick={handleSuggestDescription}
                      disabled={aiGenerating}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-750 bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {aiGenerating ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 text-blue-600" />
                          <span>Suggest Description with Gemini AI</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Provide condition remarks, warranty info, whether you can package and ship, etc."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={postLoading}
                  className="w-full bg-slate-950 hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs font-display text-sm"
                >
                  {postLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Publish Advertising Listing</span>
                </button>
              </form>
            ) : (
              <div 
                onClick={() => setShowAddForm(true)}
                className="border-2 border-dashed border-slate-200 hover:border-amber-400 p-8 rounded-xl text-center cursor-pointer transition-colors"
              >
                <PlusCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">Post a New Spare Part</h4>
                <p className="text-xs text-slate-400 mt-1">Ready to list? Click to open the detailed part specification form.</p>
              </div>
            )}
          </div>

          {/* Seller Inventory List & Subscription Billing */}
          <div className="lg:col-span-4 space-y-6">
            {/* Monthly Subscription & Billing Quick Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4 border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold font-display text-sm">Monthly Subscription</h4>
                </div>
                <span className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {seller.subscription.plan || "Pro"} Tier
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Monthly Rate:</span>
                  <span className="font-bold text-white">R{getPlanPrice(seller.subscription.plan as any)}.00 / mo</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Billing Status:</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Active / Paid
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Renewal Cycle:</span>
                  <span className="text-slate-300">
                    {seller.subscription.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDownloadInvoicePdf()}
                  disabled={isDownloadingPdf}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Download PDF Invoice ({selectedInvoiceMonth.split(" ")[0]})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(true)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-3 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700/50"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>View Tax Invoice Details</span>
                </button>

                {onOpenEftModal && (
                  <button
                    type="button"
                    onClick={() => {
                      const refStr = `SUB-${seller.businessName ? seller.businessName.replace(/\s+/g, '').toUpperCase() : seller.name.replace(/\s+/g, '').toUpperCase()}`;
                      onOpenEftModal("subscription", getPlanPrice(seller.subscription.plan as any), refStr);
                    }}
                    className="w-full bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 py-2 px-3 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Official EFT Banking & POP Link</span>
                  </button>
                )}
              </div>
            </div>

            {/* Inventory List */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Package className="w-5 h-5 text-slate-500" />
                My Live Listings ({sellerListings.length})
              </h3>

              {sellerListings.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  You haven't posted any vehicle parts yet. Click on "Open Listing Form" to publish your first advert.
                </div>
              ) : (
                <div className="space-y-3">
                  {sellerListings.map((l) => (
                    <div key={l.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between gap-3 bg-slate-50/50">
                      <div className="overflow-hidden">
                        <h4 className="font-semibold text-xs text-slate-900 truncate">
                          {l.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-amber-600">R{l.price.toLocaleString("en-ZA")}</span>
                          <span className="text-[9px] text-slate-400 uppercase tracking-wider">{l.category}</span>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete "${l.title}"?`)) {
                            await onDeleteListing(l.id);
                          }
                        }}
                        className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Monthly Tax Invoice Modal */}
      {showInvoiceModal && seller && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-slate-900">Monthly Subscription Tax Invoice</h3>
                  <p className="text-xs text-slate-500">Download official PDF invoice for SARS tax clearance & business bookkeeping</p>
                </div>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Month Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Select Billing Period</span>
              </label>
              <select
                value={selectedInvoiceMonth}
                onChange={(e) => setSelectedInvoiceMonth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {getPastMonthsList().map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} Subscription Tax Invoice
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice Details Preview Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Invoice Number</span>
                  <p className="font-mono font-bold text-slate-800 text-sm">
                    INV-ZA-{seller.id.slice(-6).toUpperCase()}-{new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, "0")}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Payment Status</span>
                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] block mt-0.5">
                    <CheckCircle className="w-3 h-3" /> PAID IN FULL
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Billed To</span>
                  <p className="font-bold text-slate-800 truncate">{seller.businessName || seller.name}</p>
                  <p className="text-slate-500 text-[11px] truncate">{seller.email}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Supplier</span>
                  <p className="font-bold text-slate-800">Partssource ZA (Pty) Ltd</p>
                  <p className="text-slate-500 text-[11px]">VAT: 4890281742</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-slate-700 font-medium">
                  <span>{seller.subscription.plan || "Pro"} Plan Subscription ({selectedInvoiceMonth})</span>
                  <span className="font-bold text-slate-900">R{getPlanPrice(seller.subscription.plan as any)}.00</span>
                </div>
                <div className="border-t border-slate-100 pt-2 space-y-1 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Subtotal (Excl. VAT):</span>
                    <span>R{(getPlanPrice(seller.subscription.plan as any) / 1.15).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (15% RSA):</span>
                    <span>R{(getPlanPrice(seller.subscription.plan as any) - (getPlanPrice(seller.subscription.plan as any) / 1.15)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 text-xs pt-1 border-t border-slate-100">
                    <span>Total Amount Paid (ZAR):</span>
                    <span className="text-amber-600">R{getPlanPrice(seller.subscription.plan as any)}.00</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 text-blue-900">
                <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Includes verified digital tax clearance stamp & platform banking reconciliation reference.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDownloadInvoicePdf(selectedInvoiceMonth);
                  setShowInvoiceModal(false);
                }}
                disabled={isDownloadingPdf}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-md"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Download PDF Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
