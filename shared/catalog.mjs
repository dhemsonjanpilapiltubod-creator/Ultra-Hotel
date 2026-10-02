/* ==========================================================================
   Ultra Hotel Group — catalogue
   The single source of truth for brands, properties, dining, loyalty and
   programmes. Imported unchanged by the browser AND the server, so a rate a
   guest reads is the rate the API charges.

   Prices are integer PHP centavos, nightly, before taxes.
   ========================================================================== */

const UNSPLASH = "https://images.unsplash.com/";

/** Build an Unsplash URL. `ar` is an aspect ratio hint so the CDN crops. */
export function img(id, { w = 1200, ar = "", q = 78 } = {}) {
  const params = new URLSearchParams({ auto: "format", fit: "crop", w: String(w), q: String(q) });
  if (ar) params.set("ar", ar);
  return `${UNSPLASH}${id}?${params}`;
}

/** A tiny blurred twin, used as the blur-up placeholder behind each photo. */
export function thumb(id, ar = "16x9") {
  const ratio = ar.split("x").map(Number);
  const h = Math.max(6, Math.round(24 * (ratio[1] / ratio[0])));
  return `${UNSPLASH}${id}?auto=format&fit=crop&w=24&h=${h}&blur=180&q=30`;
}

/* --------------------------------------------------------------------------
   The group
   -------------------------------------------------------------------------- */

export const GROUP = {
  name: "Ultra Hotel",
  collection: "The Ultra Collection",
  promise: "Book directly for the best rate, guaranteed",
  founded: 1971,
  headquarters: "Lapu-Lapu City, Cebu, Philippines",
  properties: 112,
  destinations: 78,
  rooms: 41800,
  restaurants: 540,
  meetingSpaces: 588,
  memberNumber: "11.4 million",
  phone: "09615625020",
  phoneHref: "+639615625020",
  // The address published to guests.
  reservationEmail: "Dhemsonjanpilapiltubod@gmail.com",
  groupEmail: "groupsales@ultrahotel.com",
  pressEmail: "press@ultrahotel.com",
  loyalty: "Ultra Circle",
};

/* --------------------------------------------------------------------------
   Sub-brands
   -------------------------------------------------------------------------- */

export const BRANDS = [
  {
    slug: "ultra-hotels",
    name: "Ultra Hotels",
    kicker: "Flagship",
    tagline: "Five-star luxury in premier city addresses",
    rooms: 54,
    img: "photo-1445019980597-93fa8acb246c",
    blurb: "The full Ultra address in the world's great cities — a lobby you can work from, a bar you can disappear into, and a bed you will actually look forward to.",
    points: ["City centre or landmark address", "Signature Ultra Spa", "Ultra Club Lounge above the 20th floor", "Full meeting and banqueting capability"],
  },
  {
    slug: "ultra-resorts",
    name: "Ultra Resorts",
    kicker: "Destination",
    tagline: "Sanctuaries for rediscovery, relaxation and rejuvenation",
    rooms: 31,
    img: "photo-1507525428034-b723cf961d3e",
    blurb: "Where the horizon does the talking. Beach, reef, mountain and desert retreats built around what is already there, with a family welcome as standard rather than as an afterthought.",
    points: ["Uninterrupted natural setting", "Family and kids' clubs as standard", "Signature Ultra Spa and wellness", "Marina, reef or trail access on site"],
  },
  {
    slug: "aether-by-ultra",
    name: "Aether by Ultra",
    kicker: "Lifestyle & Design",
    tagline: "Lifestyle and design-focused hotels",
    rooms: 19,
    img: "photo-1522708323590-d24dbb6b0267",
    blurb: "Independent-minded hotels in converted buildings, run by people who live in the neighbourhood. Fewer rooms, better beds, a proper vinyl collection.",
    points: ["Design-led, independently operated", "Neighbourhood restaurant, open to the public", "Original art and local makers", "Nightly social hour, always free"],
  },
  {
    slug: "pulse-by-ultra",
    name: "Pulse by Ultra",
    kicker: "Smart & Modern",
    tagline: "Smart, modern hotels for business and leisure",
    rooms: 8,
    img: "photo-1551882547-ff40c63fe5fa",
    blurb: "Built for the two-day trip. Soundproofed rooms, a gym that opens at five, one-tap check-in and enough power sockets to stop you thinking about power sockets.",
    points: ["App-first check-in and out", "24-hour gym and workspace floors", "High-speed, low-latency Wi-Fi", "Corporate and long-stay rates"],
  },
];

/* --------------------------------------------------------------------------
   Regions
   -------------------------------------------------------------------------- */

export const REGIONS = [
  { id: "asia", name: "Asia", note: "31 properties", img: "photo-1512453979798-5ea266f8880c" },
  { id: "middle-east", name: "Middle East", note: "16 properties", img: "photo-1512699355324-f07e3106dae5" },
  { id: "europe", name: "Europe", note: "27 properties", img: "photo-1516483638261-f4dbaf036963" },
  { id: "north-america", name: "North America", note: "19 properties", img: "photo-1533929736458-ca588d08c8be" },
  { id: "africa-indian-ocean", name: "Africa & Indian Ocean", note: "11 properties", img: "photo-1519315901367-f34ff9154487" },
  { id: "oceania", name: "Oceania", note: "8 properties", img: "photo-1505881502353-a1986add3762" },
];

/* --------------------------------------------------------------------------
   Properties
   -------------------------------------------------------------------------- */

