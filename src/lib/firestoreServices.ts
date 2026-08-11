/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  getDocs, 
  addDoc, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from 'firebase/auth';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from './firebase';
import { PartListing, Seller, SubscriptionBankingDetails } from '../types';

export const DEFAULT_BANKING_DETAILS: SubscriptionBankingDetails = {
  bankName: "First National Bank (FNB)",
  accountHolder: "Partssource ZA (Pty) Ltd",
  accountNumber: "62890001234",
  branchCode: "250655",
  accountType: "Cheque Account",
  referenceFormat: "SUB-[BUSINESS_NAME]",
  monthlyFeeZar: 499,
  ownerPasscode: "admin123"
};

/**
 * Realtime listener for Subscription Banking Details from Firestore /settings/banking
 */
export function subscribeToBankingDetails(callback: (details: SubscriptionBankingDetails) => void) {
  const path = 'settings/banking';
  const docRef = doc(db, 'settings', 'banking');

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as SubscriptionBankingDetails;
        callback({
          ...DEFAULT_BANKING_DETAILS,
          ...data
        });
      } else {
        // Return default & initialize
        callback(DEFAULT_BANKING_DETAILS);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Update Subscription Banking Details in Firestore
 */
export async function saveBankingDetailsToFirestore(details: SubscriptionBankingDetails) {
  const path = 'settings/banking';
  try {
    const docRef = doc(db, 'settings', 'banking');
    await setDoc(docRef, {
      ...details,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Default initial listings to seed Firestore if empty
export const INITIAL_LISTINGS: Omit<PartListing, 'id'>[] = [
  {
    title: "Toyota Hilux 2.8 GD-6 OEM Fuel Injectors (Set of 4)",
    description: "Original Denso injectors for Toyota Hilux 2.8 GD-6 (1GD-FTV engine). Fully tested with certification. Excellent spray pattern, ideal for restoring fuel efficiency and power. Pulled from a low mileage 2021 model.",
    category: "Engine Parts",
    vehicleType: "Car",
    condition: "Like New",
    price: 12500,
    location: "Kempton Park, Gauteng",
    partNumber: "23670-0E010",
    brand: "Denso / Toyota OEM",
    images: [
      "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600",
    ],
    sellerId: "sel-001",
    sellerName: "Gert van der Merwe",
    sellerBusinessName: "Gauteng Diesel Tech",
    sellerPhone: "+27 82 555 0192",
    sellerEmail: "gert@dieseltech.co.za",
    isPremium: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    compatibility: "Toyota Hilux 2.8 GD-6 (2016 - 2023), Toyota Fortuner 2.8 GD-6"
  },
  {
    title: "Scania R480 Heavy Duty Front Brake Pads Set",
    description: "Premium heavy-duty brake pads suitable for Scania R-series trucks. High thermal resistance, low dust, and exceptional braking torque under maximum loads. Includes wear sensors and installation hardware.",
    category: "Brakes",
    vehicleType: "Truck",
    condition: "New",
    price: 4850,
    location: "Pinetown, KwaZulu-Natal",
    partNumber: "1856110",
    brand: "Beral / Scania Genuine",
    images: [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600",
    ],
    sellerId: "sel-002",
    sellerName: "Sipho Khumalo",
    sellerBusinessName: "Coastline Truck Spares",
    sellerPhone: "+27 71 555 3847",
    sellerEmail: "info@coastlinetruckspares.co.za",
    isPremium: true,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    compatibility: "Scania R480, R500, G460 Series Trucks (2010 - 2018)"
  },
  {
    title: "VW Polo Vivo 1.4 CLP Engine Cylinder Head",
    description: "Complete refurbished cylinder head for Volkswagen Polo Vivo 1.4 (Engine Code: CLP). Pressure tested, skimmed, and fitted with new valve stem seals. Ready to bolt on and drive. 6-month warranty included.",
    category: "Engine Parts",
    vehicleType: "Car",
    condition: "Refurbished",
    price: 6200,
    location: "Athlone, Western Cape",
    partNumber: "03C103351A",
    brand: "VW OEM Genuine",
    images: [
      "https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&q=80&w=600",
    ],
    sellerId: "sel-003",
    sellerName: "Moegamat Allie",
    sellerBusinessName: "Cape Cape Motor Spares",
    sellerPhone: "+27 21 555 4981",
    sellerEmail: "allie@capemotor.co.za",
    isPremium: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    compatibility: "VW Polo Vivo 1.4 CLP (2010 - 2018), VW Polo 6R 1.4"
  },
  {
    title: "Volvo FH12 Air Suspension Airbag (Rear)",
    description: "Heavy duty rear axle air bellows / suspension airbag for Volvo FH12 / FH16 haulers. Premium rubber with reinforced steel rings. Designed to withstand the toughest South African transport routes.",
    category: "Suspension & Steering",
    vehicleType: "Truck",
    condition: "New",
    price: 2950,
    location: "Middelburg, Mpumalanga",
    partNumber: "20580537",
    brand: "Firestone Heavy",
    images: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600",
    ],
    sellerId: "sel-002",
    sellerName: "Sipho Khumalo",
    sellerBusinessName: "Coastline Truck Spares",
    sellerPhone: "+27 71 555 3847",
    sellerEmail: "info@coastlinetruckspares.co.za",
    isPremium: false,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    compatibility: "Volvo FH12, FH13, FM12 (Rear Axle, Left or Right)"
  }
];

/**
 * Authentication Helpers
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Save/update user profile in Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Seller',
      photoURL: user.photoURL || '',
      createdAt: new Date().toISOString()
    }, { merge: true });

    return user;
  } catch (error) {
    console.error('Google Sign-In failed:', error);
    throw error;
  }
}

export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-out failed:', error);
    throw error;
  }
}

/**
 * Realtime Snapshot Listener for Listings with Error Handling
 */
export function subscribeToListings(callback: (listings: PartListing[]) => void) {
  const path = 'listings';
  const q = collection(db, path);

  return onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        // Seed default items if collection is completely empty
        callback([]);
      } else {
        const items: PartListing[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<PartListing, 'id'>)
        }));
        callback(items);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Add a new listing to Firestore
 */
export async function addListingToFirestore(listing: Omit<PartListing, 'id'>) {
  const path = 'listings';
  try {
    const docRef = await addDoc(collection(db, path), listing);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

/**
 * Delete a listing from Firestore
 */
export async function deleteListingFromFirestore(listingId: string) {
  const path = `listings/${listingId}`;
  try {
    await deleteDoc(doc(db, 'listings', listingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}
