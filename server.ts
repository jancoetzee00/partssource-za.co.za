import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { PartListing, Seller } from "./src/types";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory Database for Part Listings
let listings: PartListing[] = [
  {
    id: "lst-001",
    title: "Toyota Hilux 2.8 GD-6 OEM Fuel Injectors (Set of 4)",
    description: "Original Denso injectors for Toyota Hilux 2.8 GD-6 (1GD-FTV engine). Fully tested with certification. Excellent spray pattern, ideal for restoring fuel efficiency and power. Pulled from a low mileage 2021 model.",
    category: "Engine Parts",
    vehicleType: "Car", // Hilux is bakkie, categorized as Car/Light Commercial
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
    id: "lst-002",
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
    id: "lst-003",
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
    id: "lst-004",
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
  },
  {
    id: "lst-005",
    title: "Ford Ranger 3.2 TDCi Garrett Turbocharger",
    description: "Original Garrett electronic actuator turbocharger for Ford Ranger or Mazda BT-50 3.2L 5-cylinder diesel. Checked on flow-bench, no shaft play, perfect boost pressure. Actuator tested and calibrated.",
    category: "Engine Parts",
    vehicleType: "Car",
    condition: "Good",
    price: 8900,
    location: "Pretoria West, Gauteng",
    partNumber: "GTB2256VK",
    brand: "Garrett / Ford OEM",
    images: [
      "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&q=80&w=600",
    ],
    sellerId: "sel-004",
    sellerName: "Johan Coetzee",
    sellerBusinessName: "Pretoria Scrap Yard",
    sellerPhone: "+27 12 555 9011",
    sellerEmail: "johan@pretoriascrapyard.co.za",
    isPremium: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    compatibility: "Ford Ranger 3.2 TDCi (2012 - 2021), Mazda BT-50 3.2 (2012 - 2020)"
  },
  {
    id: "lst-006",
    title: "Mercedes-Benz Actros MP4 Right-Side Headlight Assembly",
    description: "Complete RH headlight unit for Mercedes Actros MP4. Includes halogen bulbs and integrated LED daytime running indicator. Clean lens, all bracket mountings are 100% intact. Plug & play replacement.",
    category: "Electrical",
    vehicleType: "Truck",
    condition: "Like New",
    price: 7500,
    location: "Germiston, Gauteng",
    partNumber: "A9608200261",
    brand: "Hella / Mercedes OEM",
    images: [
      "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=600",
    ],
    sellerId: "sel-005",
    sellerName: "Andile Mthembu",
    sellerBusinessName: "Heavy Rig Truck Parts",
    sellerPhone: "+27 83 555 7824",
    sellerEmail: "andile@heavyrig.co.za",
    isPremium: false,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    compatibility: "Mercedes-Benz Actros MP4 Series Trucks (2012 onwards)"
  },
  {
    id: "lst-007",
    title: "BMW 3 Series F30 Front M-Sport Bumper (Alpine White)",
    description: "Original M-Sport package front bumper in Alpine White paint code (300). Minor lower scrapes but no cracks or deep gouges. Includes lower kidney grilles and fog-light surrounds. Park Distance Control (PDC) holes pre-drilled.",
    category: "Body Parts",
    vehicleType: "Car",
    condition: "Good",
    price: 4500,
    location: "Randburg, Gauteng",
    partNumber: "51118055819",
    brand: "BMW Genuine",
    images: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=600",
    ],
    sellerId: "sel-004",
    sellerName: "Johan Coetzee",
    sellerBusinessName: "Pretoria Scrap Yard",
    sellerPhone: "+27 12 555 9011",
    sellerEmail: "johan@pretoriascrapyard.co.za",
    isPremium: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    compatibility: "BMW 3 Series F30 Sedan / F31 Touring (2012 - 2019) with M-Sport pack"
  },
  {
    id: "lst-008",
    title: "Toyota Quantum 2.5 D-4D 5-Speed Manual Gearbox",
    description: "Imported low mileage manual 5-speed transmission for Toyota Quantum 2.5 D-4D (2KD-FTV). Shifting beautifully, 100% sync check completed. Comes with 3 months exchange guarantee. Perfect for fleet taxi owners.",
    category: "Transmission",
    vehicleType: "Car",
    condition: "Refurbished",
    price: 14000,
    location: "Durban Central, KwaZulu-Natal",
    partNumber: "33030-26A20",
    brand: "Toyota Genuine",
    images: [
      "https://images.unsplash.com/photo-1617400324458-7c5ef40d04b4?auto=format&fit=crop&q=80&w=600",
    ],
    sellerId: "sel-006",
    sellerName: "Rajesh Naidoo",
    sellerBusinessName: "Taxispare Kings",
    sellerPhone: "+27 31 555 1098",
    sellerEmail: "rajesh@taxisparekings.co.za",
    isPremium: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    compatibility: "Toyota Quantum Ses'fikile 2.5 D-4D (2005 - 2020)"
  }
];