const H = "ultra-hotels";
const R = "ultra-resorts";
const A = "aether-by-ultra";
const P = "pulse-by-ultra";

export const PROPERTIES = [
  /* ---- Asia ---- */
  { slug: "ultra-mactan-bay", name: "Ultra Mactan Bay", brand: R, region: "asia", city: "Mactan Island", country: "Philippines", fromCents: 28500, star: 5, rooms: 541, opened: 1998, img: "photo-1507525428034-b723cf961d3e", blurb: "Thirteen hectares of garden between a protected reef and 350 metres of white sand.", tags: ["beach", "family", "spa", "golf", "kids"], highlight: true },
  { slug: "ultra-kyoto-garden", name: "Ultra Kyoto Garden", brand: R, region: "asia", city: "Kyoto", country: "Japan", fromCents: 48000, star: 5, rooms: 218, opened: 2009, img: "photo-1470071459604-3b5ec3a7fe05", blurb: "A hillside of maples and moss, eleven minutes from Gion, with an onsen-fed spa.", tags: ["spa", "garden", "culture"] },
  { slug: "ultra-manila-makati", name: "Ultra Manila Makati", brand: H, region: "asia", city: "Manila", country: "Philippines", fromCents: 62000, star: 5, rooms: 402, opened: 2016, img: "photo-1445019980597-93fa8acb246c", blurb: "Forty storeys above Makati, with the longest lobby bar in the group.", tags: ["city", "business", "spa", "dining"] },
  { slug: "aether-bangkok-riverside", name: "Aether Bangkok Riverside", brand: A, region: "asia", city: "Bangkok", country: "Thailand", fromCents: 21500, star: 5, rooms: 96, opened: 2021, img: "photo-1522708323590-d24dbb6b0267", blurb: "A 1930s shophouse row on the Chao Phraya, with 96 rooms and a very serious cocktail bar.", tags: ["design", "riverside", "nightlife", "dining"] },
  { slug: "ultra-hanoi-old-quarter", name: "Ultra Hanoi Old Quarter", brand: H, region: "asia", city: "Hanoi", country: "Vietnam", fromCents: 18500, star: 5, rooms: 175, opened: 2013, img: "photo-1521401830884-6c03c1c87ebb", blurb: "A restored silk merchant's house, six minutes from Hoàn Kiếm lake.", tags: ["city", "culture", "dining"] },
  { slug: "pulse-bengaluru-tech", name: "Pulse Bengaluru Tech Park", brand: P, region: "asia", city: "Bengaluru", country: "India", fromCents: 14000, star: 5, rooms: 310, opened: 2022, img: "photo-1551882547-ff40c63fe5fa", blurb: "Soundproofed, app-check-in, and a 24-hour gym that opens at five in the morning.", tags: ["business", "modern", "gym"] },

  /* ---- Middle East ---- */
  { slug: "ultra-doha-pearl", name: "Ultra Doha Pearl", brand: H, region: "middle-east", city: "Doha", country: "Qatar", fromCents: 41000, star: 5, rooms: 356, opened: 2018, img: "photo-1549294413-26f195200c16", blurb: "On the Pearl's eastern crescent, with the largest ballroom in the Middle East.", tags: ["city", "events", "beach", "dining"] },
  { slug: "ultra-muscat-harbour", name: "Ultra Muscat Harbour", brand: R, region: "middle-east", city: "Muscat", country: "Oman", fromCents: 33000, star: 5, rooms: 264, opened: 2015, img: "photo-1533050487297-09b450131914", blurb: "Whitewashed low buildings on a private beach, with the Hajar mountains behind.", tags: ["beach", "spa", "desert", "family"] },
  { slug: "aether-beirut-downtown", name: "Aether Beirut Downtown", brand: A, region: "middle-east", city: "Beirut", country: "Lebanon", fromCents: 16000, star: 5, rooms: 84, opened: 2020, img: "photo-1512917774080-9991f1c4c750", blurb: "A restored 1960s office floor above Zaiteray Square. 84 rooms, one excellent bar.", tags: ["design", "city", "nightlife"] },
  { slug: "pulse-riyadh-business", name: "Pulse Riyadh Business District", brand: P, region: "middle-east", city: "Riyadh", country: "Saudi Arabia", fromCents: 19000, star: 5, rooms: 288, opened: 2023, img: "photo-1529260830199-42c24126f198", blurb: "Built for the meeting-heavy week: 22 boardrooms, a 24-hour business lounge, no lobby queue.", tags: ["business", "modern", "events"] },

  /* ---- Europe ---- */
  { slug: "ultra-vienna-belvedere", name: "Ultra Vienna Belvedere", brand: H, region: "europe", city: "Vienna", country: "Austria", fromCents: 37000, star: 5, rooms: 312, opened: 1904, img: "photo-1600566753086-00f18fb6b3ea", blurb: "A palatial 1904 building opposite the Belvedere, with a proper Viennese coffee house.", tags: ["city", "culture", "spa", "dining"] },
  { slug: "ultra-santorini-caldera", name: "Ultra Santorini Caldera", brand: R, region: "europe", city: "Santorini", country: "Greece", fromCents: 72000, star: 5, rooms: 76, opened: 2011, img: "photo-1502005229762-cf1b2da7c5d6", blurb: "Cave suites cut into the caldera rim. Seventy-six rooms, and no building taller than the vine.", tags: ["romance", "spa", "view", "weddings"], highlight: true },
  { slug: "aether-amsterdam-canal", name: "Aether Amsterdam Canal House", brand: A, region: "europe", city: "Amsterdam", country: "Netherlands", fromCents: 29000, star: 5, rooms: 68, opened: 2019, img: "photo-1615874959474-d609969a20ed", blurb: "A 17th-century canal warehouse with 68 rooms and a courtyard full of bikes.", tags: ["design", "canal", "nightlife"] },
  { slug: "ultra-edinburgh-castle", name: " Ultra Edinburgh Castle View", brand: H, region: "europe", city: "Edinburgh", country: "Scotland", fromCents: 31000, star: 5, rooms: 186, opened: 2012, img: "photo-1600585154340-be6161a56a0c", blurb: "A Georgian townhouse on the Esplanade, with a whisky bar and a proper breakfast.", tags: ["city", "culture", "dining"] },
  { slug: "pulse-berlin-mitte", name: "Pulse Berlin Mitte", brand: P, region: "europe", city: "Berlin", country: "Germany", fromCents: 17000, star: 5, rooms: 240, opened: 2021, img: "photo-1533777857889-4be7c70b33f7", blurb: "A converted printing works in Mitte. Workspace floors, a 24-hour gym, no lobby.", tags: ["business", "modern", "design"] },

  /* ---- North America ---- */
  { slug: "ultra-vancouver-seawall", name: "Ultra Vancouver Seawall", brand: H, region: "north-america", city: "Vancouver", country: "Canada", fromCents: 38000, star: 5, rooms: 220, opened: 2017, img: "photo-1512699355324-f07e3106dae5", blurb: "A glass pavilion on the Stanley Park seawall, facing the mountains across the water.", tags: ["city", "view", "spa", "dining"] },
  { slug: "ultra-napa-valley-estate", name: "Ultra Napa Valley Estate", brand: R, region: "north-america", city: "Napa", country: "United States", fromCents: 68000, star: 5, rooms: 104, opened: 2016, img: "photo-1501854140801-50d01698950b", blurb: "Two hundred acres of vineyard, a working winery, and the harvest table as the centrepiece.", tags: ["wine", "romance", "spa", "golf"], highlight: true },
  { slug: "aether-brooklyn-mill", name: "Aether Brooklyn Mill", brand: A, region: "north-america", city: "New York", country: "United States", fromCents: 34000, star: 5, rooms: 118, opened: 2022, img: "photo-1517457373958-b7bdd4587205", blurb: "A rope factory in DUMBO, kept as it was found. 118 rooms, a listening bar, great light.", tags: ["design", "city", "nightlife"] },
  { slug: "pulse-miami-brickell", name: "Pulse Miami Brickell", brand: P, region: "north-america", city: "Miami", country: "United States", fromCents: 22000, star: 5, rooms: 204, opened: 2023, img: "photo-1551882547-ff40c63fe5fa", blurb: "Brickell, a rooftop pool, and a 24-hour gym. Ten minutes from the airport.", tags: ["business", "modern", "pool"] },
  { slug: "ultra-honolulu-waikiki", name: "Ultra Honolulu Waikiki", brand: H, region: "north-america", city: "Honolulu", country: "United States", fromCents: 44000, star: 5, rooms: 342, opened: 2014, img: "photo-1505118380757-91f5f5632de0", blurb: "Two towers either side of a central garden, with the most photographed suite in the Pacific.", tags: ["beach", "family", "spa", "dining"] },

  /* ---- Africa & Indian Ocean ---- */
  { slug: "ultra-zanzibar-stone-town", name: "Ultra Zanzibar Stone Town", brand: R, region: "africa-indian-ocean", city: "Zanzibar", country: "Tanzania", fromCents: 52000, star: 5, rooms: 92, opened: 2018, img: "photo-1519315901367-f34ff9154487", blurb: "A carved doorsill house on the sea wall, with dhows leaving the jetty at sunrise.", tags: ["beach", "romance", "culture", "spa"] },
  { slug: "ultra-seychelles-anse-lazio", name: "Ultra Seychelles Anse Lazio", brand: R, region: "africa-indian-ocean", city: "Anse Lazio", country: "Seychelles", fromCents: 88000, star: 5, rooms: 62, opened: 2019, img: "photo-1519046904884-53103b34b206", blurb: "Sixty-two villas on a granite bay that photographs better than it has any right to.", tags: ["beach", "romance", "spa", "villas"], highlight: true },
  { slug: "ultra-marrakech-medina", name: "Ultra Marrakech Medina", brand: H, region: "africa-indian-ocean", city: "Marrakech", country: "Morocco", fromCents: 26000, star: 5, rooms: 148, opened: 2015, img: "photo-1548013146-72479768bada", blurb: "A riad inside the walls, with a courtyard pool and a rooftop that faces the Atlas.", tags: ["design", "culture", "spa", "dining"] },
  { slug: "aether-cape-town-winelands", name: "Aether Cape Town Winelands", brand: A, region: "africa-indian-ocean", city: "Stellenbosch", country: "South Africa", fromCents: 23000, star: 5, rooms: 74, opened: 2020, img: "photo-1501854140801-50d01698950b", blurb: "Seventy-four rooms among the vines, with a rooftop braai and a very long wine list.", tags: ["wine", "design", "romance", "golf"] },

  /* ---- Oceania ---- */
  { slug: "ultra-sydney-harbour", name: "Ultra Sydney Harbour", brand: H, region: "oceania", city: "Sydney", country: "Australia", fromCents: 46000, star: 5, rooms: 288, opened: 2013, img: "photo-1533050487297-09b450131914", blurb: "Circular Quay, a rooftop infinity pool, and the best ferry staff in the group.", tags: ["city", "view", "spa", "dining"] },
  { slug: "ultra-fiji-mamanuca", name: "Ultra Fiji Mamanuca", brand: R, region: "oceania", city: "Mamanuca Islands", country: "Fiji", fromCents: 74000, star: 5, rooms: 132, opened: 2017, img: "photo-1544551763-77ef2d0cfc6c", blurb: "An island resort across a private reef, with a 6-star dive team on the jetty.", tags: ["beach", "family", "spa", "reef", "kids"], highlight: true },
  { slug: "aether-melbourne-laneways", name: "Aether Melbourne Laneways", brand: A, region: "oceania", city: "Melbourne", country: "Australia", fromCents: 21000, star: 5, rooms: 92, opened: 2022, img: "photo-1519823551278-64ac92734fb1", blurb: "A laneway warehouse opposite Queen Victoria Market. 92 rooms, a coffee roastery downstairs.", tags: ["design", "city", "dining"] },
];

