import { listings as seed } from "../data/listings";

// ── Extended types ────────────────────────────────────────────────────────────

export interface ExtendedListing {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  rating: number;
  superhost: boolean;
  available: boolean;
  availableFrom: string;
  img: string;
  category: "house" | "apartment" | "villa";
  status: "draft" | "pending" | "published" | "rejected";
  hostId: string;
  hostName: string;
  photos?: string[];
}

export interface Booking {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImg: string;
  hostId: string;
  guestId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  pricePerNight: number;
  totalPrice: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: "guest" | "host" | "admin";
  banned: boolean;
  createdAt: string;
}

export type UserRole = "guest" | "host" | "admin";

export interface Review {
  id: string;
  listingId: string;
  guestName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  guestId: string;
  guestName: string;
  hostId: string;
  hostName: string;
  listingId: string;
  listingTitle: string;
  listingImg: string;
  lastMessageAt: string;
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const HOST_ID = "host-1";
const ADMIN_ID = "admin-1";

const descriptions: Record<string, string> = {
  "1": "Wake up to the sound of waves in this stunning beachfront villa. Features a private infinity pool, open-plan living spaces, and panoramic ocean views from every room.",
  "2": "Escape to the mountains in this cozy retreat surrounded by towering pines. Perfect for hiking, skiing, and stargazing around the fire pit.",
  "3": "Experience Manhattan living at its finest. Floor-to-ceiling windows, designer furnishings, and a rooftop terrace with skyline views.",
  "4": "Immerse yourself in 500 years of history at this lovingly restored Tuscan estate. Rolling vineyards, olive groves, and authentic Italian charm.",
  "5": "Your own slice of paradise on Maui's most exclusive shore. Private beach access, lush tropical gardens, and the sound of trade winds.",
  "6": "Ski-in, ski-out luxury at the foot of Mont Blanc. A true alpine retreat with a sauna, hot tub, and breathtaking mountain views.",
  "7": "Float above the turquoise lagoon in a private overwater bungalow. Direct ladder access to the reef and stunning sunsets over the Indian Ocean.",
  "8": "Classic Haussmann elegance in the heart of Paris. High ceilings, herringbone floors, and a balcony overlooking a quiet courtyard.",
  "9": "A modernist masterpiece perched on a Malibu hillside. Infinity pool, open-plan architecture, and sweeping Pacific Ocean views.",
  "10": "Stone farmhouse in the heart of Provence. Lavender fields, a private pool, and a restored barn perfect for al fresco dining.",
  "11": "Industrial-chic penthouse in Williamsburg with exposed brick, original beams, and a wraparound terrace with Manhattan skyline views.",
  "12": "Sun-drenched poolside villa in Miami Beach. Lush tropical landscaping, a heated pool, and a private dock on the Intracoastal Waterway.",
};

function initListings(): ExtendedListing[] {
  return seed.map((l) => ({
    ...l,
    description: descriptions[l.id] ?? "A beautiful place to stay.",
    status: "published" as const,
    hostId: HOST_ID,
    hostName: "Sarah Host",
  }));
}

function initBookings(): Booking[] {
  const listings = initListings();
  const l = (i: number) => listings[i];
  return [
    // Confirmed
    { id: "bk-1",  listingId: l(0).id,  listingTitle: l(0).title,  listingImg: l(0).img,  hostId: HOST_ID, guestId: "g-1",  guestName: "John Guest",      guestEmail: "john@example.com",    guestPhone: "+1 555 010 0001", checkIn: "2025-06-10", checkOut: "2025-06-17", guests: 2, pricePerNight: l(0).price,  totalPrice: l(0).price  * 7, status: "confirmed", createdAt: "2025-05-20T10:00:00Z" },
    { id: "bk-2",  listingId: l(2).id,  listingTitle: l(2).title,  listingImg: l(2).img,  hostId: HOST_ID, guestId: "g-2",  guestName: "Emily Carter",     guestEmail: "emily@example.com",   guestPhone: "+1 555 010 0002", checkIn: "2025-07-01", checkOut: "2025-07-05", guests: 1, pricePerNight: l(2).price,  totalPrice: l(2).price  * 4, status: "confirmed", createdAt: "2025-05-22T14:30:00Z" },
    { id: "bk-6",  listingId: l(5).id,  listingTitle: l(5).title,  listingImg: l(5).img,  hostId: HOST_ID, guestId: "g-6",  guestName: "Pierre Dupont",    guestEmail: "pierre@example.com",  guestPhone: "+33 6 00 00 00 01", checkIn: "2025-12-20", checkOut: "2025-12-27", guests: 2, pricePerNight: l(5).price,  totalPrice: l(5).price  * 7, status: "confirmed", createdAt: "2025-05-10T08:00:00Z" },
    { id: "bk-7",  listingId: l(6).id,  listingTitle: l(6).title,  listingImg: l(6).img,  hostId: HOST_ID, guestId: "g-7",  guestName: "Yuki Tanaka",      guestEmail: "yuki@example.com",    guestPhone: "+81 90 0000 0001",  checkIn: "2025-06-15", checkOut: "2025-06-22", guests: 2, pricePerNight: l(6).price,  totalPrice: l(6).price  * 7, status: "confirmed", createdAt: "2025-04-30T11:20:00Z" },
    { id: "bk-8",  listingId: l(3).id,  listingTitle: l(3).title,  listingImg: l(3).img,  hostId: HOST_ID, guestId: "g-8",  guestName: "Sofia Rossi",      guestEmail: "sofia@example.com",   guestPhone: "+39 333 000 0001",  checkIn: "2025-07-10", checkOut: "2025-07-17", guests: 4, pricePerNight: l(3).price,  totalPrice: l(3).price  * 7, status: "confirmed", createdAt: "2025-05-15T09:45:00Z" },
    { id: "bk-9",  listingId: l(9).id,  listingTitle: l(9).title,  listingImg: l(9).img,  hostId: HOST_ID, guestId: "g-9",  guestName: "Fatima Al-Rashid", guestEmail: "fatima@example.com",  guestPhone: "+971 50 000 0001",  checkIn: "2025-06-28", checkOut: "2025-07-03", guests: 3, pricePerNight: l(9).price,  totalPrice: l(9).price  * 5, status: "confirmed", createdAt: "2025-05-28T13:00:00Z" },
    { id: "bk-10", listingId: l(7).id,  listingTitle: l(7).title,  listingImg: l(7).img,  hostId: HOST_ID, guestId: "g-10", guestName: "Daniel Müller",    guestEmail: "daniel@example.com",  guestPhone: "+49 151 000 0001",  checkIn: "2025-05-28", checkOut: "2025-06-02", guests: 2, pricePerNight: l(7).price,  totalPrice: l(7).price  * 5, status: "confirmed", createdAt: "2025-05-01T07:30:00Z" },
    // Pending
    { id: "bk-3",  listingId: l(4).id,  listingTitle: l(4).title,  listingImg: l(4).img,  hostId: HOST_ID, guestId: "g-3",  guestName: "Marcus Silva",     guestEmail: "marcus@example.com",  guestPhone: "+1 555 010 0003", checkIn: "2025-08-05", checkOut: "2025-08-12", guests: 3, pricePerNight: l(4).price,  totalPrice: l(4).price  * 7, status: "pending",   createdAt: "2025-05-25T09:15:00Z" },
    { id: "bk-4",  listingId: l(7).id,  listingTitle: l(7).title,  listingImg: l(7).img,  hostId: HOST_ID, guestId: "g-4",  guestName: "Aisha Nkosi",      guestEmail: "aisha@example.com",   guestPhone: "+44 7700 900 001",  checkIn: "2025-06-20", checkOut: "2025-06-25", guests: 2, pricePerNight: l(7).price,  totalPrice: l(7).price  * 5, status: "pending",   createdAt: "2025-05-26T16:00:00Z" },
    { id: "bk-11", listingId: l(1).id,  listingTitle: l(1).title,  listingImg: l(1).img,  hostId: HOST_ID, guestId: "g-11", guestName: "Carlos Mendez",    guestEmail: "carlos@example.com",  guestPhone: "+52 55 0000 0001",  checkIn: "2025-07-18", checkOut: "2025-07-25", guests: 2, pricePerNight: l(1).price,  totalPrice: l(1).price  * 7, status: "pending",   createdAt: "2025-05-29T10:00:00Z" },
    { id: "bk-12", listingId: l(10).id, listingTitle: l(10).title, listingImg: l(10).img, hostId: HOST_ID, guestId: "g-12", guestName: "Nadia Petrov",     guestEmail: "nadia@example.com",   guestPhone: "+7 916 000 0001",   checkIn: "2025-08-20", checkOut: "2025-08-24", guests: 1, pricePerNight: l(10).price, totalPrice: l(10).price * 4, status: "pending",   createdAt: "2025-05-30T15:30:00Z" },
    // Cancelled
    { id: "bk-5",  listingId: l(11).id, listingTitle: l(11).title, listingImg: l(11).img, hostId: HOST_ID, guestId: "g-5",  guestName: "Lena Fischer",     guestEmail: "lena@example.com",    guestPhone: "+49 170 000 0001",  checkIn: "2025-09-10", checkOut: "2025-09-15", guests: 4, pricePerNight: l(11).price, totalPrice: l(11).price * 5, status: "cancelled", createdAt: "2025-05-18T11:45:00Z" },
    { id: "bk-13", listingId: l(8).id,  listingTitle: l(8).title,  listingImg: l(8).img,  hostId: HOST_ID, guestId: "g-13", guestName: "Tom Nguyen",       guestEmail: "tom@example.com",     guestPhone: "+1 415 000 0001",   checkIn: "2025-07-05", checkOut: "2025-07-08", guests: 1, pricePerNight: l(8).price,  totalPrice: l(8).price  * 3, status: "cancelled", createdAt: "2025-05-12T12:00:00Z" },
  ];
}

function initReviews(): Review[] {
  return [
    { id: "rv-1", listingId: "1", guestName: "Emily Carter", rating: 5, comment: "Absolutely breathtaking! The ocean views were even better than the photos. We loved the infinity pool and the host was incredibly attentive.", createdAt: "2025-04-12T10:00:00Z" },
    { id: "rv-2", listingId: "1", guestName: "Marcus Silva", rating: 4, comment: "Beautiful villa with amazing amenities. The location is perfect. Slightly tricky to find at first but worth every moment once you arrive.", createdAt: "2025-03-28T14:00:00Z" },
    { id: "rv-3", listingId: "2", guestName: "Aisha Nkosi", rating: 5, comment: "The cosiest cabin I have ever stayed in. Waking up to the pines and fresh mountain air was magical. Firepit at night was the highlight.", createdAt: "2025-04-05T09:00:00Z" },
    { id: "rv-4", listingId: "3", guestName: "Lena Fischer", rating: 5, comment: "Prime location in Manhattan, spotless apartment, stunning rooftop views. Everything you need for a perfect city stay.", createdAt: "2025-05-01T11:00:00Z" },
    { id: "rv-5", listingId: "3", guestName: "John Guest", rating: 4, comment: "Great loft, very stylish. The neighbourhood is buzzing and everything is walkable. Will definitely book again.", createdAt: "2025-04-20T16:30:00Z" },
    { id: "rv-6", listingId: "4", guestName: "Sofia Rossi", rating: 5, comment: "A true gem in Tuscany. Sitting on the terrace with a glass of Chianti watching the sunset over the vineyards — pure magic.", createdAt: "2025-03-15T13:00:00Z" },
    { id: "rv-7", listingId: "6", guestName: "Pierre Dupont", rating: 5, comment: "Ski-in ski-out dreams come true. The chalet is luxurious and the sauna after a long day on the slopes is everything.", createdAt: "2025-02-10T18:00:00Z" },
    { id: "rv-8", listingId: "8", guestName: "Yuki Tanaka", rating: 4, comment: "Classic Parisian charm. Beautiful apartment, great neighbourhood, easy metro access. Highly recommend!", createdAt: "2025-04-30T10:30:00Z" },
  ];
}

function initConversations(): Conversation[] {
  const ls = initListings();
  const l1 = ls.find((l) => l.id === "1")!;
  const l3 = ls.find((l) => l.id === "3")!;
  return [
    { id: "conv-1", guestId: "guest-1", guestName: "John Guest", hostId: HOST_ID, hostName: "Sarah Host", listingId: l1.id, listingTitle: l1.title, listingImg: l1.img, lastMessageAt: "2025-05-10T14:30:00Z" },
    { id: "conv-2", guestId: "guest-1", guestName: "John Guest", hostId: HOST_ID, hostName: "Sarah Host", listingId: l3.id, listingTitle: l3.title, listingImg: l3.img, lastMessageAt: "2025-05-08T09:15:00Z" },
  ];
}

function initChatMessages(): ChatMessage[] {
  return [
    { id: "cm-1", conversationId: "conv-1", senderId: HOST_ID,   senderName: "Sarah Host",  content: "Hi! Welcome. Feel free to ask anything about the Beachfront Villa 🌊", createdAt: "2025-05-09T10:00:00Z" },
    { id: "cm-2", conversationId: "conv-1", senderId: "guest-1", senderName: "John Guest",   content: "Thanks! Is the infinity pool heated during the cooler months?",             createdAt: "2025-05-09T10:05:00Z" },
    { id: "cm-3", conversationId: "conv-1", senderId: HOST_ID,   senderName: "Sarah Host",  content: "Yes, the pool is heated year-round! Perfect for any season.",               createdAt: "2025-05-10T14:30:00Z" },
    { id: "cm-4", conversationId: "conv-2", senderId: HOST_ID,   senderName: "Sarah Host",  content: "Hey! Thanks for your interest in the Downtown Loft 🗽",                      createdAt: "2025-05-07T16:00:00Z" },
    { id: "cm-5", conversationId: "conv-2", senderId: "guest-1", senderName: "John Guest",   content: "Is parking available nearby?",                                               createdAt: "2025-05-07T16:10:00Z" },
    { id: "cm-6", conversationId: "conv-2", senderId: HOST_ID,   senderName: "Sarah Host",  content: "There's a parking garage half a block away, about $25/day.",                 createdAt: "2025-05-08T09:15:00Z" },
  ];
}

const USERS_KEY = "mock_registered_users";

function loadPersistedUsers(): MockUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function persistUser(user: MockUser): void {
  try {
    const existing: MockUser[] = JSON.parse(localStorage.getItem(USERS_KEY) ?? "[]");
    const filtered = existing.filter((u) => u.email !== user.email);
    localStorage.setItem(USERS_KEY, JSON.stringify([...filtered, user]));
  } catch {}
}

function initUsers(): MockUser[] {
  const seed: MockUser[] = [
    { id: HOST_ID,    name: "Sarah Host",  email: "host@example.com",  role: "host",  banned: false, createdAt: "2024-01-01T00:00:00Z" },
    { id: ADMIN_ID,   name: "Admin User",  email: "admin@example.com", role: "admin", banned: false, createdAt: "2024-01-01T00:00:00Z" },
    { id: "guest-1",  name: "John Guest",  email: "john@example.com",  role: "guest", banned: false, createdAt: "2024-03-01T00:00:00Z" },
  ];
  const seedEmails = new Set(seed.map((u) => u.email));
  const extra = loadPersistedUsers().filter((u) => !seedEmails.has(u.email));
  return [...seed, ...extra];
}

// ── In-memory store ───────────────────────────────────────────────────────────

const db = {
  listings: new Map<string, ExtendedListing>(initListings().map((l) => [l.id, l])),
  bookings: new Map<string, Booking>(initBookings().map((b) => [b.id, b])),
  users: new Map<string, MockUser>(initUsers().map((u) => [u.id, u])),
  saved: new Map<string, Set<string>>(),
  reviews: new Map<string, Review>(initReviews().map((r) => [r.id, r])),
  conversations: new Map<string, Conversation>(initConversations().map((c) => [c.id, c])),
  chatMessages: new Map<string, ChatMessage>(initChatMessages().map((m) => [m.id, m])),
};

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

// ── Role detection ────────────────────────────────────────────────────────────

export function detectRole(email: string): UserRole {
  if (email.includes("admin")) return "admin";
  if (email.includes("host")) return "host";
  return "guest";
}

// ── Listings ──────────────────────────────────────────────────────────────────

export const mockListings = {
  async getAll(): Promise<ExtendedListing[]> {
    await delay();
    return Array.from(db.listings.values()).filter((l) => l.status === "published");
  },
  async getById(id: string): Promise<ExtendedListing> {
    await delay(200);
    const l = db.listings.get(id);
    if (!l) throw new Error("Listing not found");
    return l;
  },
  async getByHost(hostId: string): Promise<ExtendedListing[]> {
    await delay();
    return Array.from(db.listings.values()).filter((l) => l.hostId === hostId);
  },
  async getPending(): Promise<ExtendedListing[]> {
    await delay();
    return Array.from(db.listings.values()).filter((l) => l.status === "pending");
  },
  async create(data: Omit<ExtendedListing, "id" | "rating">): Promise<ExtendedListing> {
    await delay(600);
    const listing: ExtendedListing = { ...data, id: crypto.randomUUID(), rating: 4.8 };
    db.listings.set(listing.id, listing);
    return listing;
  },
  async update(id: string, data: Partial<ExtendedListing>): Promise<ExtendedListing> {
    await delay(600);
    const existing = db.listings.get(id);
    if (!existing) throw new Error("Listing not found");
    const updated = { ...existing, ...data };
    db.listings.set(id, updated);
    return updated;
  },
  async delete(id: string): Promise<void> {
    await delay(400);
    db.listings.delete(id);
  },
  async approve(id: string): Promise<ExtendedListing> {
    return mockListings.update(id, { status: "published" });
  },
  async reject(id: string): Promise<ExtendedListing> {
    return mockListings.update(id, { status: "rejected" });
  },
};

// ── Bookings ──────────────────────────────────────────────────────────────────

export const mockBookings = {
  async getByGuest(guestId: string): Promise<Booking[]> {
    await delay();
    return Array.from(db.bookings.values()).filter((b) => b.guestId === guestId);
  },
  async getByHost(hostId: string): Promise<Booking[]> {
    await delay();
    const hostListingIds = new Set(
      Array.from(db.listings.values())
        .filter((l) => l.hostId === hostId)
        .map((l) => l.id)
    );
    return Array.from(db.bookings.values()).filter((b) => hostListingIds.has(b.listingId));
  },
  async getAll(): Promise<Booking[]> {
    await delay();
    return Array.from(db.bookings.values());
  },
  async create(data: Omit<Booking, "id" | "createdAt">): Promise<Booking> {
    await delay(800);
    const booking: Booking = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    db.bookings.set(booking.id, booking);
    return booking;
  },
  async cancel(id: string): Promise<Booking> {
    await delay(400);
    const b = db.bookings.get(id);
    if (!b) throw new Error("Booking not found");
    const updated = { ...b, status: "cancelled" as const };
    db.bookings.set(id, updated);
    return updated;
  },
  async updateStatus(id: string, status: Booking["status"]): Promise<Booking> {
    await delay(400);
    const b = db.bookings.get(id);
    if (!b) throw new Error("Booking not found");
    const updated = { ...b, status };
    db.bookings.set(id, updated);
    return updated;
  },
};

// ── Saved ─────────────────────────────────────────────────────────────────────

export const mockSaved = {
  async get(userId: string): Promise<string[]> {
    await delay(200);
    return Array.from(db.saved.get(userId) ?? []);
  },
  async toggle(userId: string, listingId: string): Promise<string[]> {
    await delay(300);
    if (!db.saved.has(userId)) db.saved.set(userId, new Set());
    const set = db.saved.get(userId)!;
    if (set.has(listingId)) set.delete(listingId);
    else set.add(listingId);
    return Array.from(set);
  },
};

// ── Users / Admin ─────────────────────────────────────────────────────────────

export const mockUsers = {
  findByEmail(email: string): MockUser | undefined {
    return Array.from(db.users.values()).find((u) => u.email === email);
  },
  async register(user: MockUser): Promise<MockUser> {
    db.users.set(user.id, user);
    persistUser(user);
    return user;
  },
  async getAll(): Promise<MockUser[]> {
    await delay();
    return Array.from(db.users.values());
  },
  async setRole(id: string, role: UserRole): Promise<MockUser> {
    await delay(400);
    const user = db.users.get(id);
    if (!user) throw new Error("User not found");
    const updated = { ...user, role };
    db.users.set(id, updated);
    return updated;
  },
  async ban(id: string): Promise<MockUser> {
    await delay(400);
    const user = db.users.get(id);
    if (!user) throw new Error("User not found");
    const updated = { ...user, banned: true };
    db.users.set(id, updated);
    // Remove their listings from the published pool
    for (const [lid, listing] of db.listings.entries()) {
      if (listing.hostId === id) db.listings.set(lid, { ...listing, status: "rejected" });
    }
    return updated;
  },
  async getStats() {

    await delay(300);
    return {
      totalUsers: db.users.size,
      totalListings: db.listings.size,
      totalBookings: db.bookings.size,
      totalRevenue: Array.from(db.bookings.values()).reduce((s, b) => s + b.totalPrice, 0),
    };
  },
};

// ── Chat ─────────────────────────────────────────────────────────────────────

export const mockChat = {
  async getConversations(guestId: string): Promise<Conversation[]> {
    await delay(200);
    return Array.from(db.conversations.values())
      .filter((c) => c.guestId === guestId)
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
  },
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    await delay(150);
    return Array.from(db.chatMessages.values())
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },
  async findOrCreate(data: Omit<Conversation, "id" | "lastMessageAt">): Promise<Conversation> {
    await delay(300);
    const existing = Array.from(db.conversations.values()).find(
      (c) => c.guestId === data.guestId && c.listingId === data.listingId
    );
    if (existing) return existing;
    const conv: Conversation = { ...data, id: crypto.randomUUID(), lastMessageAt: new Date().toISOString() };
    db.conversations.set(conv.id, conv);
    return conv;
  },
  async send(data: Omit<ChatMessage, "id" | "createdAt">): Promise<ChatMessage> {
    await delay(200);
    const msg: ChatMessage = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    db.chatMessages.set(msg.id, msg);
    const conv = db.conversations.get(data.conversationId);
    if (conv) db.conversations.set(conv.id, { ...conv, lastMessageAt: msg.createdAt });
    return msg;
  },
};

// ── Reviews ───────────────────────────────────────────────────────────────────

export const mockReviews = {
  async getByListing(listingId: string): Promise<Review[]> {
    await delay(200);
    return Array.from(db.reviews.values()).filter((r) => r.listingId === listingId);
  },
  async create(data: Omit<Review, "id" | "createdAt">): Promise<Review> {
    await delay(400);
    const review: Review = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    db.reviews.set(review.id, review);
    return review;
  },
};
