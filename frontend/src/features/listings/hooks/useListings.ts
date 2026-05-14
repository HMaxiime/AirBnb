import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { listingService } from "../../../lib/apiService";
import type { ExtendedListing } from "../../../lib/api";

export function useListings(): UseQueryResult<ExtendedListing[], Error> {
  return useQuery({
    queryKey: ["listings"],
    queryFn:  async () => {
      const { data } = await listingService.getAll();
      return data;
    },
  });
}
