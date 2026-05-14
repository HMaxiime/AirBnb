import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env["DATABASE_URL"] as string,
});
const prisma = new PrismaClient({ adapter });

// ─── Unsplash photo helpers ────────────────────────────────────────────────────
const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=80`;

const PHOTOS = {
  bali:      u("1566073771259-6a8506099945"),
  nyc:       u("1522708323590-d24dbb6b0267"),
  miami:     u("1613490493576-7fde63acd811"),
  paris:     u("1502672260266-1c1ef2d93688"),
  tuscany:   u("1570129477492-45e003008e0c"),
  chamonix:  u("1518780664697-55e3ad937233"),
  maldives:  u("1520250497591-112f2f40a3f4"),
  brooklyn:  u("1484154218962-a197022b5858"),
  la:        u("1512917774080-9991f1c4c750"),
  tahoe:     u("1506905925346-21bda4d32df4"),
  provence:  u("1564013799919-ab600027ffc6"),
  hawaii:    u("1499793983690-e29da59ef1c2"),
};

async function main() {
  console.log("🌱 Seeding database…");

  // ── Wipe in dependency order ────────────────────────────────────────────────
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.listingPhoto.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.user.deleteMany();
  console.log("🗑️  Cleared existing data");

  // ── Users ───────────────────────────────────────────────────────────────────
  const sarah = await prisma.user.create({
    data: {
      name: "Sarah Monroe",
      email: "sarah@example.com",
      username: "sarah_host",
      password: "$2b$10$placeholderHashedPassword1",
      phone: "+1 555 010 0001",
      role: "HOST",
    },
  });

  const marco = await prisma.user.create({
    data: {
      name: "Marco Rossi",
      email: "marco@example.com",
      username: "marco_host",
      password: "$2b$10$placeholderHashedPassword2",
      phone: "+39 333 000 0001",
      role: "HOST",
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      username: "admin",
      password: "$2b$10$placeholderHashedPassword3",
      role: "ADMIN",
    },
  });

  const alice = await prisma.user.create({
    data: {
      name: "Alice Chen",
      email: "alice@example.com",
      username: "alice_guest",
      password: "$2b$10$placeholderHashedPassword4",
      phone: "+1 555 020 0001",
      role: "GUEST",
    },
  });

  const james = await prisma.user.create({
    data: {
      name: "James Okafor",
      email: "james@example.com",
      username: "james_guest",
      password: "$2b$10$placeholderHashedPassword5",
      phone: "+44 7700 900 001",
      role: "GUEST",
    },
  });

  const yuki = await prisma.user.create({
    data: {
      name: "Yuki Tanaka",
      email: "yuki@example.com",
      username: "yuki_guest",
      password: "$2b$10$placeholderHashedPassword6",
      phone: "+81 90 0000 0001",
      role: "GUEST",
    },
  });

  console.log("👤 Users created");

  // ── Listings ─────────────────────────────────────────────────────────────────
  const beachVilla = await prisma.listing.create({
    data: {
      title: "Beachfront Villa with Infinity Pool",
      description:
        "Wake up to the sound of waves in this stunning beachfront villa. Features a private infinity pool, open-plan living spaces, and panoramic ocean views from every room. Perfect for a luxury getaway.",
      price: 285,
      location: "Bali, Indonesia",
      guests: 6,
      type: "HOUSE",
      amenities: ["WiFi", "Infinity pool", "Air conditioning", "Kitchen", "Beach access", "Parking", "BBQ"],
      hostId: sarah.id,
      photos: {
        create: [
          { url: PHOTOS.bali,     publicId: "bali_1"     },
          { url: PHOTOS.maldives, publicId: "bali_2"     },
          { url: PHOTOS.hawaii,   publicId: "bali_3"     },
          { url: PHOTOS.miami,    publicId: "bali_4"     },
        ],
      },
    },
  });

  const nycLoft = await prisma.listing.create({
    data: {
      title: "Modern Downtown Loft",
      description:
        "Experience Manhattan living at its finest. Floor-to-ceiling windows, designer furnishings, and a rooftop terrace with skyline views. Walking distance to top restaurants and attractions.",
      price: 325,
      location: "New York, USA",
      guests: 4,
      type: "APARTMENT",
      amenities: ["WiFi", "Rooftop terrace", "Gym", "Doorman", "Air conditioning", "Smart TV"],
      hostId: sarah.id,
      photos: {
        create: [
          { url: PHOTOS.nyc,      publicId: "nyc_1" },
          { url: PHOTOS.brooklyn, publicId: "nyc_2" },
          { url: PHOTOS.la,       publicId: "nyc_3" },
          { url: PHOTOS.paris,    publicId: "nyc_4" },
        ],
      },
    },
  });

  const tuscanEstate = await prisma.listing.create({
    data: {
      title: "Tuscany Countryside Estate",
      description:
        "Immerse yourself in 500 years of history at this lovingly restored Tuscan estate. Rolling vineyards, olive groves, private pool, and authentic Italian charm throughout.",
      price: 215,
      location: "Tuscany, Italy",
      guests: 8,
      type: "HOUSE",
      amenities: ["WiFi", "Pool", "Kitchen", "Vineyard", "Olive grove", "Parking", "BBQ", "Garden"],
      hostId: marco.id,
      photos: {
        create: [
          { url: PHOTOS.tuscany,  publicId: "tuscany_1" },
          { url: PHOTOS.provence, publicId: "tuscany_2" },
          { url: PHOTOS.chamonix, publicId: "tuscany_3" },
        ],
      },
    },
  });

  const parisApt = await prisma.listing.create({
    data: {
      title: "Classic Haussmann Apartment",
      description:
        "Classic Haussmann elegance in the heart of Paris. High ceilings, herringbone floors, and a balcony overlooking a quiet courtyard. Moments from the Marais and top museums.",
      price: 195,
      location: "Paris, France",
      guests: 3,
      type: "APARTMENT",
      amenities: ["WiFi", "Balcony", "Kitchen", "Washing machine", "Air conditioning", "Elevator"],
      hostId: marco.id,
      photos: {
        create: [
          { url: PHOTOS.paris,    publicId: "paris_1" },
          { url: PHOTOS.nyc,      publicId: "paris_2" },
          { url: PHOTOS.brooklyn, publicId: "paris_3" },
        ],
      },
    },
  });

  const maldivesBungalow = await prisma.listing.create({
    data: {
      title: "Overwater Bungalow",
      description:
        "Float above the turquoise lagoon in a private overwater bungalow. Direct ladder access to the reef, stunning sunsets over the Indian Ocean, and full butler service included.",
      price: 650,
      location: "Maldives",
      guests: 2,
      type: "OTHER",
      amenities: ["WiFi", "Butler service", "Snorkeling gear", "Kayak", "Breakfast included", "Air conditioning", "Private deck"],
      hostId: sarah.id,
      photos: {
        create: [
          { url: PHOTOS.maldives, publicId: "maldives_1" },
          { url: PHOTOS.bali,     publicId: "maldives_2" },
          { url: PHOTOS.hawaii,   publicId: "maldives_3" },
        ],
      },
    },
  });

  const alpineChalet = await prisma.listing.create({
    data: {
      title: "Ski-in Ski-out Alpine Chalet",
      description:
        "Ski-in, ski-out luxury at the foot of Mont Blanc. A true alpine retreat with a private sauna, hot tub, and breathtaking mountain views. Sleeps up to 10.",
      price: 490,
      location: "Chamonix, France",
      guests: 10,
      type: "HOUSE",
      amenities: ["WiFi", "Sauna", "Hot tub", "Ski storage", "Fireplace", "Kitchen", "Parking"],
      hostId: marco.id,
      photos: {
        create: [
          { url: PHOTOS.chamonix, publicId: "chamonix_1" },
          { url: PHOTOS.tuscany,  publicId: "chamonix_2" },
          { url: PHOTOS.tahoe,    publicId: "chamonix_3" },
        ],
      },
    },
  });

  const brooklynRoom = await prisma.listing.create({
    data: {
      title: "Cozy Private Room in Brooklyn",
      description:
        "Bright private room in a stylish Williamsburg townhouse. Shared kitchen and living area with a friendly host. Walking distance to L train, cafés, and nightlife.",
      price: 75,
      location: "Brooklyn, New York, USA",
      guests: 1,
      type: "ROOM",
      amenities: ["WiFi", "Kitchen access", "Laundry", "Smart TV", "Workspace"],
      hostId: sarah.id,
      photos: {
        create: [
          { url: PHOTOS.brooklyn, publicId: "brooklyn_1" },
          { url: PHOTOS.nyc,      publicId: "brooklyn_2" },
        ],
      },
    },
  });

  const malibuHouse = await prisma.listing.create({
    data: {
      title: "Modernist Malibu Hillside House",
      description:
        "A modernist masterpiece perched on a Malibu hillside. Infinity pool, open-plan architecture, home cinema, and sweeping Pacific Ocean views from every room.",
      price: 520,
      location: "Malibu, California, USA",
      guests: 6,
      type: "HOUSE",
      amenities: ["WiFi", "Infinity pool", "Home cinema", "Gym", "Ocean view", "Kitchen", "Parking", "BBQ"],
      hostId: marco.id,
      photos: {
        create: [
          { url: PHOTOS.la,       publicId: "malibu_1" },
          { url: PHOTOS.miami,    publicId: "malibu_2" },
          { url: PHOTOS.hawaii,   publicId: "malibu_3" },
          { url: PHOTOS.bali,     publicId: "malibu_4" },
        ],
      },
    },
  });

  console.log("🏠 Listings + photos created");

  // ── Bookings ─────────────────────────────────────────────────────────────────
  await prisma.booking.createMany({
    data: [
      // Confirmed
      {
        checkIn:    new Date("2025-06-10"),
        checkOut:   new Date("2025-06-17"),
        totalPrice: beachVilla.price * 7,
        guestId:    alice.id,
        listingId:  beachVilla.id,
        status:     "CONFIRMED",
      },
      {
        checkIn:    new Date("2025-07-01"),
        checkOut:   new Date("2025-07-05"),
        totalPrice: nycLoft.price * 4,
        guestId:    james.id,
        listingId:  nycLoft.id,
        status:     "CONFIRMED",
      },
      {
        checkIn:    new Date("2025-08-14"),
        checkOut:   new Date("2025-08-21"),
        totalPrice: tuscanEstate.price * 7,
        guestId:    yuki.id,
        listingId:  tuscanEstate.id,
        status:     "CONFIRMED",
      },
      {
        checkIn:    new Date("2025-09-05"),
        checkOut:   new Date("2025-09-10"),
        totalPrice: parisApt.price * 5,
        guestId:    alice.id,
        listingId:  parisApt.id,
        status:     "CONFIRMED",
      },
      // Pending
      {
        checkIn:    new Date("2025-07-20"),
        checkOut:   new Date("2025-07-27"),
        totalPrice: maldivesBungalow.price * 7,
        guestId:    james.id,
        listingId:  maldivesBungalow.id,
        status:     "PENDING",
      },
      {
        checkIn:    new Date("2025-12-22"),
        checkOut:   new Date("2025-12-29"),
        totalPrice: alpineChalet.price * 7,
        guestId:    yuki.id,
        listingId:  alpineChalet.id,
        status:     "PENDING",
      },
      // Cancelled
      {
        checkIn:    new Date("2025-06-01"),
        checkOut:   new Date("2025-06-04"),
        totalPrice: brooklynRoom.price * 3,
        guestId:    alice.id,
        listingId:  brooklynRoom.id,
        status:     "CANCELLED",
      },
    ],
  });

  console.log("📅 Bookings created");

  // ── Reviews ───────────────────────────────────────────────────────────────────
  await prisma.review.createMany({
    data: [
      {
        rating:    5,
        comment:   "Absolutely breathtaking! The ocean views were even better than the photos. The infinity pool and private beach made it the perfect holiday.",
        userId:    alice.id,
        listingId: beachVilla.id,
      },
      {
        rating:    4,
        comment:   "Stunning villa with amazing amenities. A little tricky to find at first but worth every moment once you arrive.",
        userId:    james.id,
        listingId: beachVilla.id,
      },
      {
        rating:    5,
        comment:   "Prime Manhattan location, spotless apartment, and the rooftop views at sunset were incredible. Will book again!",
        userId:    yuki.id,
        listingId: nycLoft.id,
      },
      {
        rating:    5,
        comment:   "A true gem in Tuscany. Sitting on the terrace with a glass of Chianti watching the sun set over the vineyards — pure magic.",
        userId:    alice.id,
        listingId: tuscanEstate.id,
      },
      {
        rating:    4,
        comment:   "Classic Parisian charm. Beautiful apartment, great neighbourhood, easy access to everywhere. Highly recommend.",
        userId:    james.id,
        listingId: parisApt.id,
      },
      {
        rating:    5,
        comment:   "Ski-in ski-out dreams come true. The chalet is luxurious and the sauna after a long day on the slopes is everything.",
        userId:    yuki.id,
        listingId: alpineChalet.id,
      },
      {
        rating:    4,
        comment:   "Great value private room. Host was welcoming, neighbourhood has excellent coffee shops and the L train is two minutes away.",
        userId:    alice.id,
        listingId: brooklynRoom.id,
      },
    ],
  });

  console.log("⭐ Reviews created");
  console.log(`
✅ Seed complete
   Users    : 6  (2 hosts, 3 guests, 1 admin)
   Listings : 8  (3 HOUSE, 2 APARTMENT, 1 ROOM, 1 OTHER + 1 more HOUSE)
   Photos   : ${8 * 3} approx
   Bookings : 7  (4 confirmed, 2 pending, 1 cancelled)
   Reviews  : 7
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
