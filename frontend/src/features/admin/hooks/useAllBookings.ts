import { useQuery, keepPreviousData, UseQueryResult } from "@tanstack/react-query";
import { bookingService } from "../../../lib/apiService";
import type { Booking } from "../../../lib/api";

export function useAllBookings(status: Booking["status"] | "all" = "all"): UseQueryResult<Booking[], Error> {
  return useQuery({
    queryKey: ["bookings", "all", status],
    queryFn:  async (): Promise<Booking[]> => {
      const all = await bookingService.getMyBookings(); // ADMIN role → all bookings
      return status === "all" ? all : all.filter((b) => b.status === status);
    },
    placeholderData: keepPreviousData,
  });
}