/* --------------------------------------------------------------------------
   Room types — one property's inventory, used by the detail template
   -------------------------------------------------------------------------- */

export const ROOM_TYPES = [
  { slug: "deluxe-room", name: "Deluxe Room", sqm: 45, view: "City or Garden View", bed: "King or Twin", maxGuests: 2, fromCents: 0, icon: "area", blurb: "The standard Ultra room, and a very good one: a proper desk, a deep bath, blackout blinds that work." },
  { slug: "premium-room", name: "Premium Room", sqm: 52, view: "Aspect View", bed: "King", maxGuests: 3, fromCents: 4500, icon: "view", blurb: "A corner on a higher floor, with a window seat and the view you came for." },
  { slug: "club-room", name: "Club Room", sqm: 62, view: "Prime View", bed: "King or Twin", maxGuests: 3, fromCents: 12000, icon: "star", blurb: "Club Lounge access on the top floor, with an all-day bar and a twice-daily housekeeping turn." },
  { slug: "family-suite", name: "Family Suite", sqm: 78, view: "Aspect View", bed: "King + two singles", maxGuests: 4, fromCents: 21000, icon: "kids", blurb: "A separate room for the children, a bath that takes four, and a real dining table for six." },
  { slug: "connecting-suites", name: "Connecting Suites", sqm: 110, view: "City or Garden View", bed: "Two kings", maxGuests: 6, fromCents: 38000, icon: "connect", blurb: "Two rooms joined by a door, for families and teams who want one space but two bedrooms." },
  { slug: "ultra-suite", name: "Ultra Suite", sqm: 140, view: "Signature View", bed: "King + sofa bed", maxGuests: 4, fromCents: 65000, icon: "star", blurb: "The best room in the house: separate living and dining, a terrace, and a dedicated host." },
  { slug: "panorama-villa", name: "Panorama Villa", sqm: 260, view: "Uninterrupted View", bed: "Two kings", maxGuests: 6, fromCents: 120000, icon: "pool", blurb: "A private villa with its own plunge pool, terrace and resident host. Reservations open ninety days ahead." },
];

