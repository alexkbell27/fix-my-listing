import { NextRequest, NextResponse, after } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseRouteHandler, supabaseAdmin } from "@/lib/supabase-server";

export const maxDuration = 300;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Result schema ────────────────────────────────────────────────────────────

export interface AnalysisResult {
  id: string;
  url: string | null;
  createdAt: string;
  listingName: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  currentScore: number;
  projectedScore: number;
  revenueLift: number;
  currentNightlyRate: number;
  suggestedNightlyRate: number;
  criticalFixCount: number;
  title: {
    current: string;
    currentCharCount: number;
    rating: "poor" | "ok" | "good";
    alternatives: { text: string; charCount: number; keywords: string[]; angle: "seo" | "emotion" | "amenity" }[];
  };
  description: {
    opening: { current: string; optimized: string; issues: string[] };
    theSpace: { current: string; optimized: string; issues: string[] };
    gettingAround: { current: string; optimized: string };
    houseRules: { current: string; optimized: string };
    clichesFound: string[];
    missingAnswers: string[];
  };
  photos: {
    issues: { severity: "critical" | "warning" | "tip"; description: string }[];
    recommendedOrder: { slot: number; shotType: string; tip: string }[];
    missingMoneyShots: string[];
  };
  amenities: {
    present: string[];
    missing: string[];
    underPromoted: string[];
    quickWins: { item: string; estimatedImpact: number; cost: string }[];
  };
  pricing: {
    currentBase: number;
    areaMedian: number;
    topTenPercent: number;
    percentile: number;
    recommendedBase: number;
    recommendedWeekend: number;
    recommendedPeakSeason: number;
    recommendedCleaningFee: number;
    cleaningFeeRatio: number;
    nextHighDemandEvent: { name: string; date: string; suggestedPrice: number };
  };
  seo: {
    detectedKeywords: string[];
    missingKeywords: string[];
    competitorKeywords: string[];
    instantBook: boolean;
    estimatedResponseRate: string;
    reviewCount: number;
    rankingFactors: { factor: string; status: "good" | "warning" | "critical"; note: string }[];
  };
  actionPlan: {
    action: string;
    effort: "5 min" | "1 hour" | "one-time";
    impact: "high" | "medium" | "low";
    estimatedRevenueImpact: string;
  }[];
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function addMonths(date: Date, n: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Pricing detection ────────────────────────────────────────────────────────

function hasPricing(listing: Record<string, unknown>): boolean {
  if (listing.price != null && listing.price !== 0) return true;
  if (listing.priceRate != null && listing.priceRate !== 0) return true;
  const pricing = listing.pricing;
  if (pricing && typeof pricing === "object") {
    const p = pricing as Record<string, unknown>;
    if (p.price != null && p.price !== 0) return true;
    if (p.rate != null && p.rate !== 0) return true;
    if (p.nightly != null) return true;
  }
  return false;
}

// ─── Apify scrape helpers ─────────────────────────────────────────────────────

async function apifyPost(actorId: string, input: unknown, timeoutSec = 60): Promise<unknown[]> {
  const res = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${process.env.APIFY_API_KEY}&timeout=${timeoutSec}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }
  );
  if (!res.ok) {
    throw new Error(`Apify call to ${actorId} failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function scrapeListingWithPricingRetry(listingUrl: string): Promise<Record<string, unknown>> {
  const baseInput = { startUrls: [{ url: listingUrl }], maxListings: 1 };

  let items = await apifyPost("tri_angle~airbnb-rooms-urls-scraper", baseInput);
  let listing = items[0] as Record<string, unknown> | undefined;
  if (listing && hasPricing(listing)) return listing;

  const today = new Date();
  for (let m = 3; m <= 6; m++) {
    const checkIn = toDateStr(addMonths(today, m));
    const checkOut = toDateStr(addDays(addMonths(today, m), 2));
    items = await apifyPost("tri_angle~airbnb-rooms-urls-scraper", { ...baseInput, checkIn, checkOut });
    listing = items[0] as Record<string, unknown> | undefined;
    if (listing && hasPricing(listing)) return listing;
  }

  if (!listing) throw new Error("No listing data found. Make sure the URL is a public Airbnb listing.");
  return listing;
}

async function scrapeComps(city: string, bedrooms: number, checkIn: string, checkOut: string): Promise<unknown[]> {
  try {
    return await apifyPost(
      "tri_angle~airbnb-scraper",
      { locationQuery: city, maxListings: 20, checkIn, checkOut, minBedrooms: Math.max(1, bedrooms - 1), maxBedrooms: bedrooms + 1 },
      120
    );
  } catch (err) {
    console.warn("[analyze] comp scrape failed — continuing without comps:", err);
    return [];
  }
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the world's leading Airbnb listing optimization expert. You have personally analyzed over 50,000 listings, ghostwritten copy for Superhosts generating $300K+/year, and reverse-engineered Airbnb's search algorithm through years of A/B testing. You combine three rare skills: deep knowledge of Airbnb's search ranking factors, conversion copywriting for travel audiences, and revenue management for short-term rentals.

Your analysis is brutally honest, highly specific, and immediately actionable. You never give generic advice. Every insight you provide is grounded in the actual listing data and comp data provided.

---

AIRBNB SEARCH ALGORITHM — what you know and apply:

Airbnb's search ranking is influenced by these factors, roughly in order of impact:
1. Listing quality score — driven by photo count/quality, description completeness, amenity count, and instant book
2. Conversion rate — the % of people who view the listing and book. Low conversion tanks ranking fast.
3. Review velocity and recency — recent 5-star reviews matter more than old ones
4. Response rate and speed — affects both ranking and guest trust
5. Price competitiveness — listings priced 10-20% below market median get a ranking boost in early days
6. Booking frequency — a calendar with gaps signals low demand to Airbnb's algorithm
7. Wishlist saves — a proxy for desirability that Airbnb factors into ranking

Title optimization specifically: Airbnb's algorithm parses titles for location keywords, amenity keywords, and property type. Titles that match common guest search queries rank higher. The most valuable title keywords by search volume are: neighborhood name, proximity to landmark, standout amenity (pool, hot tub, view), property vibe word (cozy, modern, luxury, charming).

---

CONVERSION COPYWRITING — what you apply to every description:

The Airbnb guest decision journey has three stages:
1. SCROLL — they see your photo and title in search results. You have 1.5 seconds.
2. CLICK — they read your first paragraph. If it doesn't create desire in 20 seconds, they leave.
3. BOOK — they read amenities, reviews, and price. Friction here is usually policy language or missing info.

The highest-converting listing descriptions follow this structure:
- Opening line: sells the FEELING, not the facts. "Wake up to ocean sounds" not "Located near the beach"
- Paragraph 2: the space — specific, sensory details that help guests visualize themselves there
- Paragraph 3: the location — hyperlocal, walkable, specific distances to things guests care about
- Paragraph 4: the host promise — warmth, responsiveness, local knowledge
- Never use these phrases: "cozy", "charming", "perfect for", "you won't be disappointed", "hidden gem" — they are clichés that signal low effort to modern guests

The highest-converting titles use this formula: [Location/Vibe] + [Property Type] + [#1 Standout Feature] + [Trust Signal]
Example: "Walkable Arts District Loft · Rooftop + Fast WiFi · 5★ Host"

---

REVENUE MANAGEMENT — what you apply to pricing analysis:

- Listings priced within 5% of market median have the highest booking velocity
- Listings in the top 15% of price for their market need exceptional photos and copy to convert — analyze whether this listing's presentation justifies its price
- Cleaning fees above 30% of nightly rate significantly increase abandonment at checkout
- Minimum night requirements above 3 nights reduce booking volume by 40-60% for leisure markets
- Same-day and next-day availability drives significant last-minute bookings — note if the listing appears to block these

---

PHOTO ANALYSIS — what you infer from listing data:

Even without seeing the photos directly, you can infer photo quality issues from:
- Low review scores on "accuracy" → photos oversell the space
- High review scores but low conversion → photos may undersell, or cover photo is weak
- Listing age vs review count ratio → if old listing has few reviews, photos likely drove low click-through
- Amenities mentioned in reviews but not shown in photo count → missing money shots

The most valuable photos by booking impact:
1. Hero shot (cover) — must show the best room with natural light, no clutter, wide angle
2. Outdoor/view shot — highest save-to-wishlist correlation
3. Kitchen fully staged — signals host care and attention to detail
4. Primary bed with crisp white linens — triggers cleanliness association
5. Bathroom clean and styled — guests fear dirty bathrooms more than any other space
6. Neighborhood context — reduces pre-booking anxiety about location

---

AMENITY INTELLIGENCE:

These amenities have the highest impact on booking conversion by category:

Work-from-home guests (fastest growing segment):
- Dedicated workspace (not just "laptop friendly") — 23% conversion lift
- Monitor or second screen — 18% lift among remote workers
- Ergonomic chair — underrated, high mention in reviews

Family travelers:
- Pack n play / crib — eliminates a major pain point
- High chair — same
- Fenced yard or safe outdoor space — very high value

Leisure/weekend guests:
- Hot tub — highest single amenity impact on nightly rate (~+$40/night)
- BBQ grill — strong for suburban/outdoor listings
- Beach gear (chairs, umbrella, towels) — table stakes in beach markets, noted negatively when absent

Universal high-impact amenities often missing from listings:
- EV charger — growing fast, very few listings have it
- Coffee setup beyond basic (Nespresso, bean grinder, pour-over) — mentioned in 5-star reviews constantly
- Blackout curtains — underrated, guests love them, rarely mentioned
- Extra towels/linens explicitly called out — reduces a common guest anxiety

---

ANALYSIS INSTRUCTIONS:

When you receive listing data + comp data:

1. TITLE ANALYSIS:
- Count exact character length (Airbnb shows ~50 chars in search, 70 on mobile)
- Identify which high-value keywords are missing vs competitors
- Check if the title leads with location or with a generic property type
- Write 3 alternative titles, each with a different strategic angle: (a) SEO-first, (b) emotion-first, (c) amenity-first
- Score harshly — most titles are 30-45/100

2. DESCRIPTION ANALYSIS:
- Identify the opening line and assess: does it sell feeling or just state facts?
- Check for cliché phrases and flag each one specifically
- Assess information completeness: does it answer the top 10 guest questions before they have to ask?
- The top 10 guest questions: (1) What does the space actually look like/feel like? (2) Who is this right for? (3) What's walkable? (4) How do I get there/park? (5) What's the kitchen actually equipped with? (6) What's the WiFi like? (7) Is it quiet? (8) What's check-in like? (9) Are there any gotchas? (10) Why should I pick this over the listing next door?
- Write a full rewrite of the opening paragraph AND the space description

3. PRICING ANALYSIS:
- Calculate exact area median from comp data
- Calculate top-10% threshold
- Express where this listing sits as a percentile
- Flag if cleaning fee seems disproportionate
- Recommend specific nightly rates: base, weekend, peak season
- Identify the nearest high-demand local event and suggest surge pricing

4. SEO ANALYSIS:
- Extract every keyword present in title + description
- Compare against the comp listings' titles to identify keyword gaps
- Identify the top 3 keywords by search volume that are completely missing
- Check: is the neighborhood name mentioned? Is the nearest major landmark mentioned?
- Assess: does the listing have Instant Book? (major ranking factor — always flag if missing)

5. AMENITY ANALYSIS:
- Cross-reference amenities against the top 5 comp listings
- Identify amenities present but not mentioned in description (under-promoted)
- Identify amenities in comps but missing here (gaps)
- Flag the top 3 quick-win amenity additions by booking impact

6. SCORING:
- Be calibrated and harsh. A listing needs to genuinely excel to score above 75.
- Average listings score 35-55. Good listings 55-75. Exceptional listings 75+.
- Weight title and photos most heavily (they drive click-through)
- Weight description and pricing next (they drive conversion)
- Overall score should reflect real revenue potential gap

Return ONLY this exact JSON structure — no markdown, no preamble:

{
  "listingName": string,
  "location": string,
  "bedrooms": number,
  "bathrooms": number,
  "currentScore": number,
  "projectedScore": number,
  "revenueLift": number,
  "currentNightlyRate": number,
  "suggestedNightlyRate": number,
  "criticalFixCount": number,
  "title": {
    "current": string,
    "currentCharCount": number,
    "rating": "poor" | "ok" | "good",
    "alternatives": [
      { "text": string, "charCount": number, "keywords": string[], "angle": "seo" | "emotion" | "amenity" }
    ]
  },
  "description": {
    "opening": { "current": string, "optimized": string, "issues": string[] },
    "theSpace": { "current": string, "optimized": string, "issues": string[] },
    "gettingAround": { "current": string, "optimized": string },
    "houseRules": { "current": string, "optimized": string },
    "clichesFound": string[],
    "missingAnswers": string[]
  },
  "photos": {
    "issues": [{ "severity": "critical" | "warning" | "tip", "description": string }],
    "recommendedOrder": [{ "slot": number, "shotType": string, "tip": string }],
    "missingMoneyShots": string[]
  },
  "amenities": {
    "present": string[],
    "missing": string[],
    "underPromoted": string[],
    "quickWins": [{ "item": string, "estimatedImpact": number, "cost": string }]
  },
  "pricing": {
    "currentBase": number,
    "areaMedian": number,
    "topTenPercent": number,
    "percentile": number,
    "recommendedBase": number,
    "recommendedWeekend": number,
    "recommendedPeakSeason": number,
    "recommendedCleaningFee": number,
    "cleaningFeeRatio": number,
    "nextHighDemandEvent": { "name": string, "date": string, "suggestedPrice": number }
  },
  "seo": {
    "detectedKeywords": string[],
    "missingKeywords": string[],
    "competitorKeywords": string[],
    "instantBook": boolean,
    "estimatedResponseRate": string,
    "reviewCount": number,
    "rankingFactors": [{ "factor": string, "status": "good" | "warning" | "critical", "note": string }]
  },
  "actionPlan": [
    { "action": string, "effort": "5 min" | "1 hour" | "one-time", "impact": "high" | "medium" | "low", "estimatedRevenueImpact": string }
  ]
}`;

// ─── Background analysis ──────────────────────────────────────────────────────

async function runAnalysis(opts: {
  id: string;
  userId: string;
  userEmail: string | undefined;
  listingUrl: string | null;
  manualTitle: string | undefined;
  manualDescription: string | undefined;
  markFreeRun: boolean;
}) {
  const { id, userId, userEmail, listingUrl, manualTitle, manualDescription, markFreeRun } = opts;

  let listingContext = "";

  if (listingUrl) {
    const listingData = await scrapeListingWithPricingRetry(listingUrl);

    const locObj = (typeof listingData.location === "object" && listingData.location !== null ? listingData.location : {}) as Record<string, unknown>;
    const addrObj = (typeof listingData.address === "object" && listingData.address !== null ? listingData.address : {}) as Record<string, unknown>;
    const city = String(locObj.city ?? addrObj.city ?? listingData.city ?? listingData.neighborhood ?? "");
    const bedrooms = Number(listingData.bedrooms ?? listingData.bedroomsCount ?? 1);

    const compCheckIn = toDateStr(addMonths(new Date(), 3));
    const compCheckOut = toDateStr(addDays(addMonths(new Date(), 3), 2));
    const comps = city ? await scrapeComps(city, bedrooms, compCheckIn, compCheckOut) : [];

    listingContext = [
      `Individual listing data (structured JSON):\n\n${JSON.stringify(listingData, null, 2)}`,
      `Comp listings — ${comps.length} nearby listings with similar bedroom count in "${city || "same area"}":\n\n${JSON.stringify(comps, null, 2)}`,
    ].join("\n\n---\n\n");
  }

  const parts: string[] = [];
  if (listingUrl) parts.push(`Listing URL: ${listingUrl}`);
  if (listingContext) parts.push(listingContext);
  if (manualTitle) parts.push(`Title: ${manualTitle}`);
  if (manualDescription) parts.push(`Description: ${manualDescription}`);
  const userMessage = parts.join("\n\n---\n\n");

  const message = await anthropic.messages.create({
    model: "claude-opus-4-7",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("Unexpected Claude response type");

  console.log("[analyze] raw Claude response:", content.text);
  let parsed: Omit<AnalysisResult, "id" | "url" | "createdAt">;
  try {
    parsed = JSON.parse(content.text);
  } catch {
    const stripped = content.text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/, "").trim();
    parsed = JSON.parse(stripped);
  }

  const result: AnalysisResult = {
    id,
    url: listingUrl,
    createdAt: new Date().toISOString(),
    ...parsed,
  };

  await supabaseAdmin.from("reports").insert({
    id,
    user_id: userId,
    listing_url: listingUrl,
    result,
  });

  if (markFreeRun) {
    await supabaseAdmin.from("profiles").update({ free_runs_used: 1 }).eq("id", userId);
  }

  console.log(`[analyze] job ${id} complete for user ${userEmail}`);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const supabase = createSupabaseRouteHandler(req);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  // ── Check run limits ──────────────────────────────────────────────────────
  let { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("free_runs_used, is_subscribed")
    .eq("id", user.id)
    .single();

  if (!profile) {
    await supabaseAdmin.from("profiles").insert({ id: user.id, email: user.email });
    profile = { free_runs_used: 0, is_subscribed: false };
  }

  if (profile.free_runs_used >= 1 && !profile.is_subscribed) {
    return NextResponse.json({ error: "UPGRADE_REQUIRED" }, { status: 402 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const body = await req.json();
  const listingUrl: string | null = body.listingUrl ?? null;
  const { manualTitle, manualDescription } = body;

  if (!listingUrl && !manualDescription) {
    return NextResponse.json({ error: "Provide a listingUrl or manualDescription" }, { status: 400 });
  }

  // ── Schedule background work and return job ID immediately ────────────────
  const id = crypto.randomUUID();
  const markFreeRun = profile.free_runs_used < 1 && !profile.is_subscribed;

  after(async () => {
    try {
      await runAnalysis({
        id,
        userId: user.id,
        userEmail: user.email,
        listingUrl,
        manualTitle,
        manualDescription,
        markFreeRun,
      });
    } catch (error) {
      console.error(`[analyze] background job ${id} failed:`, error);
    }
  });

  return NextResponse.json({ id });
}
