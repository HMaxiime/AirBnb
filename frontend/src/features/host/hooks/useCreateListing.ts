import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { listingService } from "../../../lib/apiService";
import { useAuth } from "../../auth/hooks/useAuth";
import { useStore } from "../../../store/StoreContext";
import toast from "react-hot-toast";

export function useCreateListing() {
  const qc       = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dispatch } = useStore();

  return useMutation({
    mutationFn: (payload: { fields: Parameters<typeof listingService.create>[0]; photos?: File[] }) =>
      listingService.create(payload.fields, payload.photos),

    onSuccess: (listing) => {
      qc.invalidateQueries({ queryKey: ["listings", "mine", user?.id] });
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: { message: `Listing "${listing.title}" was created successfully.`, type: "success" },
      });
      navigate("/host");
    },

    onError: () => toast.error("Failed to create listing"),
  });
}
