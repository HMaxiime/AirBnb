import apiClient from "./apiClient";
import type { ExtendedListing, Booking, MockUser } from "./mockDb";
import type { User } from "../features/auth/types";

// ─── Backend response shapes ──────────────────────────────────────────────────

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  username: string;
  phone?: string;
  role: "HOST" | "GUEST" | "ADMIN";
  banned: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface BackendPhoto {
  id: string;
  url: string;
  publicId?: string;
}

export interface BackendListing {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  guests: number;
  type: "APARTMENT" | "HOUSE" | "VILLA" | "OTHER";
  amenities: string[];
  status: "PENDING" | "APPROVED" | "REJECTED";
  host: { id: string; name: string; email: string };
  photos: BackendPhoto[];
  review?: { rating: number }[];
  booking?: { id: string; checkIn?: string; checkOut?: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface BackendBooking {
  id: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  guestId: string;
  listingId: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  guest: { id: string; name: string; email: string };
  listing: {
    id: string;
    title: string;
    location: string;
    price?: number;
    photos?: { url: string }[];
  };
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalListings: number;
  totalBookings: number;
  totalRevenue: number;
}

// ─── Adapters: backend → frontend types ──────────────────────────────────────

function typeToCategory(type: string): "house" | "apartment" | "villa" {
  if (type === "APARTMENT") return "apartment";
  if (type === "HOUSE")     return "house";
  if (type === "VILLA")     return "villa";
  return "house";
}

function toFrontendStatus(s: BackendListing["status"]): "pending" | "published" | "rejected" {
  if (s === "APPROVED") return "published";
  if (s === "REJECTED") return "rejected";
  return "pending";
}

export function adaptListing(b: BackendListing): ExtendedListing {
  const photoUrls  = b.photos.map((p) => p.url);
  const avgRating  = b.review?.length
    ? Math.round((b.review.reduce((s, r) => s + r.rating, 0) / b.review.length) * 100) / 100
    : 0;

  // A listing is unavailable if the backend found at least one active confirmed booking.
  const hasActiveBooking = (b.booking?.length ?? 0) > 0;

  return {
    id:            b.id,
    title:         b.title,
    description:   b.description,
    location:      b.location,
    price:         b.price,
    rating:        avgRating,
    superhost:     false,
    available:     !hasActiveBooking,
    availableFrom: "",
    img:           photoUrls[0] ?? "",
    category:      typeToCategory(b.type),
    status:        toFrontendStatus(b.status),
    hostId:        b.host.id,
    hostName:      b.host.name,
    photos:        photoUrls,
    // Pass through backend-only fields for components that read them.
    ...(b.guests    !== undefined && { guests:    b.guests }),
    ...(b.amenities !== undefined && { amenities: b.amenities }),
    ...(b.type      !== undefined && { type:      b.type }),
  } as ExtendedListing;
}

export function adaptBooking(b: BackendBooking): Booking {
  return {
    id:            b.id,
    listingId:     b.listingId,
    listingTitle:  b.listing.title,
    listingImg:    b.listing.photos?.[0]?.url ?? "",
    hostId:        "",
    guestId:       b.guestId,
    guestName:     b.guest.name,
    guestEmail:    b.guest.email,
    guestPhone:    "",
    checkIn:       b.checkIn.split("T")[0],
    checkOut:      b.checkOut.split("T")[0],
    guests:        1,
    pricePerNight: b.listing.price ?? 0,
    totalPrice:    b.totalPrice,
    status:        b.status.toLowerCase() as "pending" | "confirmed" | "cancelled",
    createdAt:     b.createdAt,
  };
}

export function adaptUser(b: BackendUser): User {
  const parts = b.name.trim().split(" ");
  return {
    id:        b.id,
    firstName: parts[0] ?? "",
    lastName:  parts.slice(1).join(" "),
    name:      b.name,
    email:     b.email,
    role:      b.role.toLowerCase() as "host" | "guest" | "admin",
    createdAt: b.createdAt,
    ...(b.avatar && { avatar: b.avatar }),
  };
}

// ─── Auth service ─────────────────────────────────────────────────────────────

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const { data } = await apiClient.post<{ token: string; user: BackendUser }>("/auth/login", { email, password });
    return { token: data.token, user: adaptUser(data.user) };
  },

