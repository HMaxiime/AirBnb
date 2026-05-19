import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../../../lib/apiService";
import type { MockUser } from "../../../lib/api";
import toast from "react-hot-toast";

export function useBanUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      userService.ban(userId, reason),

    onMutate: async ({ userId }) => {
      await qc.cancelQueries({ queryKey: ["users"] });
      const previous = qc.getQueryData<MockUser[]>(["users"]);
      qc.setQueryData<MockUser[]>(["users"], (old) =>
        old?.map((u) => u.id === userId ? { ...u, banned: !u.banned } : u) ?? []
      );
      return { previous };
    },

    onSuccess: (_data, { userId }) => {
      const users = qc.getQueryData<MockUser[]>(["users"]);
      const user  = users?.find((u) => u.id === userId);
      toast.success(user?.banned ? `${user.name} has been banned.` : `${user?.name ?? "User"} has been unbanned.`);
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["users"], ctx.previous);
      const msg = (_err as any)?.response?.data?.error || "Failed to update ban status";
      toast.error(msg);
    },

    onSettled: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
