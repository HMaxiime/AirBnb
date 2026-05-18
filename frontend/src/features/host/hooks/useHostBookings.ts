import { useQuery } from "@tanstack/react-query";
import { bookingService } from "../../../lib/apiService";
import { useAuth } from "../../auth/hooks/useAuth";

export function useHostBookings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bookings", "host", user?.id],
    queryFn:  () => bookingService.getHostBookings(),
    enabled:  !!user,
  });
}
