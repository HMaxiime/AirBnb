import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

const client = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export default client;

import {
  mockListings,
  mockBookings,
  mockSaved,
  mockUsers,
  mockReviews,
  ExtendedListing,
  Booking,
  MockUser,
  UserRole,
  Review,
} from "./mockDb";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

async function fetchApi<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => fetchApi<T>("GET", path),
  post: <T>(path: string, body: unknown) => fetchApi<T>("POST", path, body),
  put: <T>(path: string, body: unknown) => fetchApi<T>("PUT", path, body),
  patch: <T>(path: string, body: unknown) => fetchApi<T>("PATCH", path, body),
  delete: <T>(path: string) => fetchApi<T>("DELETE", path),
};

export const listingsApi = {
  getAll: () => mockListings.getAll(),
  getById: (id: string) => mockListings.getById(id),
  getByHost: (hostId: string) => mockListings.getByHost(hostId),
  getPending: () => mockListings.getPending(),
  create: (data: Omit<ExtendedListing, "id" | "rating">) => mockListings.create(data),
  update: (id: string, data: Partial<ExtendedListing>) => mockListings.update(id, data),
  delete: (id: string) => mockListings.delete(id),
  approve: (id: string) => mockListings.approve(id),
  reject: (id: string) => mockListings.reject(id),
};

export const bookingsApi = {
  getByGuest: (guestId: string) => mockBookings.getByGuest(guestId),
  getByHost: (hostId: string) => mockBookings.getByHost(hostId),
  getAll: () => mockBookings.getAll(),
  create: (data: Omit<Booking, "id" | "createdAt">) => mockBookings.create(data),
  cancel: (id: string) => mockBookings.cancel(id),
  updateStatus: (id: string, status: Booking["status"]) => mockBookings.updateStatus(id, status),
};

export const savedApi = {
  get: (userId: string) => mockSaved.get(userId),
  toggle: (userId: string, listingId: string) => mockSaved.toggle(userId, listingId),
};

export const adminApi = {
  getStats: () => mockUsers.getStats(),
  getAllUsers: () => mockUsers.getAll(),
  ban: (userId: string) => mockUsers.ban(userId),
  setRole: (userId: string, role: UserRole) => mockUsers.setRole(userId, role),
};

export const reviewsApi = {
  getByListing: (listingId: string) => mockReviews.getByListing(listingId),
  create: (data: Omit<Review, "id" | "createdAt">) => mockReviews.create(data),
};

export type { ExtendedListing, Booking, MockUser, UserRole, Review };

