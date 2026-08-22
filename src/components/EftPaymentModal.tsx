/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { SubscriptionBankingDetails, ProofOfPayment } from "../types";
import { 
  Building2, 
  Copy, 
  Check, 
  ExternalLink, 
  MessageSquare, 
  Mail, 
  Printer, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  HelpCircle,
  Download,
  AlertCircle,
  UploadCloud,
  FileText,
  FileCheck,
  Paperclip,
  Trash2,
  Send,
  Loader2,
  BellRing,
  Info,
  Sparkles,
  PartyPopper,
  BadgeCheck
} from "lucide-react";
import { submitProofOfPaymentToFirestore } from "../lib/firestoreServices";

interface EftPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankingDetails: SubscriptionBankingDetails;
  initialPurpose?: "subscription" | "part_purchase" | "general";
  initialReference?: string;
  initialAmountZar?: number;
  sellerBusinessName?: string;
  targetSellerId?: string;
  targetSellerName?: string;
  targetListingId?: string;
  targetListingTitle?: string;
  onUploadSuccess?: (popRecord: ProofOfPayment) => void;
}

interface SABankPortal {
  name: string;
  shortName: string;
  url: string;
  color: string;
  textColor: string;
}

const SA_BANK_PORTALS: SABankPortal[] = [
  { name: "First National Bank", shortName: "FNB", url: "https://www.fnb.co.za", color: "bg-teal-700 hover:bg-teal-800", textColor: "text-white" },
  { name: "Standard Bank", shortName: "Standard Bank", url: "https://www.standardbank.co.za", color: "bg-blue-800 hover:bg-blue-900", textColor: "text-white" },
  { name: "Capitec Bank", shortName: "Capitec", url: "https://www.capitecbank.co.za", color: "bg-red-700 hover:bg-red-800", textColor: "text-white" },
  { name: "Nedbank", shortName: "Nedbank", url: "https://www.nedbank.co.za", color: "bg-emerald-800 hover:bg-emerald-900", textColor: "text-white" },
  { name: "Absa Bank", shortName: "Absa", url: "https://www.absa.co.za", color: "bg-rose-700 hover:bg-rose-800", textColor: "text-white" },
  { name: "Discovery Bank", shortName: "Discovery", url: "https://www.discovery.co.za/bank", color: "bg-purple-800 hover:bg-purple-900", textColor: "text-white" },
  { name: "TymeBank", shortName: "TymeBank", url: "https://www.tymebank.co.za", color: "bg-indigo-700 hover:bg-indigo-800", textColor: "text-white" },
];

const SA_BANKS_LIST = [
  "First National Bank (FNB)",
  "Standard Bank",
  "Capitec Bank",
  "Nedbank",
  "Absa Bank",
  "Discovery Bank",
  "TymeBank",
  "Investec",
  "African Bank",
  "Bidvest Bank",
  "Other Bank / International"
];