  async register(payload: {
    firstName: string;
    lastName:  string;
    email:     string;
    password:  string;
    role:      "guest" | "host";
  }): Promise<void> {
    const name     = `${payload.firstName} ${payload.lastName}`.trim();
    const username = `${payload.firstName.toLowerCase()}${payload.lastName.toLowerCase()}_${Math.random().toString(36).slice(2, 6)}`;
    await apiClient.post("/auth/register", {
      name,
      email:    payload.email,
      username,
      password: payload.password,
      role:     payload.role.toUpperCase(),
    });
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<BackendUser>("/auth/me");
    return adaptUser(data);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post("/auth/change-password", { currentPassword, newPassword });
  },

  async forgotPassword(email: string): Promise<{ resetToken?: string }> {
    const { data } = await apiClient.post<{ resetToken?: string }>("/auth/forgot-password", { email });
    return data;
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post(`/auth/reset-password/${token}`, { password });
  },
};

// ─── Listing service ──────────────────────────────────────────────────────────

export const listingService = {
  async getAll(params?: { page?: number; limit?: number }): Promise<{ data: ExtendedListing[]; total: number }> {
    const { data } = await apiClient.get<{ data: BackendListing[]; meta: { total: number } }>("/listings", { params });
    return { data: data.data.map(adaptListing), total: data.meta.total };
  },

  async getById(id: string): Promise<ExtendedListing> {
    const { data } = await apiClient.get<BackendListing>(`/listings/${id}`);
    return adaptListing(data);
  },

  async getByHost(hostId: string): Promise<ExtendedListing[]> {
    const { data } = await apiClient.get<{ data: BackendListing[] }>("/listings", {
      params: { hostId, limit: 100 },
    });
    return data.data.map(adaptListing);
  },

  async create(
    fields: {
      title: string;
      description: string;
      location: string;
      price: number;
      guests?: number;
      type?: string;
      category?: string;
      amenities?: string[];
    },
    photos?: File[],
  ): Promise<ExtendedListing> {
    const form = new FormData();
    form.append("title",       fields.title);
    form.append("description", fields.description);
    form.append("location",    fields.location);
    form.append("price",       String(fields.price));
    form.append("guests",      String(fields.guests ?? 1));
    form.append("type",        fields.type ?? (fields.category ? fields.category.toUpperCase() : "OTHER"));
    form.append("amenities",   JSON.stringify(fields.amenities ?? []));
    photos?.forEach((f) => form.append("photos", f));

    const { data } = await apiClient.post<BackendListing>("/listings", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return adaptListing(data);
  },

  async update(
    id: string,
    fields: Partial<{
      title: string; description: string; location: string;
      price: number; guests: number; type: string; category: string; amenities: string[];
    }>,
    photos?: File[],
    replacePhotos?: boolean,
  ): Promise<ExtendedListing> {
    const form = new FormData();
    if (fields.title)       form.append("title",        fields.title);
    if (fields.description) form.append("description",  fields.description);
    if (fields.location)    form.append("location",     fields.location);
    if (fields.price)       form.append("price",        String(fields.price));
    if (fields.guests)      form.append("guests",       String(fields.guests));
    if (fields.amenities)   form.append("amenities",    JSON.stringify(fields.amenities));
    if (replacePhotos)      form.append("replacePhotos", "true");
    const type = fields.type ?? (fields.category ? fields.category.toUpperCase() : undefined);
    if (type) form.append("type", type);
    photos?.forEach((f) => form.append("photos", f));

    const { data } = await apiClient.put<BackendListing>(`/listings/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return adaptListing(data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/listings/${id}`);
  },

  async getPending(): Promise<ExtendedListing[]> {
    const { data } = await apiClient.get<{ data: BackendListing[]; meta: { total: number } }>(
      "/listings", { params: { status: "PENDING", limit: 100 } }
    );
    return data.data.map(adaptListing);
  },

  async setStatus(id: string, status: "APPROVED" | "REJECTED", reason?: string): Promise<void> {
    await apiClient.patch(`/listings/${id}/status`, { status, ...(reason && { reason }) });
  },

  async getModerationHistory(): Promise<{ month: string; approved: number; rejected: number }[]> {
    const { data } = await apiClient.get<{ month: string; approved: number; rejected: number }[]>(
      "/listings/moderation-history",
    );
    return data;
  },
};

// ─── Booking service ──────────────────────────────────────────────────────────

export const bookingService = {
  /** GUEST → their bookings only. HOST → all of their listing's bookings. ADMIN → all. */
  async getMyBookings(): Promise<Booking[]> {
    const { data } = await apiClient.get<BackendBooking[]>("/bookings");
    return data.map(adaptBooking);
  },

  async getHostBookings(): Promise<Booking[]> {
    const { data } = await apiClient.get<BackendBooking[]>("/bookings");
    return data.map(adaptBooking);
  },

  async create(payload: {
    listingId: string; totalPrice: number; checkIn: string; checkOut: string;
  }): Promise<Booking> {
    const { data } = await apiClient.post<BackendBooking>("/bookings", {
      listingId:  payload.listingId,
      totalPrice: payload.totalPrice,
      checkIn:    `${payload.checkIn}T00:00:00.000Z`,
      checkOut:   `${payload.checkOut}T00:00:00.000Z`,
    });
    return adaptBooking(data);
  },

  async cancel(id: string): Promise<void> {
    await apiClient.delete(`/bookings/${id}`);
  },

  async updateStatus(id: string, status: "confirmed" | "cancelled" | "pending"): Promise<Booking> {
    const { data } = await apiClient.put<{ updatedBooking: BackendBooking }>(
      `/bookings/approve/${id}`,
      { status: status.toUpperCase() },
    );
    return adaptBooking(data.updatedBooking);
  },
};

// ─── Admin service ────────────────────────────────────────────────────────────

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const [usersRes, listingsRes, bookingsRes] = await Promise.all([
      apiClient.get<{ data: BackendUser[]; meta: { total: number } }>("/users?limit=1"),
      apiClient.get<{ data: BackendListing[]; meta: { total: number } }>("/listings?limit=1"),
      apiClient.get<BackendBooking[]>("/bookings"),
    ]);
    const bookings = bookingsRes.data;
    return {
      totalUsers:    usersRes.data.meta.total,
      totalListings: listingsRes.data.meta.total,
      totalBookings: bookings.length,
      totalRevenue:  bookings
        .filter((b) => b.status === "CONFIRMED")
        .reduce((sum, b) => sum + b.totalPrice, 0),
    };
  },

  async setRole(userId: string, role: "host" | "guest"): Promise<void> {
    await apiClient.put(`/users/${userId}`, { role: role.toUpperCase() });
  },
};

