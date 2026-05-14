import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mockChat } from "../../../lib/mockDb";

export function useStartConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mockChat.findOrCreate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
