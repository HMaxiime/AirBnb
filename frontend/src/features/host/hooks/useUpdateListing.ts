import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { listingService } from "../../../lib/apiService";
import { useAuth } from "../../auth/hooks/useAuth";
import { useStore } from "../../../store/StoreContext";
import type { ExtendedListing } from "../../../lib/api";
import toast from "react-hot-toast";

export function useUpdateListing() {
  const qc       = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dispatch } = useStore();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExtendedListing>; photos?: File[] }) =>
      listingService.update(id, data as Parameters<typeof listingService.update>[1]),

    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["listing", id] });
      const previous = qc.getQueryData<ExtendedListing>(["listing", id]);
      qc.setQueryData<ExtendedListing>(["listing", id], (old) => old ? { ...old, ...data } : old);
      return { previous, id };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["listing", ctx.id], ctx.previous);
      toast.error("Failed to update listing");
    },

    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["listings", "mine", user?.id] });
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: { message: `Listing "${(vars.data as ExtendedListing).title ?? "your listing"}" was updated.`, type: "success" },
      });
      navigate("/host");
    },

    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: ["listing", id] });
    },
  });
}
