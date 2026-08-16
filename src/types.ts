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
  subscription: {
    active: boolean;
    plan: 'Starter' | 'Pro' | 'Enterprise' | 'None';
    expiryDate?: string;
    amountPaid?: number;
  };
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
