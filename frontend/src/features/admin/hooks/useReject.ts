import { useMutation, useQueryClient } from "@tanstack/react-query";
import { listingService } from "../../../lib/apiService";
import toast from "react-hot-toast";

export function useReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listingService.setStatus(id, "REJECTED"),
    onSuccess: () => {
      toast.success("Listing rejected");
      qc.invalidateQueries({ queryKey: ["listings", "pending"] });
    },
    onError: () => toast.error("Failed to reject listing"),
  });
}