/* --------------------------------------------------------------------------
   Ultra Circle — loyalty
   -------------------------------------------------------------------------- */

export const TIERS = [
  {
    slug: "silver",
    name: "Silver",
    threshold: "Join free",
    img: "photo-1507003211169-0a1dd7228f2d",
    blurb: "Where everyone starts, and it costs nothing to stay here.",
    earn: "10 Ultra Points per PHP 1 spent on stays, dining and spa",
    perks: ["Member-exclusive rates on direct bookings", "Welcome drink on arrival", "Free cancellation up to 24 hours before arrival", "Points earned on everything, including dining"],
    accent: false,
  },
  {
    slug: "gold",
    name: "Gold",
    threshold: "10 nights or 15,000 points a year",
    img: "photo-1533050487297-09b450131914",
    blurb: "For the two or three trips a year that become a habit.",
    earn: "15 Ultra Points per PHP 1",
    perks: ["Everything in Silver", "Breakfast included on every stay, every brand", "Guaranteed room upgrade when one is available", "Late checkout until 4pm, confirmed at booking", "4pm lounge access on Ultra Hotels and Resorts"],
    accent: true,
  },
  {
    slug: "platinum",
    name: "Platinum",
    threshold: "25 nights or 50,000 points a year",
    img: "photo-1582719478250-c89cae4dc85b",
    blurb: "The tier people tell their friends about.",
    earn: "20 Ultra Points per PHP 1",
    perks: ["Everything in Gold", "Guaranteed 4pm checkout, room or not", "Full Club Lounge access, unlimited guests", "One free night every year, on us, at any Ultra property", "Annual health check and two spa treatments a year", "Dedicated 24-hour member line"],
    accent: true,
  },
  {
    slug: "black",
    name: "Black",
    threshold: "By invitation, 50 nights or 100,000 points",
    img: "photo-1590490360182-c33d57733427",
    blurb: "Our top one hundredth of a percent. Roughly 400 members worldwide.",
    earn: "30 Ultra Points per PHP 1",
    perks: ["Everything in Platinum", "A named Ultra Circle host at every property", "Unlimited free night certificates", "Guaranteed suite upgrade on arrival", "Airport transfer and fast-track immigration coordination", "Unlimited guest privileges to share, with no cap", "Access to Aether and Pulse preview nights"],
    accent: true,
  },
];