// ─── User service ─────────────────────────────────────────────────────────────

export const userService = {
  async getAll(): Promise<MockUser[]> {
    const { data } = await apiClient.get<{ data: BackendUser[]; meta: { total: number } }>("/users?limit=500");
    return data.data.map((u) => ({
      id:        u.id,
      name:      u.name,
      email:     u.email,
      role:      u.role.toLowerCase() as "host" | "guest" | "admin",
      banned:    u.banned ?? false,
      createdAt: u.createdAt,
    }));
  },

  async ban(userId: string, reason?: string): Promise<{ banned: boolean }> {
    const { data } = await apiClient.patch<{ banned: boolean }>(`/users/${userId}/ban`, { reason });
    return data;
  },
};

// ─── Profile service ──────────────────────────────────────────────────────────

export const profileService = {
  async updateName(userId: string, firstName: string, lastName: string): Promise<void> {
    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    await apiClient.put(`/users/${userId}`, { name });
  },
};

// ─── AI service ──────────────────────────────────────────────────────────────

export interface AISearchResult {
  query: string;
  offTopic?: boolean;
  message?: string;
  extractedFilters: {
    location?: string;
    type?: string;
    guests?: number;
    maxPrice?: number;
    amenities?: string[];
  };
  results: ExtendedListing[];
  count: number;
}

export const aiService = {
  async search(query: string): Promise<AISearchResult> {
    const { data } = await apiClient.post<{ query: string; extractedFilters: AISearchResult["extractedFilters"]; results: BackendListing[]; count: number }>(
      "/ai/search", { query }
    );
    return {
      query:            data.query,
      extractedFilters: data.extractedFilters,
      results:          data.results.map(adaptListing),
      count:            data.count,
    };
  },
};

// ─── Upload service ───────────────────────────────────────────────────────────

export const uploadService = {
  async uploadAvatar(userId: string, file: File): Promise<{ avatar: string }> {
    const form = new FormData();
    form.append("image", file);
    const { data } = await apiClient.post<{ avatar: string }>(
      `/upload/users/${userId}/avatar`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return { avatar: data.avatar };
  },
};
