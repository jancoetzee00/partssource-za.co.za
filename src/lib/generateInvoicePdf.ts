/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import jsPDF from "jspdf";
import { Seller, SubscriptionBankingDetails } from "../types";

export interface InvoiceOptions {
  seller: Seller;
  bankingDetails: SubscriptionBankingDetails;
  month?: string; // e.g. "August 2026" or YYYY-MM
  invoiceNumber?: string;
  issueDate?: string;
  amount?: number;
  planName?: string;
}

export function generateSubscriptionInvoicePdf({
  seller,
  bankingDetails,
  month,
  invoiceNumber,
  issueDate,
  amount,
  planName
}: InvoiceOptions): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const now = new Date();
  const currentMonthStr = month || now.toLocaleString("default", { month: "long", year: "numeric" });
  const formattedIssueDate = issueDate || now.toISOString().split("T")[0];
  
  const activePlan = planName || seller.subscription?.plan || "Pro";
  
  // Calculate price if not explicitly passed
  let planPrice = amount;
  if (planPrice === undefined || planPrice === null) {
    if (seller.subscription?.amountPaid && seller.subscription.amountPaid > 0) {
      planPrice = seller.subscription.amountPaid;
    } else if (activePlan === "Starter") {
      planPrice = bankingDetails.starterPriceZar ?? 249;
    } else if (activePlan === "Pro") {
      planPrice = bankingDetails.proPriceZar ?? 499;
    } else if (activePlan === "Enterprise") {
      planPrice = bankingDetails.enterprisePriceZar ?? 999;
    } else {
      planPrice = bankingDetails.monthlyFeeZar ?? 499;
    }
  }

  const generatedInvoiceNo = invoiceNumber || `INV-ZA-${seller.id.slice(-6).toUpperCase()}-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  
  // Calculate VAT 15% in RSA
  const vatRate = 0.15;
  const subtotal = planPrice / (1 + vatRate);
  const vatAmount = planPrice - subtotal;

  // --- Page Colors & Margins ---
  const primaryColor = [15, 23, 42]; // slate-900
  const accentColor = [217, 119, 6]; // amber-600
  const lightBg = [248, 250, 252]; // slate-50
  const textDark = [30, 41, 59]; // slate-800
  const textMuted = [100, 116, 139]; // slate-500

  // 1. Top Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 42, "F");

  // Gold accent bar
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(0, 42, 210, 2, "F");

  // Header Brand Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("PARTSSOURCE ZA", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text("South Africa's Premier Automotive & Commercial Spares Marketplace", 14, 25);
  doc.text("Web: partssource.co.za  |  Email: billing@partssource.co.za", 14, 31);

  // Right Header: TAX INVOICE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text("TAX INVOICE", 196, 18, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  doc.text(`Invoice #: ${generatedInvoiceNo}`, 196, 25, { align: "right" });
  doc.text(`Date: ${formattedIssueDate}`, 196, 31, { align: "right" });
  doc.text(`Period: ${currentMonthStr}`, 196, 37, { align: "right" });

  // 2. Billing Parties (Two Column Box)
  // Left: Billed To
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, 52, 88, 48, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 52, 88, 48, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text("BILLED TO (SUBSCRIBER / SELLER)", 18, 59);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  const businessOrName = seller.businessName || seller.name;
  doc.text(businessOrName.length > 30 ? businessOrName.substring(0, 28) + "..." : businessOrName, 18, 66);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Contact: ${seller.name}`, 18, 72);
  doc.text(`Email: ${seller.email}`, 18, 78);
  doc.text(`Phone: ${seller.phone || "N/A"}`, 18, 84);
  doc.text(`Seller ID: ${seller.id}`, 18, 90);

  // Right: Supplier Details
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(108, 52, 88, 48, 3, 3, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(108, 52, 88, 48, 3, 3, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text("ISSUED BY (SERVICE PROVIDER)", 112, 59);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("Partssource ZA (Pty) Ltd", 112, 66);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Reg No: 2024/983104/07", 112, 72);
  doc.text("VAT Reg: 4890281742", 112, 78);
  doc.text("Pretoria & Johannesburg, Gauteng, RSA", 112, 84);
  doc.text("Platform: Automotive Spares Portal", 112, 90);

  // 3. Plan & Status Pill
  const statusY = 108;
  doc.setFillColor(240, 253, 244); // green-50
  doc.roundedRect(14, statusY, 182, 12, 2, 2, "F");
  doc.setDrawColor(187, 247, 208); // green-200
  doc.roundedRect(14, statusY, 182, 12, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52); // green-800
  doc.text(`[✓] SUBSCRIPTION STATUS: ACTIVE (${activePlan.toUpperCase()} TIER)`, 20, statusY + 7.5);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(21, 128, 61);
  const refCode = seller.businessName
    ? bankingDetails.referenceFormat.replace("[BUSINESS_NAME]", seller.businessName.toUpperCase().replace(/\s+/g, "-"))
    : `SUB-${seller.id.slice(-6).toUpperCase()}`;
  doc.text(`Payment Ref: ${refCode}`, 190, statusY + 7.5, { align: "right" });

  // 4. Line Items Table
  const tableY = 128;

  // Table Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(14, tableY, 182, 9, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text("ITEM & SERVICE DESCRIPTION", 18, tableY + 6);
  doc.text("BILLING CYCLE", 120, tableY + 6);
  doc.text("QTY", 150, tableY + 6);
  doc.text("AMOUNT (ZAR)", 192, tableY + 6, { align: "right" });

  // Table Row 1
  const rowY = tableY + 9;
  doc.setFillColor(255, 255, 255);
  doc.rect(14, rowY, 182, 28, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, rowY, 182, 28, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Partssource ZA ${activePlan} Plan Advertising Subscription`, 18, rowY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  let planPerks = "• Access to verified buyer inquiries, custom seller dashboard & part listings.";
  if (activePlan === "Starter") {
    planPerks = "• Standard spares listings (up to 10 ads/mo), seller profile & direct WhatsApp buyer contact.";
  } else if (activePlan === "Pro") {
    planPerks = "• Unlimited spares listings, AI listing enhancements, priority search rankings & badge.";
  } else if (activePlan === "Enterprise") {
    planPerks = "• Unlimited cars & heavy duty truck spares, auto catalog feeds, VIP banner placements.";
  }
  doc.text(planPerks, 18, rowY + 14);
  doc.text(`• Subscription cycle for ${currentMonthStr}`, 18, rowY + 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text("Monthly", 120, rowY + 7);
  doc.text("1", 152, rowY + 7);

  doc.setFont("helvetica", "bold");
  doc.text(`R ${planPrice.toFixed(2)}`, 192, rowY + 7, { align: "right" });

  // 5. Totals & VAT Breakdown Box
  const totalsY = rowY + 34;

  // Left side: Banking details for record
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, totalsY, 100, 44, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, totalsY, 100, 44, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.text("PLATFORM BANKING DETAILS (EFT RECORD)", 18, totalsY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`Bank: ${bankingDetails.bankName}`, 18, totalsY + 13);
  doc.text(`Account Name: ${bankingDetails.accountHolder}`, 18, totalsY + 19);
  doc.text(`Account Number: ${bankingDetails.accountNumber}`, 18, totalsY + 25);
  doc.text(`Branch Code: ${bankingDetails.branchCode} (${bankingDetails.accountType})`, 18, totalsY + 31);
  doc.text(`Ref Format: ${bankingDetails.referenceFormat}`, 18, totalsY + 37);

  // Right side: Subtotal, VAT, Total
  const sumX = 120;
  const valX = 192;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text("Subtotal (Excl. VAT):", sumX, totalsY + 7);
  doc.text(`R ${subtotal.toFixed(2)}`, valX, totalsY + 7, { align: "right" });

  doc.text("VAT (15% RSA):", sumX, totalsY + 15);
  doc.text(`R ${vatAmount.toFixed(2)}`, valX, totalsY + 15, { align: "right" });

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(sumX, totalsY + 20, 196, totalsY + 20);

  // Grand Total Box
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.roundedRect(sumX - 2, totalsY + 23, 78, 16, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL AMOUNT PAID:", sumX + 3, totalsY + 33);
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text(`R ${planPrice.toFixed(2)}`, valX - 1, totalsY + 33, { align: "right" });

  // 6. Verification & Paid Stamp
  const stampY = totalsY + 54;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, stampY, 182, 20, 2, 2, "F");
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, stampY, 182, 20, 2, 2, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("PAYMENT CONFIRMATION & TAX CLEARANCE", 18, stampY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("This official tax invoice confirms active marketplace advertising entitlements for the designated monthly billing period.", 18, stampY + 13);
  doc.text("Zero commission is taken on parts sold. All transactions occur directly between buyers and verified sellers.", 18, stampY + 17);

  // 7. Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Partssource ZA Marketplace • Computer-Generated Official Tax Invoice • South Africa", 105, 286, { align: "center" });
  doc.text("Questions regarding this invoice? Contact support@partssource.co.za or call our verified support line.", 105, 290, { align: "center" });

  return doc;
}

export function downloadSubscriptionInvoicePdf(options: InvoiceOptions): void {
  const doc = generateSubscriptionInvoicePdf(options);
  const now = new Date();
  const sellerSlug = (options.seller.businessName || options.seller.name || "seller")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");
  const monthCode = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const filename = `PartssourceZA-Invoice-${sellerSlug}-${monthCode}.pdf`;
  doc.save(filename);
}
