import { useQuery } from "@tanstack/react-query";
import { mockChat } from "../../../lib/mockDb";

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => mockChat.getMessages(conversationId!),
    enabled: !!conversationId,
  });
}
