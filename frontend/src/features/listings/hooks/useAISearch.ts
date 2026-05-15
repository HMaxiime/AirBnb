import { useMutation } from "@tanstack/react-query";
import { aiService, type AISearchResult } from "../../../lib/apiService";

export function useAISearch() {
  return useMutation<AISearchResult, Error, string>({
    mutationFn: (query: string) => aiService.search(query),
  });
}
