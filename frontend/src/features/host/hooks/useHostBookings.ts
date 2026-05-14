import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService } from "../../../lib/apiService";
import { useAuth } from "../../auth/hooks/useAuth";
import { useStore } from "../../../store/StoreContext";
import type { Booking } from "../../../lib/api";
import toast from "react-hot-toast";

export function useHostBookings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bookings", "host", user?.id],
    queryFn:  () => bookingService.getHostBookings(),
    enabled:  !!user,
  });
}

export function useUpdateBookingStatus() {
  const qc   = useQueryClient();
  const { user } = useAuth();
  const { dispatch } = useStore();
  const key  = ["bookings", "host", user?.id];

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Booking["status"] }) =>
      bookingService.updateStatus(id, status),

    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Booking[]>(key);
      qc.setQueryData<Booking[]>(key, (old) =>
        old?.map((b) => b.id === id ? { ...b, status } : b) ?? []
      );
      return { previous };
    },

    onSuccess: (booking) => {
      // Invalidate listings so availability badge updates for everyone immediately.
      qc.invalidateQueries({ queryKey: ["listings"] });
      qc.invalidateQueries({ queryKey: ["listing", booking.listingId] });

      if (booking.status === "confirmed") {
        dispatch({
          type: "ADD_NOTIFICATION",
          payload: { message: `Booking confirmed for "${booking.listingTitle}".`, type: "success" },
        });
      }
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error("Failed to update booking");
    },

    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
