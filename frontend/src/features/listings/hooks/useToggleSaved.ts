import { useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { useStore } from "../../../store/StoreContext";
import { useAuth } from "../../auth/hooks/useAuth";
import { savedApi } from "../../../lib/api";
import toast from "react-hot-toast";

export function useToggleSaved(): UseMutationResult<string[], Error, string, void> {
  const qc = useQueryClient();
  const { dispatch } = useStore();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (listingId: string) =>
      savedApi.toggle(user?.id ?? "anonymous", listingId),

    onMutate: (listingId: string): void => {
      dispatch({ type: "TOGGLE_FAVORITE", payload: listingId });
    },

    onError: (_err: Error, listingId: string): void => {
      dispatch({ type: "TOGGLE_FAVORITE", payload: listingId });
      toast.error("Failed to update saved listings");
    },

    onSettled: (): void => {
      qc.invalidateQueries({ queryKey: ["saved"] });
    },
  });
}
