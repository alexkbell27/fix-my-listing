export const MOCK = {
  listingName: "Sea La Vie: for Beach and Sea World",
  location: "San Diego, CA",
  bedrooms: 2,
  bathrooms: 1,
  currentScore: 42,
  projectedScore: 91,
  revenueLift: 31,
  currentNightlyRate: 149,
  suggestedNightlyRate: 189,
  criticalFixCount: 4,
  title: {
    current: "Sea La Vie: for Beach and Sea World",
    currentCharCount: 35,
    rating: "poor" as const,
    alternatives: [
      {
        text: "Coastal Escape · 1mi to Beach · Near SeaWorld · Patio + Parking ✓",
        charCount: 64,
        keywords: ["beach", "SeaWorld", "parking", "patio"],
      },
      {
        text: "Sunny 2BR Near Ocean & SeaWorld · Free Parking · Fast WiFi",
        charCount: 57,
        keywords: ["beach", "SeaWorld", "parking", "WiFi"],
      },
      {
        text: "Beach Town Retreat · 2BR · Walk to Ocean · SeaWorld 3mi",
        charCount: 54,
        keywords: ["beach", "ocean", "SeaWorld"],
      },
    ],
  },
  description: {
    opening: {
      label: "Opening",
      current:
        "This 2 bedroom/1 bathroom apartment is 1 mile to the beach, 3 miles to Sea World, and within 15-20 minutes of the most visited San Diego attractions.",
      optimized:
        "Wake up a mile from the Pacific and spend your San Diego days the way they're meant to be spent — sandy, sunny, and unhurried. This bright 2-bedroom suite is your laid-back home base: close to the ocean, minutes from SeaWorld and Balboa Park, and far enough from the tourist crowds to feel like a local.",
    },
    theSpace: {
      label: "The Space",
      current: "The apartment has a full kitchen, two bedrooms, and one bathroom.",
      optimized:
        "The apartment is light-filled and private, with a full kitchen, comfortable beds in both rooms, and a dedicated outdoor space perfect for morning coffee or evening drinks. Parking is included — rare for this part of San Diego.",
    },
    gettingAround: {
      label: "Getting Around",
      current: "We are close to the beach and Sea World.",
      optimized:
        "You're 1 mile from Mission Beach, 3 miles from SeaWorld, and 15 minutes from Balboa Park and the Gaslamp Quarter. Free parking on-site means no hunting for street spots. Bikes and the local trolley are easy options for getting around without a car.",
    },
    houseRules: {
      label: "House Rules",
      current: "No smoking. No parties.",
      optimized:
        "We want you to feel at home — just keep it respectful. No smoking anywhere on the property, no parties or events, and quiet hours after 10pm. Check-in is flexible; just let us know your arrival time in advance.",
    },
  },
  photos: {
    issues: [
      {
        severity: "critical" as const,
        description:
          "Cover photo shows exterior — guests book emotionally; lead with the best interior or outdoor living space.",
      },
      {
        severity: "critical" as const,
        description:
          "No golden-hour or natural-light shots detected. Bright daytime photos increase click-through rate by ~22%.",
      },
      {
        severity: "warning" as const,
        description: "Bathroom photo is low-resolution and poorly lit — reshoot or remove.",
      },
      {
        severity: "tip" as const,
        description:
          "Add a staged kitchen shot with coffee and fruit — it signals a well-equipped, welcoming space.",
      },
    ],
    recommendedOrder: [
      { slot: 1, shotType: "Living area or patio", tip: "Best interior shot with natural light — this is your hook." },
      { slot: 2, shotType: "Primary bedroom", tip: "Show crisp linens and natural light coming through the window." },
      { slot: 3, shotType: "Kitchen", tip: "Stage with coffee maker on, fruit bowl, clean counters." },
      { slot: 4, shotType: "Outdoor / patio space", tip: "Morning light works best. Show the full space." },
      { slot: 5, shotType: "Neighborhood / beach proximity", tip: "A shot of the beach or street sets location context." },
      { slot: 6, shotType: "Second bedroom + bathroom", tip: "Clean, well-lit, straightforward." },
    ],
  },
  amenities: {
    present: ["WiFi", "Full kitchen", "Free parking", "AC", "Washer/dryer", "TV"],
    missing: ["Beach chairs & umbrella", "Dedicated workspace", "Smart TV", "Local guidebook", "Bike rental info"],
    quickWins: [
      { item: "Beach chairs & umbrella", estimatedImpact: 18, cost: "$80 one-time" },
      { item: "Laptop-friendly desk + monitor", estimatedImpact: 12, cost: "$150 one-time" },
      { item: "Printed local guidebook", estimatedImpact: 9, cost: "$10 one-time" },
    ],
  },
  pricing: {
    currentBase: 149,
    areaMedian: 182,
    topTenPercent: 229,
    recommendedBase: 189,
    recommendedWeekend: 229,
    recommendedPeakSeason: 249,
    recommendedCleaningFee: 95,
    nextHighDemandEvent: {
      name: "San Diego Comic-Con",
      date: "July 24–27, 2025",
      suggestedPrice: 289,
    },
  },
  seo: {
    detectedKeywords: ["beach", "Sea World", "San Diego", "parking"],
    missingKeywords: [
      "Mission Beach",
      "Balboa Park",
      "family-friendly",
      "free parking",
      "surf",
      "Gaslamp Quarter",
      "ocean view",
    ],
    instantBook: false,
    estimatedResponseRate: "~85%",
    reviewCount: 47,
  },
  actionPlan: [
    { action: "Rewrite listing title to lead with location keywords and amenities", effort: "5 min", impact: "high" as const },
    { action: "Replace cover photo with best interior or patio shot in natural light", effort: "5 min", impact: "high" as const },
    { action: "Enable Instant Book in listing settings", effort: "5 min", impact: "high" as const },
    { action: "Rewrite opening description paragraph using optimized version above", effort: "5 min", impact: "high" as const },
    { action: "Update base nightly rate from $149 to $189", effort: "5 min", impact: "high" as const },
    { action: "Add missing SEO keywords throughout description", effort: "1 hour", impact: "medium" as const },
    { action: "Purchase and photograph beach chairs + umbrella as guest amenity", effort: "one-time", impact: "medium" as const },
    { action: "Reshoot bathroom and kitchen with better lighting", effort: "one-time", impact: "medium" as const },
    {
      action: "Set up weekend and peak season pricing rules in Airbnb smart pricing",
      effort: "1 hour",
      impact: "medium" as const,
    },
    {
      action: "Create a printed local guidebook with top restaurants and beach tips",
      effort: "one-time",
      impact: "low" as const,
    },
  ],
} as const;

export type MockData = typeof MOCK;
