import { useQuery, UseQueryResult } from "@tanstack/react-query";
import type { ExtendedListing } from "../../../lib/api";

// The backend Listing model has no `status` field, so there is no moderation queue.
// This returns an empty list so the ModerationQueue page renders correctly with no items.
export function usePendingListings(): UseQueryResult<ExtendedListing[], Error> {
  return useQuery({
    queryKey: ["listings", "pending"],
    queryFn:  (): ExtendedListing[] => [],
    staleTime: Infinity,
  });
}
