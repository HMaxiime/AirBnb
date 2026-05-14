import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "../../../lib/apiService";
import toast from "react-hot-toast";

export function useSetRole() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "host" | "guest" }) =>
      adminService.setRole(userId, role),

    onSuccess: (_data, { role }) => {
      toast.success(role === "host" ? "Host privilege granted" : "Host privilege revoked");
      qc.invalidateQueries({ queryKey: ["users"] });
    },

    onError: () => toast.error("Failed to update role"),
  });
}