// In-memory Database for Sellers with Subscriptions
let sellers: Seller[] = [
  {
    id: "sel-001",
    name: "Gert van der Merwe",
    businessName: "Gauteng Diesel Tech",
    email: "gert@dieseltech.co.za",
    phone: "+27 82 555 0192",
    subscription: {
      active: true,
      plan: "Pro",
      expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amountPaid: 499
    }
  },
  {
    id: "sel-002",
    name: "Sipho Khumalo",
    businessName: "Coastline Truck Spares",
    email: "info@coastlinetruckspares.co.za",
    phone: "+27 71 555 3847",
    subscription: {
      active: true,
      plan: "Enterprise",
      expiryDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amountPaid: 999
    }
  },
  {
    id: "sel-003",
    name: "Moegamat Allie",
    businessName: "Cape Cape Motor Spares",
    email: "allie@capemotor.co.za",
    phone: "+27 21 555 4981",
    subscription: {
      active: true,
      plan: "Starter",
      expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amountPaid: 249
    }
  },
  {
    id: "sel-004",
    name: "Johan Coetzee",
    businessName: "Pretoria Scrap Yard",
    email: "johan@pretoriascrapyard.co.za",
    phone: "+27 12 555 9011",
    subscription: {
      active: true,
      plan: "Pro",
      expiryDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      amountPaid: 499
    }
  },
  {
    id: "sel-005",
    name: "Andile Mthembu",
    businessName: "Heavy Rig Truck Parts",
    email: "andile@heavyrig.co.za",
    phone: "+27 83 555 7824",
    subscription: {
      active: false,
      plan: "None"
    }
  }
];

// Lazy Gemini API Initializer
let aiClient: any = null;
function getAI() {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY is not defined. AI Features will run in simulation mode.");
    return null;
  }
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("🚀 Gemini AI client initialized successfully!");
    } catch (err) {
      console.error("❌ Failed to initialize GoogleGenAI:", err);
    }
  }
  return aiClient;
}

// ------------------- API ROUTES -------------------

