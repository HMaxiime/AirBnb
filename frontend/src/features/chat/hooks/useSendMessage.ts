import { useMutation, useQueryClient } from "@tanstack/react-query";
import { mockChat } from "../../../lib/mockDb";

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mockChat.send,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["messages", vars.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
