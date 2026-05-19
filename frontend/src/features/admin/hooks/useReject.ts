import { useMutation, useQueryClient } from "@tanstack/react-query";
import { listingService } from "../../../lib/apiService";
import toast from "react-hot-toast";

export function useReject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      listingService.setStatus(id, "REJECTED", reason),
    onSuccess: () => {
      toast.success("Listing rejected");
      qc.invalidateQueries({ queryKey: ["listings", "pending"] });
      qc.invalidateQueries({ queryKey: ["moderation-history"] });
    },
    onError: () => toast.error("Failed to reject listing"),
  });
}
