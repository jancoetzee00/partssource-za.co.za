/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PartListing {
  id: string;
  title: string;
  description: string;
  category: string; // Engine, Transmission, Body Parts, Electrical, Suspension & Steering, Brakes, Wheels & Tyres, Interior, Accessories, Other
  vehicleType: 'Car' | 'Truck' | 'Both' | 'Other';
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Refurbished' | 'For Parts';
  price: number; // in South African Rand (ZAR)
  location: string; // City & Province in ZA
  partNumber?: string;
  brand?: string;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerBusinessName?: string;
  sellerPhone: string;
  sellerEmail: string;
  isPremium: boolean;
  createdAt: string;
  compatibility: string; // string explaining compatibility
}

export interface Seller {
  id: string;
  name: string;
  businessName?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  avatar?: string;
  province?: string;
  city?: string;
  address?: string;
  description?: string;
  isVerified?: boolean;
  joinedDate?: string;
  website?: string;
  bankDetails?: {
    bankName?: string;
    accountHolder?: string;
    accountNumber?: string;
    branchCode?: string;
  };
  subscription: {
    active: boolean;
    plan: 'Starter' | 'Pro' | 'Enterprise' | 'None';
    expiryDate?: string;
    amountPaid?: number;
    paymentRef?: string;
  };
}

export interface SellerReview {
  id: string;
  sellerId: string;
  sellerName?: string;
  rating: number; // 1 to 5
  comment: string;
  reviewerName: string;
  reviewerContact?: string;
  partPurchased?: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

export interface SellerRatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  reviews: SellerReview[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  suggestedParts?: string[]; // matching part IDs
}

export interface WebGroundingSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface WebSearchEngineResponse {
  query: string;
  province?: string;
  town?: string;
  summary: string;
  keyInsights?: string[];
  suggestedOemNumbers?: string[];
  estimatedPriceRangeZar?: string;
  sources: WebGroundingSource[];
  matchingMarketplaceParts?: PartListing[];
  relatedSearches?: string[];
  simulated?: boolean;
}

export interface SubscriptionBankingDetails {
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  branchCode: string;
  accountType: string;
  referenceFormat: string;
  monthlyFeeZar: number;
  starterPriceZar?: number;
  proPriceZar?: number;
  enterprisePriceZar?: number;
  ownerPasscode: string;
  lastUpdated?: string;
}

export interface PartRequest {
  id: string;
  partName: string;
  category: string;
  vehicleType: 'Car' | 'Truck' | 'Both' | 'Other';
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear?: string;
  engineCodeOrVin?: string;
  partNumber?: string;
  description: string;
  urgency: 'urgent' | 'standard' | 'flexible';
  targetBudgetZar?: number;
  province: string;
  town: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  preferredContact: 'whatsapp' | 'call' | 'email';
  status: 'open' | 'quotes_received' | 'fulfilled' | 'closed';
  quotesCount?: number;
  createdAt: string;
  userId?: string;
}

export interface ProofOfPayment {
  id: string;
  reference: string;
  amount: number;
  purpose: 'subscription' | 'part_purchase' | 'general';
  payerName: string;
  payerContact: string;
  payerNotes?: string;
  bankPaidFrom?: string;
  fileName: string;
  fileSize?: string;
  fileDataUrl?: string;
  fileType?: string;
  targetSellerId?: string;
  targetSellerName?: string;
  listingId?: string;
  listingTitle?: string;
  status: 'pending_verification' | 'verified' | 'rejected';
  createdAt: string;
}

export interface SellerNotification {
  id: string;
  sellerId: string;
  title: string;
  message: string;
  type: 'payment_proof' | 'part_request' | 'inquiry' | 'subscription';
  relatedId?: string;
  amount?: number;
  reference?: string;
  fileDataUrl?: string;
  fileName?: string;
  read: boolean;
  createdAt: string;
  payerName?: string;
  payerContact?: string;
}

