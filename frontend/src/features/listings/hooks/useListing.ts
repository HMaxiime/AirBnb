import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { listingService } from "../../../lib/apiService";
import type { ExtendedListing } from "../../../lib/api";

export function useListing(id: string | undefined): UseQueryResult<ExtendedListing, Error> {
  return useQuery({
    queryKey: ["listing", id],
    queryFn:  () => listingService.getById(id!),
    enabled:  !!id,
  });
}
