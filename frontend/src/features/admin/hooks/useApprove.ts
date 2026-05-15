import { useMutation, useQueryClient } from "@tanstack/react-query";
import { listingService } from "../../../lib/apiService";
import toast from "react-hot-toast";

export function useApprove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => listingService.setStatus(id, "APPROVED"),
    onSuccess: () => {
      toast.success("Listing approved");
      qc.invalidateQueries({ queryKey: ["listings", "pending"] });
    },
    onError: () => toast.error("Failed to approve listing"),
  });
}
