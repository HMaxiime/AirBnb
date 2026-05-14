import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { bookingService } from "../../../lib/apiService";
import { useAuth } from "../../auth/hooks/useAuth";
import type { Booking } from "../../../lib/api";

export function useMyBookings(): UseQueryResult<Booking[], Error> {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bookings", "me", user?.id],
    queryFn:  () => bookingService.getMyBookings(),
    enabled:  !!user,
  });
}