export const LOYALTY_BENEFITS = [
  { title: "Member exclusive rates", text: "A rate we only publish to Ultra Circle members, with a rate-parity guarantee against every public channel.", icon: "tag" },
  { title: "Mobile check-in & out", text: "Skip the desk entirely. Your room key is in the app from 24 hours before arrival.", icon: "key" },
  { title: "Children eat free", text: "Breakfast and dinner, every day of the stay, for children under twelve at any Ultra property.", icon: "kids" },
  { title: "Earn free nights", text: "Points on stays, dining, spa and experiences — and Black members a free night every year.", icon: "star" },
];

export const APP_FEATURES = [
  { title: "Book stays & dining", text: "Every property, every room, and every table in the group — in one place, with direct rates applied automatically." },
  { title: "Pay your way", text: "Cash, card or Ultra Points, mixed freely across a single stay. Use points for the room and cash for the dinner." },
  { title: "Mobile check-in", text: "Check in from your phone at the gate. Digital key, express checkout, and your folio before you leave the room." },
  { title: "Member-only deals", text: "Offers that only exist in the app — flash rates, upgrade windows, and last-minute tables across the collection." },
];

/* --------------------------------------------------------------------------
   Dining — a sample of the global collection
   -------------------------------------------------------------------------- */

export const DINING = [
  { slug: "the-salt-cellar", name: "The Salt Cellar", property: "Ultra Mactan Bay", city: "Philippines", group: "restaurants", cuisine: "Coastal Filipino", hours: "18:00 – 22:30", dress: "Smart casual", seats: 120, img: "photo-1414235077428-338989a2e8c0", blurb: "The reef's own supply chain, plated with restraint.", long: "The flagship dining room at Ultra Mactan Bay works almost entirely from what lands on the sand that morning, with a short menu that changes when the boats do.", memberOffer: "25% off the tasting menu for new Ultra Circle members", reserve: true },
  { slug: "kuro", name: "Kuro", property: "Aether Bangkok Riverside", city: "Thailand", group: "restaurants", cuisine: "Kaiseki", hours: "19:00 – 23:00", dress: "Smart casual", seats: 42, img: "photo-1520250497591-112f2f40a3f4", blurb: "A nine-course counter menu, eighteen seats, one seating.", long: "A reservation-only counter at Aether Bangkok, running a nine-course progression that changes with the market each fortnight.", memberOffer: "Complimentary pairing of nine courses", reserve: true },
  { slug: "all-day-at-eight", name: "All Day at Eight", property: "Pulse Bengaluru Tech Park", city: "India", group: "restaurants", cuisine: "All-day, modern Indian", hours: "06:30 – 23:30", dress: "Come as you are", seats: 180, img: "photo-1466978913421-dad2ebd01d17", blurb: "Built for people who eat at inconvenient hours.", long: "A single kitchen running from a 6:30am breakfast through to a 11:30pm supper, because half the people staying at a Pulse hotel work strange hours.", memberOffer: "15% off all-day dining", reserve: true },
  { slug: "ember-and-oak", name: "Ember & Oak", property: "Ultra Napa Valley Estate", city: "United States", group: "restaurants", cuisine: "Wood-fire Californian", hours: "17:00 – 22:00", dress: "Smart casual", seats: 96, img: "photo-1559339352-11d035aa65de", blurb: "Everything cooked over vine cuttings from the estate's own blocks.", long: "The centrepiece of Ultra Napa Valley Estate: a wood-fired kitchen, a serious cellar, and the harvest table when the picking is done.", memberOffer: "Complimentary vineyard tour with any reservation", reserve: true },
  { slug: "the-mezzanine", name: "The Mezzanine", property: "Ultra Vienna Belvedere", city: "Austria", group: "restaurants", cuisine: "Modern Viennese", hours: "12:00 – 23:00", dress: "Smart casual", seats: 140, img: "photo-1552566626-52f8b828add9", blurb: "A palatial room doing contemporary Austrian very well.", long: "Under the original 1904 skylights at Ultra Vienna Belvedere, with a menu that respects the building's Viennese bones without getting precious about them.", memberOffer: "Complimentary coffee and cake, daily, 14:00 – 17:00", reserve: true },
  { slug: "long-bar", name: "Long Bar", property: "Aether Amsterdam Canal House", city: "Netherlands", group: "bars", cuisine: "Cocktails, natural wine", hours: "16:00 – 02:00", dress: "Relaxed", seats: 54, img: "photo-1470337458703-46ad1756a187", blurb: "No menu, no bad nights, an excellent amaro cabinet.", long: "The social heart of Aether Amsterdam: a long bar in a converted warehouse, pouring natural wine and very serious cocktails until two in the morning.", memberOffer: "Two-for-one on house cocktails, 18:00 – 20:00", reserve: false },
  { slug: "sky-lounge-31", name: "Sky Lounge 31", property: "Ultra Manila Makati", city: "Philippines", group: "bars", cuisine: "Cocktails & small plates", hours: "16:00 – 01:00", dress: "Smart casual", seats: 88, img: "photo-1517093157656-b9eccef91cb1", blurb: "Thirty-one floors up, with the whole city laid out below.", long: "A circular bar on the 31st floor of Ultra Manila Makati, with a view that solves the sunset problem on your behalf.", memberOffer: "Free entry, always, for Ultra Circle members", reserve: false },
  { slug: "the-cellar", name: "The Cellar", property: "Ultra Manila Makati", city: "Philippines", group: "bars", cuisine: "Wine & single malts", hours: "18:00 – 02:00", dress: "Smart casual", seats: 40, img: "photo-1517093157656-b9eccef91cb1", blurb: "Over 900 labels, weighted towards Burgundy and the Douro.", long: "A temperature-controlled cellar beneath Ultra Manila Makati, with a sommelier on hand and tastings for up to ten guests on Tuesday evenings.", memberOffer: "Complimentary guided tasting, members only", reserve: true },
];

