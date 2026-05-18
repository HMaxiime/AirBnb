import { useMutation, useQueryClient } from "@tanstack/react-query";
import { listingService } from "../../../lib/apiService";
import { useAuth } from "../../auth/hooks/useAuth";
import type { ExtendedListing } from "../../../lib/api";
import toast from "react-hot-toast";

export function useDeleteListing() {
  const qc   = useQueryClient();
  const { user } = useAuth();
  const key  = ["listings", "mine", user?.id];

  return useMutation({
    mutationFn: (id: string) => listingService.delete(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ExtendedListing[]>(key);
      qc.setQueryData<ExtendedListing[]>(key, (old) => old?.filter((l) => l.id !== id) ?? []);
      return { previous };
    },

    onError: (_err, _id, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
      toast.error("Failed to delete listing");
    },

    onSuccess: () => {
      toast.success("Listing deleted");
    },

    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}
