import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../auth/hooks/useAuth";
import { mockChat } from "../../../lib/mockDb";

export function useConversations() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: () => mockChat.getConversations(user!.id),
    enabled: !!user,
  });
}