/* --------------------------------------------------------------------------
   Business travel
   -------------------------------------------------------------------------- */

export const BUSINESS_BENEFITS = [
  { title: "Up to 18% off flexible rates", text: "Booked direct, cancellable up to 24 hours before arrival, at every Ultra Hotel, Aether and Pulse property worldwide." },
  { title: "Free Wi-Fi, always", text: "Unlimited high-speed Wi-Fi in every room and every meeting room, with a wired option at the desk in Ultra Hotels." },
  { title: "Points on everything", text: "Earn Ultra Points on the room, the dining spend and the airport transfer — not just the room rate." },
  { title: "Milestone rewards", text: "Tenth, twentieth and fiftieth stay in a rolling twelve-month period each earn a reward of your choosing, from an upgrade to a free night." },
  { title: "Invoicing that works", text: "Consolidated monthly invoicing, purchase-order references on every folio, and VAT or GST paperwork filed correctly the first time." },
  { title: "Late checkout, on us", text: "One o'clock checkout as standard on any flexible business rate, and we will always try for later if the house allows it." },
];

export const BUSINESS_CONNECTIVITY = [
  { title: "Unlimited high-speed Wi-Fi", text: "In every room, every meeting room and every public space, at no charge and with no device cap. Video calls do not drop." },
  { title: "Wired at the desk", text: "A wired connection and a power outlet are available at the front desk in Ultra Hotels, for the traveller who prefers a cable." },
  { title: "Boardroom bandwidth", text: "Symmetrical fibre in every meeting room, with hard-wired presenter drops and screen sharing that does not need an app." },
  { title: "One number to call", text: "A single 24-hour line for the duty manager, reachable from the room, so a technical problem never waits for the morning." },
  { title: "Safe to stream", text: "Traffic shaping applied to keep voice and video clear, with a separate clean network for anything you would not route through a hotel." },
  { title: "Charging, everywhere", text: "USB-C and standard sockets at every desk and in every room, because the adaptor is never the thing you want to be hunting for." },
];

export const BUSINESS_TIERS = [
  { name: "Registered", note: "Free to join", perks: "Flexible corporate rates, invoicing, Wi-Fi, points" },
  { name: "Partner", note: "By agreement", perks: "Everything in Registered, plus negotiated volume rates and a named account manager" },
  { name: "Global", note: "20+ rooms a night", perks: "Everything in Partner, plus airport transfers, Club Lounge access and priority event capacity" },
];

/* --------------------------------------------------------------------------
   Meetings & events
   -------------------------------------------------------------------------- */

export const MEETING_FACTS = [
  // No "+" suffix: 588 is the exact count, and the chat copy used to quote a
  // different number entirely (520) for the same figure.
  { value: GROUP.meetingSpaces, suffix: "", label: "Meeting rooms group-wide" },
  // Matched to WEDDING_VENUES below — the largest ballroom seats 480. This was
  // 32000 with no unit, which rendered as a bare "32000".
  { value: 480, suffix: "", label: "Largest ballroom, seated" },
  { value: 94, suffix: "%", label: "Of rooms bookable online" },
  { value: 48, suffix: " hr", label: "Typical quote turnaround" },
];

export const MEETING_TYPES = [
  { title: "Conferences & congresses", text: "Plenary halls, breakout capacity, and technical production run in-house by people who have done it four hundred times.", img: "photo-1464366400600-7168b8af9bc3" },
  { title: "Team building", text: "From a reef biology challenge to a vineyard harvest, off-site programmes built around whatever the property actually does.", img: "photo-1535131749006-b7f58c99034b" },
  { title: "Board & executive", text: "Discreet rooms, secure connectivity, and a service model that assumes nothing leaves the building.", img: "photo-1522708323590-d24dbb6b0267" },
  { title: "Private dining", text: "Restaurants and terraces hired in their entirety, with menus written for the occasion rather than pulled from the à la carte.", img: "photo-1517248135467-4c7edcad34c4" },
];

/* --------------------------------------------------------------------------
   Weddings
   -------------------------------------------------------------------------- */

export const WEDDING_PACKAGES = [
  { name: "Intimate", from: "PHP 8,000", guests: "Up to 40", img: "photo-1519741497674-611481863552", points: ["Ceremony on the terrace or lawn", "A dedicated wedding coordinator", "Three-course dinner with paired wine", "Nightly photography, eight hours"] },
  { name: "Signature", from: "PHP 24,000", guests: "40 – 180", img: "photo-1600880292203-757bb62b4baf", points: ["Everything in Intimate", "Garden or beach ceremony setting", "Five-course dinner, printed menus", "Evening band and late bar", "Bridal suite the night before"] },
  { name: "Grand", from: "PHP 60,000", guests: "180 – 600", img: "photo-1464366400600-7168b8af9bc3", points: ["Everything in Signature", "Full property buy-out option", "Fireworks and live musicians", "Two-day catering, three-day photography", "Guest-room block and airport transfer desk"] },
];