// 1. Get Listings with rich filters
app.get("/api/listings", (req, res) => {
  let filtered = [...listings];
  const { query, category, vehicleType, condition, location, minPrice, maxPrice, isPremium } = req.query;

  if (query) {
    const q = String(query).toLowerCase();
    filtered = filtered.filter(l => 
      l.title.toLowerCase().includes(q) || 
      l.description.toLowerCase().includes(q) || 
      (l.partNumber && l.partNumber.toLowerCase().includes(q)) ||
      (l.brand && l.brand.toLowerCase().includes(q)) ||
      (l.compatibility && l.compatibility.toLowerCase().includes(q))
    );
  }

  if (category) {
    filtered = filtered.filter(l => l.category === String(category));
  }

  if (vehicleType) {
    filtered = filtered.filter(l => l.vehicleType === String(vehicleType) || l.vehicleType === 'Both');
  }

  if (condition) {
    filtered = filtered.filter(l => l.condition === String(condition));
  }

  if (location) {
    const loc = String(location).toLowerCase();
    filtered = filtered.filter(l => l.location.toLowerCase().includes(loc));
  }

  if (minPrice) {
    filtered = filtered.filter(l => l.price >= Number(minPrice));
  }

  if (maxPrice) {
    filtered = filtered.filter(l => l.price <= Number(maxPrice));
  }

  if (isPremium === 'true') {
    filtered = filtered.filter(l => l.isPremium);
  }

  // Sort: premium first, then by date descending
  filtered.sort((a, b) => {
    if (a.isPremium && !b.isPremium) return -1;
    if (!a.isPremium && b.isPremium) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  res.json(filtered);
});

// 2. Get Single Listing
app.get("/api/listings/:id", (req, res) => {
  const listing = listings.find(l => l.id === req.params.id);
  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }
  res.json(listing);
});

// 3. Create a listing (Requires seller to be active or subbed)
app.post("/api/listings", (req, res) => {
  const { title, description, category, vehicleType, condition, price, location, partNumber, brand, images, sellerId } = req.body;

  if (!title || !category || !vehicleType || !condition || !price || !location || !sellerId) {
    return res.status(400).json({ error: "Missing required fields for listing." });
  }

  // Find seller to verify subscription status
  const seller = sellers.find(s => s.id === sellerId);
  if (!seller) {
    return res.status(404).json({ error: "Seller profile not found. Please log in or register." });
  }

  if (!seller.subscription || !seller.subscription.active) {
    return res.status(403).json({ 
      error: "Subscription Inactive", 
      message: "You must subscribe to a monthly plan to publish listings on Partssource ZA." 
    });
  }

  // Handle premium tag based on seller plan (Pro / Enterprise sellers get premium listings)
  const isPremium = seller.subscription.plan === 'Pro' || seller.subscription.plan === 'Enterprise';

  const newListing: PartListing = {
    id: `lst-${Date.now().toString().slice(-6)}`,
    title,
    description,
    category,
    vehicleType,
    condition,
    price: Number(price),
    location,
    partNumber: partNumber || "",
    brand: brand || "Generic",
    images: images && images.length > 0 ? images : ["https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&q=80&w=600"],
    sellerId,
    sellerName: seller.name,
    sellerBusinessName: seller.businessName,
    sellerPhone: seller.phone,
    sellerEmail: seller.email,
    isPremium,
    createdAt: new Date().toISOString(),
    compatibility: req.body.compatibility || "Fits standard models of specified vehicles."
  };

  listings.unshift(newListing);
  res.status(201).json(newListing);
});

// 4. Register or fetch seller profile
app.post("/api/sellers/auth", (req, res) => {
  const { email, name, phone, businessName } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  let seller = sellers.find(s => s.email.toLowerCase() === email.toLowerCase());

  if (!seller) {
    // Create new seller profile with No active subscription
    seller = {
      id: `sel-${Date.now().toString().slice(-6)}`,
      name: name || email.split('@')[0],
      businessName: businessName || "",
      email: email.toLowerCase(),
      phone: phone || "+27 ",
      subscription: {
        active: false,
        plan: "None"
      }
    };
    sellers.push(seller);
  }

  res.json(seller);
});

// 5. Update Seller details
app.put("/api/sellers/:id", (req, res) => {
  const sellerIndex = sellers.findIndex(s => s.id === req.params.id);
  if (sellerIndex === -1) {
    return res.status(404).json({ error: "Seller not found" });
  }

  const { name, businessName, phone } = req.body;
  sellers[sellerIndex] = {
    ...sellers[sellerIndex],
    name: name || sellers[sellerIndex].name,
    businessName: businessName !== undefined ? businessName : sellers[sellerIndex].businessName,
    phone: phone || sellers[sellerIndex].phone,
  };

  // Sync listings with updated seller details
  listings = listings.map(l => {
    if (l.sellerId === req.params.id) {
      return {
        ...l,
        sellerName: sellers[sellerIndex].name,
        sellerBusinessName: sellers[sellerIndex].businessName,
        sellerPhone: sellers[sellerIndex].phone,
      };
    }
    return l;
  });

  res.json(sellers[sellerIndex]);
});

// 6. Simulate Monthly Subscription Activation
app.post("/api/sellers/:id/subscribe", (req, res) => {
  const sellerIndex = sellers.findIndex(s => s.id === req.params.id);
  if (sellerIndex === -1) {
    return res.status(404).json({ error: "Seller profile not found." });
  }

  const { plan, cardNumber } = req.body; // mock credit card billing
  if (!plan || !['Starter', 'Pro', 'Enterprise'].includes(plan)) {
    return res.status(400).json({ error: "Invalid subscription plan selected." });
  }

  let amountPaid = 249;
  if (plan === 'Pro') amountPaid = 499;
  if (plan === 'Enterprise') amountPaid = 999;

  sellers[sellerIndex].subscription = {
    active: true,
    plan,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    amountPaid
  };

  // Automatically upgrade seller's existing listings to premium if they got Pro/Enterprise!
  const isPremium = plan === 'Pro' || plan === 'Enterprise';
  listings = listings.map(l => {
    if (l.sellerId === req.params.id) {
      return { ...l, isPremium };
    }
    return l;
  });

  res.json({
    message: `Subscription activated successfully! You are now subscribed to Partssource ZA ${plan} plan.`,
    seller: sellers[sellerIndex]
  });
});

// 7. Delete listing
app.delete("/api/listings/:id", (req, res) => {
  const index = listings.findIndex(l => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Listing not found" });
  }
  listings.splice(index, 1);
  res.json({ success: true, message: "Listing deleted successfully." });
});

// 8. GEMINI API: Auto-generate listing descriptions for sellers
app.post("/api/gemini/suggest-description", async (req, res) => {
  const { title, condition, vehicleModel, category } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Please provide a part title." });
  }

  const ai = getAI();
  if (!ai) {
    // Return high quality simulation description if key is missing
    const simulatedDescription = `This high-quality ${title} is perfect for your ${vehicleModel || 'vehicle'}. It is categorized as a premium ${category || 'spare part'} and is offered in ${condition || 'Good'} condition. All our spares are sourced from trusted workshops, ensuring full reliability, optimal performance, and great value for South African drivers and truck fleets. Tested for quality and ready for direct bolt-on installation.`;
    return res.json({ description: simulatedDescription, simulated: true });
  }

  try {
    const prompt = `Write a professional, attractive, and high-converting product description for a South African automotive and truck parts advertising marketplace called "Partssource ZA". 
    Part details:
    - Part Title: ${title}
    - Category: ${category || 'Uncategorized'}
    - Target Vehicle Model: ${vehicleModel || 'Universal'}
    - Condition: ${condition || 'New/Used'}
    
    The description must be clear, outline key selling points, state that it is tested/vetted, mention compatibility checks, and be customized for South African car and truck owners/mechanics. Keep it concise, under 150 words. Do not use markdown styling inside the text block other than bullet points if necessary.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ description: response.text?.trim() || "" });
  } catch (err: any) {
    console.error("Gemini description error:", err);
    res.status(500).json({ error: "AI Description Service temporarily unavailable.", details: err.message });
  }
});

// 9. GEMINI API: Smart AI Parts Advisor
app.post("/api/gemini/advisor", async (req, res) => {
  const { messages } = req.body; // array of ChatMessage objects

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required." });
  }

  const userQuery = messages[messages.length - 1]?.text || "";

  // Prepare simple summary of available listings for Gemini context
  const listingShortlist = listings.map(l => ({
    id: l.id,
    title: l.title,
    price: `R${l.price}`,
    location: l.location,
    compatibility: l.compatibility,
    category: l.category
  }));

  const ai = getAI();
  if (!ai) {
    // Simulated diagnostic feedback if key is missing
    const queryLower = userQuery.toLowerCase();
    let advice = "Hi there! I am the Partssource ZA AI parts diagnostic specialist. It looks like you're searching for vehicle spares.";
    let suggestedIds: string[] = [];

    if (queryLower.includes("hilux") || queryLower.includes("toyota")) {
      advice = "For Toyota Hilux, ensuring fuel system integrity is vital. Common requests include injectors and gearboxes. I see we have high-quality injectors listed that might interest you!";
      const injector = listings.find(l => l.id === "lst-001");
      if (injector) suggestedIds.push(injector.id);
    } else if (queryLower.includes("scania") || queryLower.includes("truck") || queryLower.includes("brake")) {
      advice = "Commercial truck maintenance is crucial for safety and fleet uptime. If you are experiencing spongy braking or slow stopping on a Scania rig, replacing brake pads is the first logical step. We have genuine heavy duty brake pads available right now.";
      const pads = listings.find(l => l.id === "lst-002");
      if (pads) suggestedIds.push(pads.id);
    } else if (queryLower.includes("volvo") || queryLower.includes("suspension")) {
      advice = "Volvo truck suspensions frequently travel long distances on rough routes. If you hear knocking or experience an unstable ride, check your suspension airbags. We have rear axle replacement bellows listed.";
      const airbag = listings.find(l => l.id === "lst-004");
      if (airbag) suggestedIds.push(airbag.id);
    } else if (queryLower.includes("polo") || queryLower.includes("head") || queryLower.includes("vw")) {
      advice = "A loss of coolant or engine misfires in a VW Polo 1.4 Vivo often points to head gasket failure or cylinder head issues. Check our fully refurbished Polo CLP cylinder head listing!";
      const head = listings.find(l => l.id === "lst-003");
      if (head) suggestedIds.push(head.id);
    } else {
      advice = "I recommend checking our search engine with specific OEM part numbers or vehicle names. You can also view our latest listings across Engine parts, Suspension, and Brakes to find exactly what you need.";
    }

    return res.json({ advice, suggestedParts: suggestedIds, simulated: true });
  }

  try {
    const systemPrompt = `You are the expert "Partssource ZA AI Parts Advisor", a virtual car and truck mechanics helper in South Africa.
    Your job is to diagnose user issues conceptually (e.g. "blowing smoke", "knocking sounds", "spongy brakes") and recommend the appropriate replacement parts.
    
    CRITICAL: Below is the CURRENT real-time database of parts listed on our South African marketplace. If any of these listings match what the user is looking for or could fix their issue, you MUST mention them and supply their IDs in your response.
    
    Database listings available:
    ${JSON.stringify(listingShortlist, null, 2)}
    
    Rules:
    - Speak in a friendly, knowledgeable mechanic's tone.
    - Reference specific listings from the database if they match.
    - Mention price or location when referring to them to make it look highly integrated.
    - Return a JSON object with two fields:
      1. "advice": A clean, formatted response text (no markdown headings, just paragraphs or lists).
      2. "suggestedParts": An array of matched listing IDs (e.g., ["lst-001"]) from the list provided. If none fit, return an empty array.`;

    const formattedContents = [
      { role: "user", parts: [{ text: `System context: ${systemPrompt}` }] }
    ];

    // Map conversation history
    messages.forEach((m: any) => {
      formattedContents.push({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      });
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: { type: Type.STRING, description: "Mechanic diagnostic advice to user" },
            suggestedParts: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "List of matched part IDs from the database, matching the search" 
            }
          },
          required: ["advice", "suggestedParts"]
        }
      }
    });

    const rawResponse = response.text || "{}";
    const result = JSON.parse(rawResponse);
    res.json(result);
  } catch (err: any) {
    console.error("Gemini advisor error:", err);
    res.status(500).json({ error: "AI Advisor service experienced an error.", details: err.message });
  }
});

// --------------------------------------------------

// Vite & Static file serving setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Partssource ZA running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
