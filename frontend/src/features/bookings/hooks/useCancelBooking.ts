import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService } from "../../../lib/apiService";
import { useAuth } from "../../auth/hooks/useAuth";
import type { Booking } from "../../../lib/api";
import toast from "react-hot-toast";

export function useCancelBooking() {
  const qc   = useQueryClient();
  const { user } = useAuth();
  const key  = ["bookings", "me", user?.id];

  return useMutation({
    mutationFn: (id: string) => bookingService.cancel(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Booking[]>(key);
      qc.setQueryData<Booking[]>(key, (old) =>
        old?.map((b) => b.id === id ? { ...b, status: "cancelled" as const } : b) ?? []
      );
      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error("Could not cancel booking");
    },

    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