export const WEDDING_VENUES = [
  { name: "The Beach Lawn", property: "Ultra Mactan Bay", capacity: "Up to 620 seated", img: "photo-1507525428034-b723cf961d3e" },
  { name: "The Garden Pavilion", property: "Ultra Kyoto Garden", capacity: "Up to 280 seated", img: "photo-1470071459604-3b5ec3a7fe05" },
  { name: "The Caldera Terrace", property: "Ultra Santorini Caldera", capacity: "Up to 120 seated", img: "photo-1502005229762-cf1b2da7c5d6" },
  { name: "The Grand Ocean Ballroom", property: "Ultra Doha Pearl", capacity: "Up to 480 seated", img: "photo-1549294413-26f195200c16" },
  { name: "The Vineyard Lawn", property: "Ultra Napa Valley Estate", capacity: "Up to 300 seated", img: "photo-1501854140801-50d01698950b" },
  { name: "The Atrium", property: "Aether Amsterdam Canal House", capacity: "Up to 90 seated", img: "photo-1615874959474-d609969a20ed" },
];

/* --------------------------------------------------------------------------
   Testimonials, awards, stats
   -------------------------------------------------------------------------- */

export const TESTIMONIALS = [
  { quote: "I have booked eleven stays through Ultra Circle this year and the rate has beaten every channel every single time. That is not a promise — it is a spreadsheet.", name: "Daniel R.", from: "Manila", stay: "Ultra Circle Black member", stars: 5 },
  { quote: "We put 300 people in the Grand Ocean Ballroom and they did not look once at the programme. Doors, catering, AV, all of it just happened.", name: "Amira S.", from: "Dubai", stay: "Meetings & Events", stars: 5 },
  { quote: "Aether Bangkok is the only hotel I have stayed in where the bar is genuinely as good as the restaurant. The neighbourhood rates made it work.", name: "Tom W.", from: "London", stay: "Aether Bangkok Riverside", stars: 5 },
  { quote: "Two kids, a long-haul flight, and a room that actually slept all four of us comfortably. The kids ate free all week. It changed the trip.", name: "The Lindqvist family", from: "Stockholm", stay: "Ultra Mactan Bay", stars: 5 },
  { quote: "Eleven days of meetings and our consolidated invoice matched our PO to the cent. I have never managed that at a hotel before.", name: "Priya N.", from: "Mumbai", stay: "Pulse Bengaluru Tech Park", stars: 5 },
];

export const AWARDS = [
  { name: "Condé Nast", note: "Reader's Choice, 2026" },
  { name: "Michelin", note: "Key distinction, 12 guides" },
  { name: "Forbes", note: "Five-Star, 2026" },
  { name: "Travel + Leisure", note: "World's Best Hotels" },
  { name: "Green Globe", note: "Gold certified, 9 properties" },
];

export const STATS = [
  { value: 112, suffix: "", label: "Hotels & Resorts" },
  { value: 78, suffix: "", label: "Destinations" },
  { value: 540, suffix: "", label: "Restaurants & Bars" },
  { value: 41800, suffix: "", label: "Rooms" },
];

export const SUSTAINABILITY = [
  { title: "Carbon, measured not promised", text: "Scope 1 and 2 emissions are published per property every year, including the properties where the number went up." },
  { title: "Local, not local-sourced", text: "We set a procurement target of 70% regional by 2030, and publish what we actually hit rather than what we aimed for." },
  { title: "Water that is not someone's problem", text: "Rainwater harvesting, greywater reuse and reef-safe laundry chemistry are standard at every resort, not upgrades." },
  { title: "Keeping the reef", text: "Nineteen of our resort properties sit on or beside a protected reef, and each funds its local management partner directly." },
];

/* --------------------------------------------------------------------------
   Filters
   -------------------------------------------------------------------------- */

export const PROPERTY_FILTERS = [
  { id: "all", name: "All" },
  { id: "ultra-hotels", name: "Ultra Hotels" },
  { id: "ultra-resorts", name: "Ultra Resorts" },
  { id: "aether-by-ultra", name: "Aether" },
  { id: "pulse-by-ultra", name: "Pulse" },
  { id: "beach", name: "Beach & Reef" },
  { id: "spa", name: "Spa & Wellness" },
  { id: "family", name: "Family" },
  { id: "business", name: "Business" },
  { id: "romance", name: "Weddings & Romance" },
];

