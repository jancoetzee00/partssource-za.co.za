/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SubscriptionBankingDetails } from "../types";
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
  AlertCircle
} from "lucide-react";

interface EftPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankingDetails: SubscriptionBankingDetails;
  initialPurpose?: "subscription" | "part_purchase" | "general";
  initialReference?: string;
  initialAmountZar?: number;
  sellerBusinessName?: string;
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

export const EftPaymentModal: React.FC<EftPaymentModalProps> = ({
  isOpen,
  onClose,
  bankingDetails,
  initialPurpose = "subscription",
  initialReference,
  initialAmountZar,
  sellerBusinessName
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<"subscription" | "part_purchase" | "general">(initialPurpose);
  const [customIdentifier, setCustomIdentifier] = useState<string>(sellerBusinessName || "");
  const [customAmount, setCustomAmount] = useState<string>(initialAmountZar ? String(initialAmountZar) : "");

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

  // WhatsApp Proof of Payment URL
  const popWhatsAppMsg = encodeURIComponent(
    `Hi Partssource ZA Billing Team, I have made an EFT payment.%0A%0A*Reference:* ${referenceCode}%0A*Amount:* R${amountToPay || "---"}%0A*Bank Paid From:* (Please specify)%0A*Date:* ${new Date().toLocaleDateString("en-ZA")}%0A%0APlease find attached my Proof of Payment slip.`
  );
  const popWhatsAppUrl = `https://wa.me/27825550192?text=${popWhatsAppMsg}`;

  // Email Proof of Payment URL
  const popEmailSubject = encodeURIComponent(`EFT Proof of Payment: ${referenceCode}`);
  const popEmailBody = encodeURIComponent(
    `Dear Partssource ZA Accounts,\n\nPlease find attached the Proof of Payment for my EFT transaction.\n\nPayment Reference: ${referenceCode}\nAmount Paid: R${amountToPay || "0.00"}\nDate: ${new Date().toLocaleDateString("en-ZA")}\n\nKind regards,\n${customIdentifier || "Customer"}`
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
          • Send Proof of Payment (POP) to <strong>accounts@partssource.co.za</strong> or via WhatsApp to <strong>+27 82 555 0192</strong> for instant activation.<br/>
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
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-scale-in my-auto flex flex-col max-h-[92vh]">
        
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
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              EFT Payment Gateway & Details
            </h2>
            <p className="text-slate-300 text-xs leading-relaxed">
              Transfer securely using internet banking or your bank app. 0% processing fees.
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-900">
          
          {/* Reference Customizer & Purpose Picker */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Select Payment Purpose
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Auto-generates your unique reference
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
                  onChange={(e) => setCustomIdentifier(e.target.value)}
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
          </div>

          {/* Official Bank Account Information Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                2. Official Partssource ZA Banking Details
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
              3. Open Your Bank Online (Quick Access)
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

          {/* Proof of Payment Submission Links */}
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700 shrink-0" />
              <h4 className="text-xs font-bold text-amber-900">
                4. Send Proof of Payment (POP) for Instant Activation
              </h4>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Once your EFT transfer has been initiated, send your proof of payment slip or SMS confirmation to our finance desk. Your account or parts request will be activated immediately.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
              <a
                href={popWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Proof of Payment</span>
              </a>

              <a
                href={popEmailUrl}
                className="w-full sm:flex-1 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs cursor-pointer"
              >
                <Mail className="w-4 h-4" />
                <span>Email Proof of Payment</span>
              </a>
            </div>
          </div>

          {/* Security & Verification Notice */}
          <div className="flex items-start gap-2.5 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Zero Card Skimming Risk:</strong> Direct bank EFT transfers are processed through the South African Reserve Bank clearing network. We never store bank passwords or PINs.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 font-medium hidden sm:block">
            Universal Branch Code: <strong className="text-slate-800 font-mono">250655</strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrintSlip}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Slip</span>
            </button>
            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Done / Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
