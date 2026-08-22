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
import { PartListing, Seller, SubscriptionBankingDetails, PartRequest, ProofOfPayment, SellerNotification } from '../types';

export const DEFAULT_BANKING_DETAILS: SubscriptionBankingDetails = {
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

export const INITIAL_SELLERS: Seller[] = [
  {
    id: "sel-001",
    name: "Gert van der Merwe",
    businessName: "Gauteng Diesel Tech",
    email: "gert@dieseltech.co.za",
    phone: "+27 82 555 0192",
    whatsapp: "+27825550192",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200",
    province: "Gauteng",
    city: "Pretoria",
    address: "144 Van Der Hoff Rd, Pretoria West",
    description: "Specializing in Toyota 2.8 GD-6, D-4D, Isuzu D-Max, and commercial bakkie turbochargers & common rail diesel injection systems.",
    isVerified: true,
    joinedDate: "2024-01-15",
    website: "https://dieseltech.co.za",
    bankDetails: {
      bankName: "FNB",
      accountHolder: "Gauteng Diesel Tech CC",
      accountNumber: "62819283741",
      branchCode: "250655"
    },
    subscription: {
      active: true,
      plan: "Pro",
      expiryDate: "2026-12-31",
      amountPaid: 499,
      paymentRef: "SUB-DIESELTECH"
    }
  },
  {
    id: "sel-002",
    name: "Sipho Khumalo",
    businessName: "Coastline Truck Spares",
    email: "info@coastlinetruckspares.co.za",
    phone: "+27 71 555 3847",
    whatsapp: "+27715553847",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    province: "KwaZulu-Natal",
    city: "Durban",
    address: "88 South Coast Road, Clairwood, Durban",
    description: "Heavy commercial truck dismantling yard. Premium refurbished parts for Scania R-Series, Volvo FH12/FH16, Mercedes Actros, and MAN TGA.",
    isVerified: true,
    joinedDate: "2023-11-20",
    website: "https://coastlinetruckspares.co.za",
    bankDetails: {
      bankName: "Standard Bank",
      accountHolder: "Coastline Truck Spares (Pty) Ltd",
      accountNumber: "042938471",
      branchCode: "051001"
    },
    subscription: {
      active: true,
      plan: "Enterprise",
      expiryDate: "2027-03-15",
      amountPaid: 999,
      paymentRef: "SUB-COASTLINE"
    }
  },
  {
    id: "sel-003",
    name: "Moegamat Allie",
    businessName: "Cape Motor Spares",
    email: "allie@capemotor.co.za",
    phone: "+27 21 555 4981",
    whatsapp: "+27215554981",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    province: "Western Cape",
    city: "Cape Town",
    address: "42 Voortrekker Road, Parow, Cape Town",
    description: "Supplying genuine OEM engines, cylinder heads, gearboxes, and body panels for VW Polo, Golf, Ford Ranger, and Nissan NP200.",
    isVerified: true,
    joinedDate: "2024-02-10",
    website: "https://capemotorspares.co.za",
    bankDetails: {
      bankName: "Nedbank",
      accountHolder: "Cape Motor Spares Trust",
      accountNumber: "1192837465",
      branchCode: "198765"
    },
    subscription: {
      active: true,
      plan: "Starter",
      expiryDate: "2026-09-30",
      amountPaid: 249,
      paymentRef: "SUB-CAPEMOTOR"
    }
  }
];

/**
 * Realtime Snapshot Listener for Sellers with Error Handling
 */
export function subscribeToSellers(callback: (sellers: Seller[]) => void) {
  const path = 'sellers';
  const q = collection(db, path);

  return onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        callback(INITIAL_SELLERS);
        for (const s of INITIAL_SELLERS) {
          try {
            await setDoc(doc(db, 'sellers', s.id), s, { merge: true });
          } catch (e) {
            console.warn('Initial seller seed error:', e);
          }
        }
      } else {
        const items: Seller[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            name: data.name || 'Seller',
            businessName: data.businessName || '',
            email: data.email || '',
            phone: data.phone || '',
            whatsapp: data.whatsapp || '',
            avatar: data.avatar || '',
            province: data.province || '',
            city: data.city || '',
            address: data.address || '',
            description: data.description || '',
            isVerified: data.isVerified !== undefined ? data.isVerified : true,
            joinedDate: data.joinedDate || '',
            website: data.website || '',
            bankDetails: data.bankDetails || undefined,
            subscription: data.subscription || {
              active: true,
              plan: 'Pro',
              expiryDate: '2026-12-31',
              amountPaid: 499
            }
          };
        });
        callback(items);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Add / Update Seller in Firestore
 */