export const GALLERY = [
  { img: "photo-1507525428034-b723cf961d3e", cat: "rooms", title: "Ultra Mactan Bay — the main beach", ratio: "3x2" },
  { img: "photo-1414235077428-338989a2e8c0", cat: "dining", title: "The Salt Cellar, Ultra Mactan Bay", ratio: "3x4" },
  { img: "photo-1445019980597-93fa8acb246c", cat: "lobby", title: "Ultra Manila Makati — the lobby", ratio: "3x2" },
  { img: "photo-1590490360182-c33d57733427", cat: "spa", title: "Ultra Spa, signature treatment room", ratio: "3x2" },
  { img: "photo-1544551763-46a013bb70d5", cat: "reef", title: "The sanctuary, fifteen minutes out", ratio: "1x1" },
  { img: "photo-1551882547-ff40c63fe5fa", cat: "pool", title: "Pulse Bengaluru — rooftop pool", ratio: "16x9" },
  { img: "photo-1502005229762-cf1b2da7c5d6", cat: "rooms", title: "Ultra Santorini Caldera — cave suites", ratio: "3x2" },
  { img: "photo-1466978913421-dad2ebd01d17", cat: "dining", title: "All Day at Eight, Pulse Bengaluru", ratio: "3x4" },
  { img: "photo-1470071459604-3b5ec3a7fe05", cat: "garden", title: "Ultra Kyoto Garden — the maples", ratio: "1x1" },
  { img: "photo-1519741497674-611481863552", cat: "weddings", title: "A garden ceremony, Kyoto", ratio: "3x2" },
  { img: "photo-1533777857889-4be7c70b33f7", cat: "lobby", title: "Pulse Berlin Mitte — workspace floor", ratio: "3x2" },
  { img: "photo-1517457373958-b7bdd4587205", cat: "design", title: "Aether Brooklyn Mill — the lobby", ratio: "3x2" },
  { img: "photo-1520250497591-112f2f40a3f4", cat: "dining", title: "Kuro, Aether Bangkok", ratio: "3x2" },
  { img: "photo-1470337458703-46ad1756a187", cat: "dining", title: "Long Bar, Aether Amsterdam", ratio: "1x1" },
  { img: "photo-1505118380757-91f5f5632de0", cat: "pool", title: "Ultra Honolulu Waikiki", ratio: "3x2" },
  { img: "photo-1512699355324-f07e3106dae5", cat: "reef", title: "The reef flat at midday", ratio: "3x4" },
  { img: "photo-1544551763-77ef2d0cfc6c", cat: "reef", title: "Ultra Fiji — the private reef", ratio: "3x2" },
  { img: "photo-1501854140801-50d01698950b", cat: "garden", title: "Ultra Napa Valley Estate — the vines", ratio: "3x4" },
  { img: "photo-1512917774080-9991f1c4c750", cat: "lobby", title: "Aether Beirut Downtown", ratio: "3x2" },
  { img: "photo-1600880292203-757bb62b4baf", cat: "weddings", title: "A terrace reception, Santorini", ratio: "3x4" },
  { img: "photo-1426604966848-d7adac402bff", cat: "garden", title: "The garden walk, Kyoto", ratio: "3x2" },
  { img: "photo-1533050487297-09b450131914", cat: "lobby", title: "Ultra Sydney Harbour", ratio: "16x9" },
  { img: "photo-1559339352-11d035aa65de", cat: "dining", title: "Ember & Oak, Napa", ratio: "3x2" },
  { img: "photo-1519823551278-64ac92734fb1", cat: "design", title: "Aether Melbourne Laneways", ratio: "3x2" },
];

export const GALLERY_CATS = [
  { id: "all", name: "All" },
  { id: "rooms", name: "Rooms & Suites" },
  { id: "dining", name: "Dining & Bars" },
  { id: "lobby", name: "Lobbies" },
  { id: "pool", name: "Pools" },
  { id: "spa", name: "Spa" },
  { id: "reef", name: "Reef & Sea" },
  { id: "garden", name: "Gardens" },
  { id: "weddings", name: "Weddings" },
  { id: "design", name: "Design" },
];

export const CONTACT_TOPICS = [
  { id: "reservation", label: "A new reservation" },
  { id: "existing", label: "An existing booking" },
  { id: "corporate", label: "Corporate rates or a group booking" },
  { id: "events", label: "Meetings and events" },
  { id: "weddings", label: "Weddings and celebrations" },
  { id: "other", label: "Something else" },
];

export const FAQS = [
  { q: "Is the direct booking rate genuinely the best?", a: "We guarantee it. If you find a lower public rate for the same room, dates and terms within 24 hours of booking, we match it and add 10% Ultra Points to your stay." },
  { q: "Do children stay and eat free?", a: "Children under six stay and eat free at every Ultra property. Ultra Circle members get the same for children under twelve, at any rate, including promotional rates." },
  { q: "What is the cancellation policy?", a: "Flexible rates can be cancelled free of charge up to 24 hours before arrival. Advance-purchase rates are non-refundable but may be moved once, free of charge, up to seven days before arrival." },
  { q: "How do I join Ultra Circle?", a: "It is free and takes about ninety seconds. Join in the app, on this site, or at any front desk on arrival. Silver is automatic; Gold and above are recognised on your second qualifying stay." },
  { q: "Do you price-match other sites?", a: "We match any lower public rate for the identical room, dates and cancellation terms. Flexible rates booked direct also carry our best-available-rate guarantee." },
  { q: "Can I hold a room without paying?", a: "Yes. Rooms can be held for 48 hours at no charge through the app or by calling reservations, subject to the property's availability." },
];

/* --------------------------------------------------------------------------
   Lookups
   -------------------------------------------------------------------------- */

export const propertyBySlug = (slug) => PROPERTIES.find((p) => p.slug === slug) || null;
export const brandBySlug = (slug) => BRANDS.find((b) => b.slug === slug) || null;
export const brandName = (slug) => brandBySlug(slug)?.name || "Ultra Hotel";
export const diningBySlug = (slug) => DINING.find((d) => d.slug === slug) || null;
export const regionOf = (id) => REGIONS.find((r) => r.id === id) || null;

/** The six properties the home page leads with. */
export const FEATURED_PROPERTIES = PROPERTIES.filter((p) => p.highlight);
