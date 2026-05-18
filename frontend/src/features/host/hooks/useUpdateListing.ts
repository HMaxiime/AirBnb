import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { listingService } from "../../../lib/apiService";
import { useAuth } from "../../auth/hooks/useAuth";
import { useStore } from "../../../store/StoreContext";
import toast from "react-hot-toast";

interface UpdatePayload {
  id: string;
  fields: {
    title:       string;
    description: string;
    location:    string;
    price:       number;
    guests:      number;
    type:        string;
    amenities:   string[];
  };
  photos?:        File[];
  replacePhotos?: boolean;
}

export function useUpdateListing() {
  const qc       = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dispatch } = useStore();

  return useMutation({
    mutationFn: ({ id, fields, photos, replacePhotos }: UpdatePayload) =>
      listingService.update(id, fields, photos, replacePhotos),

    onError: () => {
      toast.error("Failed to update listing");
    },

    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["listings", "mine", user?.id] });
      qc.invalidateQueries({ queryKey: ["listing", vars.id] });
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: { message: `Listing "${vars.fields.title}" was updated.`, type: "success" },
      });
      navigate("/host/listings");
    },
  });
}