export async function saveSellerToFirestore(seller: Seller) {
  const path = `sellers/${seller.id}`;
  try {
    const docRef = doc(db, 'sellers', seller.id);
    await setDoc(docRef, seller, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Delete Seller and ALL associated listings from Firestore (Cascade Delete)
 */
export async function deleteSellerFromFirestore(sellerId: string): Promise<{ deletedListingsCount: number }> {
  const path = `sellers/${sellerId}`;
  try {
    let deletedCount = 0;

    // 1. Query all listings associated with this sellerId
    try {
      const listingsRef = collection(db, 'listings');
      const q = query(listingsRef, where('sellerId', '==', sellerId));
      const snapshot = await getDocs(q);

      // 2. Delete each listing document
      const deletePromises = snapshot.docs.map(async (docSnap) => {
        try {
          await deleteDoc(doc(db, 'listings', docSnap.id));
          deletedCount++;
        } catch (listingErr) {
          console.warn(`Failed to delete listing ${docSnap.id} for seller ${sellerId}:`, listingErr);
        }
      });
      await Promise.all(deletePromises);
    } catch (queryErr) {
      console.warn('Error querying listings for seller cascade delete:', queryErr);
    }

    // 3. Delete the seller document from 'sellers' collection
    await deleteDoc(doc(db, 'sellers', sellerId));

    return { deletedListingsCount: deletedCount };
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

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

/**
 * Bulk delete multiple listings from Firestore by IDs
 */
export async function deleteMultipleListingsFromFirestore(listingIds: string[]): Promise<number> {
  let deletedCount = 0;
  for (const id of listingIds) {
    try {
      await deleteDoc(doc(db, 'listings', id));
      deletedCount++;
    } catch (err) {
      console.warn(`Failed to delete listing ${id}:`, err);
    }
  }
  return deletedCount;
}

/**
 * Master Purge: Delete ALL listings from Firestore inventory
 */
export async function deleteAllListingsFromFirestore(): Promise<number> {
  const path = 'listings';
  try {
    const listingsRef = collection(db, path);
    const snapshot = await getDocs(listingsRef);
    let deletedCount = 0;
    
    for (const docSnap of snapshot.docs) {
      try {
        await deleteDoc(doc(db, path, docSnap.id));
        deletedCount++;
      } catch (err) {
        console.warn(`Failed to delete doc ${docSnap.id}:`, err);
      }
    }
    return deletedCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

/**
 * Reset & Seed initial demo inventory parts into Firestore
 */
export async function resetInventoryToDefaultSeed(): Promise<number> {
  const path = 'listings';
  try {
    // 1. Purge existing
    const listingsRef = collection(db, path);
    const snapshot = await getDocs(listingsRef);
    for (const docSnap of snapshot.docs) {
      await deleteDoc(doc(db, path, docSnap.id)).catch(() => {});
    }

    // 2. Insert initial sample listings
    let insertedCount = 0;
    for (const item of INITIAL_LISTINGS) {
      await addDoc(collection(db, path), {
        ...item,
        createdAt: new Date().toISOString()
      });
      insertedCount++;
    }
    return insertedCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

// Initial Sample Part Sourcing Requests (South Africa Context)
export const INITIAL_PART_REQUESTS: PartRequest[] = [
  {
    id: "req-101",
    partName: "Toyota Hilux 2.8 GD-6 Automatic 4x4 Gearbox (Complete)",
    category: "Gearboxes & Transmissions",
    vehicleType: "Car",
    vehicleMake: "Toyota",
    vehicleModel: "Hilux",
    vehicleYear: "2019",
    engineCodeOrVin: "1GD-FTV (6-Speed Auto)",
    partNumber: "35000-0K400",
    description: "Urgent replacement needed for farm bakkie. Looking for complete low mileage auto transmission with torque converter in working condition with startup guarantee.",
    urgency: "urgent",
    targetBudgetZar: 28000,
    province: "Gauteng",
    town: "Pretoria",
    buyerName: "Kobus Venter",
    buyerPhone: "+27 82 492 1083",
    buyerEmail: "kobus@venterboerdery.co.za",
    preferredContact: "whatsapp",
    status: "open",
    quotesCount: 3,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "req-102",
    partName: "Scania R480 / R500 Complete Rear Differential Assembly",
    category: "Engines & Drivetrain",
    vehicleType: "Truck",
    vehicleMake: "Scania",
    vehicleModel: "R480 Topline",
    vehicleYear: "2015",
    engineCodeOrVin: "R780 Ratio 2.92",
    partNumber: "1778942",
    description: "Fleet hauler broken down on N3 near Pietermaritzburg. Looking for clean OEM Scania differential carrier and crown wheel & pinion in good condition.",
    urgency: "urgent",
    targetBudgetZar: 45000,
    province: "KwaZulu-Natal",
    town: "Pietermaritzburg",
    buyerName: "Devan Naidoo (Logistics Hub)",
    buyerPhone: "+27 74 882 9104",
    buyerEmail: "devan@coastallogistics.co.za",
    preferredContact: "call",
    status: "quotes_received",
    quotesCount: 4,
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "req-103",
    partName: "Isuzu D-Max 3.0 D-Teq Turbocharger (IHI / OEM)",
    category: "Engines & Drivetrain",
    vehicleType: "Car",
    vehicleMake: "Isuzu",
    vehicleModel: "D-Max / KB300",
    vehicleYear: "2020",
    engineCodeOrVin: "4JJ1-TCX (3.0L Turbo Diesel)",
    partNumber: "8981506872",
    description: "Looking for new or tested second-hand turbocharger. Must have no shaft play and intact wastegate actuator.",
    urgency: "standard",
    targetBudgetZar: 8500,
    province: "Western Cape",
    town: "Paarl",
    buyerName: "Johan Du Plessis",
    buyerPhone: "+27 83 912 3341",
    buyerEmail: "johan@duplessisauto.co.za",
    preferredContact: "whatsapp",
    status: "open",
    quotesCount: 1,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "req-104",
    partName: "Mercedes-Benz Actros MP4 Front Bumper & Corner Panels",
    category: "Body Panels & Bumpers",
    vehicleType: "Truck",
    vehicleMake: "Mercedes-Benz",
    vehicleModel: "Actros 2645",
    vehicleYear: "2018",
    description: "Front left side collision damage. In search of OEM front bumper centre section, left corner spoiler, and step bracket. Prefer white finish if available.",
    urgency: "flexible",
    targetBudgetZar: 14000,
    province: "Mpumalanga",
    town: "Witbank",
    buyerName: "Tshepo Moloi",
    buyerPhone: "+27 71 339 4910",
    buyerEmail: "tshepo@moloifleet.co.za",
    preferredContact: "whatsapp",
    status: "open",
    quotesCount: 2,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  }
];

/**
 * Realtime Snapshot Listener for Part Sourcing Requests
 */
export function subscribeToPartRequests(callback: (requests: PartRequest[]) => void) {
  const path = 'part_requests';
  const q = collection(db, path);

  return onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        // Seed default part requests if collection is brand new
        callback(INITIAL_PART_REQUESTS);
        for (const req of INITIAL_PART_REQUESTS) {
          try {
            await setDoc(doc(db, path, req.id), req, { merge: true });
          } catch (e) {
            console.warn('Initial part request seed notice:', e);
          }
        }
      } else {
        const items: PartRequest[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<PartRequest, 'id'>)
        }));
        // Sort newest first
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        callback(items);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Add a new Part Sourcing Request to Firestore
 */
export async function addPartRequestToFirestore(requestData: Omit<PartRequest, 'id'>): Promise<string> {
  const path = 'part_requests';
  try {
    const docRef = await addDoc(collection(db, path), {
      ...requestData,
      status: requestData.status || 'open',
      quotesCount: 0,
      createdAt: requestData.createdAt || new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

/**
 * Update status of a Part Request (e.g. 'open', 'quotes_received', 'fulfilled', 'closed')
 */
export async function updatePartRequestStatusInFirestore(
  requestId: string, 
  status: 'open' | 'quotes_received' | 'fulfilled' | 'closed'
) {
  const path = `part_requests/${requestId}`;
  try {
    const docRef = doc(db, 'part_requests', requestId);
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Delete a Part Request from Firestore
 */
export async function deletePartRequestFromFirestore(requestId: string) {
  const path = `part_requests/${requestId}`;
  try {
    await deleteDoc(doc(db, 'part_requests', requestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

/**
 * Submit Proof of Payment to Firestore and automatically notify the seller
 */
export async function submitProofOfPaymentToFirestore(
  popData: Omit<ProofOfPayment, 'id'>
): Promise<{ popId: string; notificationId?: string }> {
  const popPath = 'payment_proofs';
  try {
    const popDocRef = await addDoc(collection(db, popPath), {
      ...popData,
      status: popData.status || 'pending_verification',
      createdAt: popData.createdAt || new Date().toISOString()
    });

    const popId = popDocRef.id;
    let notificationId: string | undefined = undefined;

    // Send direct system notification to the seller (or 'admin' if subscription)
    const targetRecipientId = popData.targetSellerId || (popData.purpose === 'subscription' ? 'admin' : 'all');
    const notificationPath = 'notifications';

    try {
      const notifTitle = popData.purpose === 'subscription'
        ? `New Subscription POP Received (R${popData.amount.toLocaleString("en-ZA")})`
        : popData.purpose === 'part_purchase'
          ? `New Payment Slip for ${popData.listingTitle || 'Spare Part'} (R${popData.amount.toLocaleString("en-ZA")})`
          : `New EFT Payment Slip (Ref: ${popData.reference})`;

      const notifMessage = `${popData.payerName} (${popData.payerContact}) uploaded Proof of Payment [${popData.fileName}] for Ref: ${popData.reference} amounting to R${popData.amount.toLocaleString("en-ZA")}.`;

      const notifDocRef = await addDoc(collection(db, notificationPath), {
        sellerId: targetRecipientId,
        title: notifTitle,
        message: notifMessage,
        type: 'payment_proof',
        relatedId: popId,
        amount: popData.amount,
        reference: popData.reference,
        fileDataUrl: popData.fileDataUrl || '',
        fileName: popData.fileName,
        read: false,
        payerName: popData.payerName,
        payerContact: popData.payerContact,
        createdAt: new Date().toISOString()
      });
      notificationId = notifDocRef.id;
    } catch (notifErr) {
      console.warn("Notice: Notification record dispatch warning:", notifErr);
    }

    return { popId, notificationId };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, popPath);
    throw error;
  }
}

/**
 * Realtime listener for Seller Notifications
 */
export function subscribeToSellerNotifications(
  sellerId: string, 
  callback: (notifications: SellerNotification[]) => void
) {
  const path = 'notifications';
  const q = collection(db, path);

  return onSnapshot(
    q,
    (snapshot) => {
      const items: SellerNotification[] = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data() as Omit<SellerNotification, 'id'>;
        // Include notifications designated for this seller, 'all', or 'admin' if seller is admin/matching
        if (
          data.sellerId === sellerId || 
          data.sellerId === 'all' || 
          (sellerId === 'admin' && data.sellerId === 'admin')
        ) {
          items.push({
            id: docSnap.id,
            ...data
          });
        }
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

/**
 * Mark a Notification as Read
 */
export async function markNotificationAsReadInFirestore(notificationId: string) {
  const path = `notifications/${notificationId}`;
  try {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Realtime listener for Proof of Payment Submissions
 */
export function subscribeToPaymentProofs(callback: (proofs: ProofOfPayment[]) => void) {
  const path = 'payment_proofs';
  const q = collection(db, path);

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ProofOfPayment[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<ProofOfPayment, 'id'>)
      }));
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