export const EftPaymentModal: React.FC<EftPaymentModalProps> = ({
  isOpen,
  onClose,
  bankingDetails,
  initialPurpose = "subscription",
  initialReference,
  initialAmountZar,
  sellerBusinessName,
  targetSellerId,
  targetSellerName,
  targetListingId,
  targetListingTitle,
  onUploadSuccess
}) => {
  const [activeTab, setActiveTab] = useState<"banking_details" | "upload_pop">("banking_details");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<"subscription" | "part_purchase" | "general">(initialPurpose);
  const [customIdentifier, setCustomIdentifier] = useState<string>(sellerBusinessName || "");
  const [customAmount, setCustomAmount] = useState<string>(initialAmountZar ? String(initialAmountZar) : "");

  // Upload POP Form State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl: string;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [payerName, setPayerName] = useState(sellerBusinessName || "");
  const [payerContact, setPayerContact] = useState("");
  const [payerBank, setPayerBank] = useState("First National Bank (FNB)");
  const [payerNotes, setPayerNotes] = useState("");
  const [isUploadingPop, setIsUploadingPop] = useState(false);
  const [popError, setPopError] = useState("");
  const [popSuccess, setPopSuccess] = useState<{
    reference: string;
    amount: number;
    recipientName: string;
    timestamp: string;
    popId: string;
  } | null>(null);

  // Toast Notification State
  const [toastNotification, setToastNotification] = useState<{
    id: string;
    title: string;
    message: string;
    reference: string;
    amount: number;
    recipient: string;
    fileName: string;
    timestamp: string;
  } | null>(null);
  const [toastKey, setToastKey] = useState(0);

  // Auto dismiss toast after 6.5 seconds
  React.useEffect(() => {
    if (!toastNotification) return;
    const timer = setTimeout(() => {
      setToastNotification(null);
    }, 6500);
    return () => clearTimeout(timer);
  }, [toastNotification, toastKey]);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Generate Reference String based on purpose & custom identifier
  const cleanId = (customIdentifier || sellerBusinessName || "CLIENT")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 14);

  const referenceCode = initialReference || (
    purpose === "subscription" 
      ? `SUB-${cleanId || "ADVERTISER"}`
      : purpose === "part_purchase"
        ? `PART-${cleanId || "BUYER"}`
        : `EFT-${cleanId || "PAYMENT"}`
  );

  const amountToPay = customAmount || (
    purpose === "subscription" 
      ? String(bankingDetails.proPriceZar || bankingDetails.monthlyFeeZar || 499)
      : ""
  );

  // File Upload Handlers
  const processFile = (file: File) => {
    setPopError("");
    const validExtensions = ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/pdf"];
    if (!validExtensions.includes(file.type) && !file.name.match(/\.(pdf|jpe?g|png|webp)$/i)) {
      setPopError("Please upload a valid PDF document or Image (PNG, JPG, WEBP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setPopError("File size exceeds 8MB. Please upload a smaller file or compressed slip.");
      return;
    }

    const sizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setUploadedFile({
        name: file.name,
        size: sizeFormatted,
        type: file.type || "application/octet-stream",
        dataUrl: dataUrl
      });
    };
    reader.onerror = () => {
      setPopError("Failed to read file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit Proof of Payment Handler
  const handleUploadProofOfPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPopError("");

    if (!uploadedFile) {
      setPopError("Please select or attach your Proof of Payment file (PDF or screenshot).");
      return;
    }

    if (!payerName.trim()) {
      setPopError("Please provide your Name or Business Name.");
      return;
    }

    if (!payerContact.trim()) {
      setPopError("Please provide your Contact Phone / WhatsApp number or Email.");
      return;
    }

    const parsedAmount = parseFloat(amountToPay || "0");
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setPopError("Please specify a valid payment amount in ZAR.");
      return;
    }

    setIsUploadingPop(true);

    try {
      const popPayload: Omit<ProofOfPayment, 'id'> = {
        reference: referenceCode,
        amount: parsedAmount,
        purpose: purpose,
        payerName: payerName.trim(),
        payerContact: payerContact.trim(),
        payerNotes: payerNotes.trim() || undefined,
        bankPaidFrom: payerBank,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        fileDataUrl: uploadedFile.dataUrl,
        fileType: uploadedFile.type,
        targetSellerId: targetSellerId || undefined,
        targetSellerName: targetSellerName || undefined,
        listingId: targetListingId || undefined,
        listingTitle: targetListingTitle || undefined,
        status: "pending_verification",
        createdAt: new Date().toISOString()
      };

      const result = await submitProofOfPaymentToFirestore(popPayload);

      const recipientDisplayName = targetSellerName 
        ? targetSellerName 
        : purpose === "subscription" 
          ? "Partssource ZA Finance & Accounts" 
          : "Seller & Platform Accounts";

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setPopSuccess({
        reference: referenceCode,
        amount: parsedAmount,
        recipientName: recipientDisplayName,
        timestamp: nowTime,
        popId: result.popId
      });

      setToastNotification({
        id: result.popId,
        title: "Proof of Payment Uploaded to Storage!",
        message: `Slip successfully attached and notification sent to ${recipientDisplayName}.`,
        reference: referenceCode,
        amount: parsedAmount,
        recipient: recipientDisplayName,
        fileName: uploadedFile.name,
        timestamp: nowTime
      });
      setToastKey(prev => prev + 1);

      if (onUploadSuccess) {
        onUploadSuccess({
          id: result.popId,
          ...popPayload
        });
      }
    } catch (err: any) {
      console.error("POP submission failed:", err);
      setPopError(err.message || "Failed to submit Proof of Payment. Please check your internet connection.");
    } finally {
      setIsUploadingPop(false);
    }
  };

  // WhatsApp Proof of Payment URL
  const popWhatsAppMsg = encodeURIComponent(
    `Hi Partssource ZA Billing Team, I have made an EFT payment.%0A%0A*Reference:* ${referenceCode}%0A*Amount:* R${amountToPay || "---"}%0A*Bank Paid From:* ${payerBank}%0A*Date:* ${new Date().toLocaleDateString("en-ZA")}%0A%0APlease find attached my Proof of Payment slip.`
  );
  const popWhatsAppUrl = `https://wa.me/27825550192?text=${popWhatsAppMsg}`;

  // Email Proof of Payment URL
  const popEmailSubject = encodeURIComponent(`EFT Proof of Payment: ${referenceCode}`);
  const popEmailBody = encodeURIComponent(
    `Dear Partssource ZA Accounts,\n\nPlease find attached the Proof of Payment for my EFT transaction.\n\nPayment Reference: ${referenceCode}\nAmount Paid: R${amountToPay || "0.00"}\nBank Paid From: ${payerBank}\nDate: ${new Date().toLocaleDateString("en-ZA")}\n\nKind regards,\n${payerName || customIdentifier || "Customer"}`
  );
  const popEmailUrl = `mailto:accounts@partssource.co.za?subject=${popEmailSubject}&body=${popEmailBody}`;

  const handlePrintSlip = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Partssource ZA - Official EFT Payment Banking Slip</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; padding: 40px; max-width: 650px; margin: 0 auto; line-height: 1.5; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
          .logo { font-size: 24px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
          .badge { background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 4px; text-transform: uppercase; }
          .table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; }
          .table td { padding: 12px 14px; border: 1px solid #e2e8f0; font-size: 14px; }
          .table td.label { font-weight: 600; color: #64748b; width: 38%; background: #f8fafc; }
          .table td.val { font-weight: 700; color: #0f172a; }
          .highlight { background: #f0fdf4; color: #166534; font-weight: 800; font-family: monospace; font-size: 16px; }
          .note { background: #fffbeb; border: 1px solid #fde68a; padding: 14px; border-radius: 8px; font-size: 12px; color: #92400e; margin-bottom: 20px; }
          .footer { font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">Partssource ZA</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">South African Truck & Car Spares Marketplace</div>
          </div>
          <div>
            <span class="badge">Official EFT Banking Slip</span>
          </div>
        </div>

        <h3 style="margin: 0 0 10px 0; font-size: 16px;">Verified Banking Details for Electronic Funds Transfer</h3>
        <p style="font-size: 13px; color: #475569; margin: 0 0 16px 0;">Use the banking details and reference below to make your payment via online banking or your mobile banking app.</p>

        <table class="table">
          <tr>
            <td class="label">Bank Name</td>
            <td class="val">${bankingDetails.bankName}</td>
          </tr>
          <tr>
            <td class="label">Account Name / Beneficiary</td>
            <td class="val">${bankingDetails.accountHolder}</td>
          </tr>
          <tr>
            <td class="label">Account Number</td>
            <td class="val highlight">${bankingDetails.accountNumber}</td>
          </tr>
          <tr>
            <td class="label">Branch Code</td>
            <td class="val">${bankingDetails.branchCode} (Universal)</td>
          </tr>
          <tr>
            <td class="label">Account Type</td>
            <td class="val">${bankingDetails.accountType}</td>
          </tr>
          <tr>
            <td class="label">Required Payment Reference</td>
            <td class="val highlight" style="color: #1e40af; background: #eff6ff;">${referenceCode}</td>
          </tr>
          ${amountToPay ? `
          <tr>
            <td class="label">Amount Payable</td>
            <td class="val" style="color: #047857; font-size: 16px;">R${Number(amountToPay).toLocaleString("en-ZA")}.00 ZAR</td>
          </tr>` : ""}
        </table>

        <div class="note">
          <strong>Important Payment Instructions:</strong><br/>
          • Always ensure the exact reference <strong>${referenceCode}</strong> is entered so your payment is automatically reconciled.<br/>
          • Upload your Proof of Payment (POP) directly via the portal or send to <strong>accounts@partssource.co.za</strong> / WhatsApp <strong>+27 82 555 0192</strong> for instant activation.<br/>
          • Immediate/Instant EFT clearance is recommended for instant listing unlocking.
        </div>

        <div class="footer">
          Generated on ${new Date().toLocaleString("en-ZA")} • Partssource ZA Verified Banking System • Republic of South Africa
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-scale-in my-auto flex flex-col max-h-[94vh] relative">
        
        {/* FLOATING SUCCESS TOAST NOTIFICATION */}
        {toastNotification && (
          <div 
            key={toastKey}
            className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-50 bg-slate-950/95 text-white border-2 border-emerald-500 rounded-2xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-md animate-toast-in overflow-hidden"
          >
            {/* Animated Countdown Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-950">
              <div className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 animate-progress-shrink" />
            </div>

            <div className="flex items-start justify-between gap-3 pt-1">
              <div className="flex items-start gap-3 min-w-0">
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black animate-success-bounce shadow-md">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <span className="absolute -inset-1 rounded-xl bg-emerald-400/30 animate-glow-ring pointer-events-none" />
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Upload Succeeded
                    </span>
                    <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono px-2 py-0.2 rounded-full">
                      {toastNotification.reference}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {toastNotification.title}
                  </h4>

                  <p className="text-[11px] text-slate-300 leading-snug">
                    {toastNotification.message}
                  </p>

                  <div className="flex items-center gap-2 pt-0.5 text-[10px] text-slate-400 flex-wrap">
                    <span>File: <strong className="text-slate-200">{toastNotification.fileName}</strong></span>
                    <span>•</span>
                    <span>Amount: <strong className="text-emerald-400">R{toastNotification.amount.toLocaleString("en-ZA")}</strong></span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setToastNotification(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title="Dismiss toast"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between relative">
          <div className="space-y-1.5 pr-8">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-slate-950" />
                Verified Banking Details
              </span>
              <span className="text-blue-300 text-xs font-semibold">
                Direct South African Bank Transfer
              </span>
              {targetSellerName && (
                <span className="bg-blue-800/80 text-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                  <BellRing className="w-2.5 h-2.5 text-amber-300" />
                  Notifies {targetSellerName}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              EFT Payment & Proof of Payment
            </h2>
            <p className="text-slate-300 text-xs leading-relaxed">
              Transfer securely using internet banking or your bank app. 0% fees, instant receipt notification.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-4 sm:px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("banking_details")}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === "banking_details"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-2xs"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. Banking Details & Reference</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("upload_pop")}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer relative ${
              activeTab === "upload_pop"
                ? "border-blue-600 text-blue-600 bg-white rounded-t-xl shadow-2xs"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>2. Upload Proof of Payment</span>
            {popSuccess ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ) : (
              <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                Notify Seller
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-900">
          
          {/* TAB 1: BANKING DETAILS & REFERENCE */}
          {activeTab === "banking_details" && (
            <div className="space-y-6">
              
              {/* Reference Customizer & Purpose Picker */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Payment Purpose & Auto-Reference
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Unique identifier for auto-reconciliation
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPurpose("subscription")}
                    className={`py-2 px-3 rounded-xl font-bold transition-all text-center cursor-pointer ${
                      purpose === "subscription"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Advertiser Subscription
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurpose("part_purchase")}
                    className={`py-2 px-3 rounded-xl font-bold transition-all text-center cursor-pointer ${
                      purpose === "part_purchase"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Spare Part Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPurpose("general")}
                    className={`py-2 px-3 rounded-xl font-bold transition-all text-center cursor-pointer ${
                      purpose === "general"
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    General Transfer
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Your Business / Name (for Reference)
                    </label>
                    <input
                      type="text"
                      value={customIdentifier}
                      onChange={(e) => {
                        setCustomIdentifier(e.target.value);
                        if (!payerName) setPayerName(e.target.value);
                      }}
                      placeholder="e.g. Gauteng Diesel Tech"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Amount in ZAR (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">R</span>
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder={purpose === "subscription" ? "499" : "e.g. 1500"}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>

                {targetListingTitle && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-xs text-blue-900 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Target Item: <strong>{targetListingTitle}</strong></span>
                  </div>
                )}
              </div>

              {/* Official Bank Account Information Card */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Official Partssource ZA Banking Details
                  </span>
                  <button
                    onClick={handlePrintSlip}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Print or Save Official Slip"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / Save Slip</span>
                  </button>
                </div>

                <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Bank Name */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank Name</span>
                        <span className="text-sm font-bold text-white">{bankingDetails.bankName}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(bankingDetails.bankName, "bankName")}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        title="Copy Bank Name"
                      >
                        {copiedField === "bankName" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Account Holder */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Holder</span>
                        <span className="text-sm font-bold text-white truncate max-w-[170px]">{bankingDetails.accountHolder}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(bankingDetails.accountHolder, "accountHolder")}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        title="Copy Account Holder"
                      >
                        {copiedField === "accountHolder" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Account Number */}
                    <div className="bg-blue-950/60 border border-blue-500/40 rounded-xl p-3 flex items-center justify-between sm:col-span-2">
                      <div>
                        <span className="text-[10px] uppercase font-black text-blue-300 block">Account Number</span>
                        <span className="text-lg font-black font-mono text-amber-300 tracking-wider">
                          {bankingDetails.accountNumber}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(bankingDetails.accountNumber, "accountNumber")}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        title="Copy Account Number"
                      >
                        {copiedField === "accountNumber" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Account</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Branch Code */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Branch Code (Universal)</span>
                        <span className="text-sm font-bold font-mono text-white">{bankingDetails.branchCode}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(bankingDetails.branchCode, "branchCode")}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        title="Copy Branch Code"
                      >
                        {copiedField === "branchCode" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Account Type */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Type</span>
                        <span className="text-sm font-bold text-white">{bankingDetails.accountType}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(bankingDetails.accountType, "accountType")}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                        title="Copy Account Type"
                      >
                        {copiedField === "accountType" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Reference Code Card */}
                    <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between sm:col-span-2">
                      <div>
                        <span className="text-[10px] uppercase font-black text-emerald-300 block">Your Payment Reference (Mandatory)</span>
                        <span className="text-base sm:text-lg font-black font-mono text-emerald-200 tracking-wider">
                          {referenceCode}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(referenceCode, "referenceCode")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        title="Copy Reference Code"
                      >
                        {copiedField === "referenceCode" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-200" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Reference</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Launch South African Bank Portals */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Open Your Bank Online (Quick Access)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SA_BANK_PORTALS.map((bank) => (
                    <a
                      key={bank.name}
                      href={bank.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${bank.color} ${bank.textColor} p-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all shadow-2xs hover:scale-[1.02] cursor-pointer`}
                      title={`Open ${bank.name} Online Banking`}
                    >
                      <span className="truncate">{bank.shortName}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-80" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Action Banner to Proceed to Upload Proof of Payment */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-xs font-black text-blue-900 flex items-center gap-1.5 justify-center sm:justify-start">
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    Already made the EFT transfer?
                  </h4>
                  <p className="text-[11px] text-blue-800">
                    Upload your proof of payment slip to notify the seller and activate your order instantly.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("upload_pop")}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Proof of Payment</span>
                </button>
              </div>

              {/* Security & Verification Notice */}
              <div className="flex items-start gap-2.5 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Zero Card Skimming Risk:</strong> Direct bank EFT transfers are processed through the South African Reserve Bank clearing network. We never store bank passwords or PINs.
                </p>
              </div>

            </div>
          )}

          {/* TAB 2: UPLOAD PROOF OF PAYMENT */}
          {activeTab === "upload_pop" && (
            <div className="space-y-5">
              
              {/* Animated Success Celebration Banner */}
              {popSuccess && (
                <div className="bg-gradient-to-b from-emerald-50/90 via-emerald-50/40 to-white border-2 border-emerald-500 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4 animate-scale-in relative overflow-hidden">
                  {/* Floating particle sparkles */}
                  <div className="absolute top-3 right-6 pointer-events-none opacity-80">
                    <Sparkles className="w-6 h-6 text-amber-400 animate-particle-1" />
                  </div>
                  <div className="absolute top-8 right-16 pointer-events-none opacity-70">
                    <PartyPopper className="w-5 h-5 text-emerald-500 animate-particle-2" />
                  </div>
                  <div className="absolute bottom-4 left-6 pointer-events-none opacity-60">
                    <Sparkles className="w-4 h-4 text-emerald-400 animate-particle-3" />
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {/* Animated Bouncy Check Icon */}
                    <div className="relative shrink-0">
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg animate-success-bounce">
                        <Check className="w-7 h-7 stroke-[3]" />
                      </div>
                      <span className="absolute -inset-2 rounded-2xl bg-emerald-400/30 animate-glow-ring pointer-events-none" />
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-200" />
                          Storage Upload Confirmed
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-500">
                          {popSuccess.timestamp}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black font-display text-slate-900">
                        Proof of Payment Saved & Seller Alerted!
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Your payment slip was stored in our verified system and an automated transaction notification was dispatched to <strong>{popSuccess.recipientName}</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Transaction Details Pill Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white p-3.5 rounded-2xl border border-emerald-200/80 shadow-2xs text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reference</span>
                      <span className="font-mono font-black text-slate-900 text-xs sm:text-sm">{popSuccess.reference}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Amount Paid</span>
                      <span className="font-black text-emerald-700 text-xs sm:text-sm">R{popSuccess.amount.toLocaleString("en-ZA")}.00</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verification Status</span>
                      <span className="inline-flex items-center gap-1 font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md text-[10px] mt-0.5">
                        <Clock className="w-3 h-3 text-teal-600" /> Instant Match Queued
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-900 font-semibold">
                      <BellRing className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                      <span>Live alert pushed to seller dashboard</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={popWhatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs hover:scale-[1.02] cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-white" />
                        <span>Confirm on WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setPopSuccess(null);
                          setUploadedFile(null);
                        }}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Upload Another
                      </button>

                      <button
                        type="button"
                        onClick={onClose}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Target Notification Destination Callout */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <BellRing className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">
                    Direct System Notification Destination
                  </span>
                  <span className="text-slate-600 text-[11px]">
                    {targetSellerName 
                      ? `Alerting seller "${targetSellerName}" and Partssource ZA Billing Desk`
                      : purpose === "subscription"
                        ? `Alerting Partssource ZA Finance & Accounts for Instant Plan Activation`
                        : `Alerting Seller and Platform Accounts Desk`}
                  </span>
                </div>
              </div>

              {/* Upload Form */}
              <form onSubmit={handleUploadProofOfPayment} className="space-y-4">
                
                {/* File Dropzone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>1. Attach Slip / POP Document (PDF or Screenshot) *</span>
                    <span className="text-[11px] font-normal text-slate-500">Max 8MB</span>
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                  />

                  {!uploadedFile ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                        dragOver 
                          ? "border-blue-500 bg-blue-50/50 scale-[1.01]" 
                          : "border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/20"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 mb-1">
                        Click to browse or drag & drop your Proof of Payment
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Supports bank PDF receipts, payment screenshots, or camera photos (.pdf, .png, .jpg)
                      </p>
                    </div>
                  ) : (
                    <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          {uploadedFile.type.includes("pdf") ? (
                            <FileText className="w-5 h-5" />
                          ) : (
                            <FileCheck className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {uploadedFile.name}
                          </p>
                          <p className="text-[11px] text-blue-700 font-semibold">
                            {uploadedFile.size} • Ready for upload
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-white border border-blue-200 px-2.5 py-1.5 rounded-lg cursor-pointer"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sender / Payer Details */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    2. Payer & Transaction Identification
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Payer / Business Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                        placeholder="e.g. Gert van der Merwe / Diesel Tech"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Contact Number / WhatsApp / Email *
                      </label>
                      <input
                        type="text"
                        required
                        value={payerContact}
                        onChange={(e) => setPayerContact(e.target.value)}
                        placeholder="e.g. +27 82 555 0192 or email"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Bank Paid From *
                      </label>
                      <select
                        value={payerBank}
                        onChange={(e) => setPayerBank(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      >
                        {SA_BANKS_LIST.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Amount Transferred (ZAR) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">R</span>
                        <input
                          type="number"
                          required
                          value={amountToPay}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="e.g. 499"
                          className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Payment Reference Code Used *
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={referenceCode}
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-emerald-800 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Optional Delivery / Part Notes
                    </label>
                    <textarea
                      rows={2}
                      value={payerNotes}
                      onChange={(e) => setPayerNotes(e.target.value)}
                      placeholder="e.g. Paid full amount for Toyota injectors. Please dispatch via The Courier Guy."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-normal text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {popError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{popError}</span>
                  </div>
                )}

                {/* Primary Upload Button */}
                <button
                  type="submit"
                  disabled={isUploadingPop}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm py-3.5 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isUploadingPop ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading Proof of Payment & Notifying Seller...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5" />
                      <span>Upload Proof of Payment & Notify Seller</span>
                    </>
                  )}
                </button>
              </form>

              {/* Alternative submission channels */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Or Send Directly via Instant Channels:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a
                    href={popWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>WhatsApp POP to Finance Desk</span>
                  </a>

                  <a
                    href={popEmailUrl}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-slate-600" />
                    <span>Email POP to Accounts</span>
                  </a>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            {activeTab === "banking_details" ? (
              <span>Universal Branch Code: <strong className="text-slate-800 font-mono">250655</strong></span>
            ) : (
              <span>Stored securely in Partssource ZA verified transaction records</span>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {activeTab === "banking_details" ? (
              <>
                <button
                  type="button"
                  onClick={handlePrintSlip}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("upload_pop")}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload POP</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab("banking_details")}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Back to Banking Details
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Done / Close
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
