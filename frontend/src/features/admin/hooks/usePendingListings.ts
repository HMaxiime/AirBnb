import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { listingService } from "../../../lib/apiService";
import type { ExtendedListing } from "../../../lib/api";

export function usePendingListings(): UseQueryResult<ExtendedListing[], Error> {
  return useQuery({
    queryKey: ["listings", "pending"],
    queryFn:  listingService.getPending,
  });
}
