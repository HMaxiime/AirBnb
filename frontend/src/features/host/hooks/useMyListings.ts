import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { listingService } from "../../../lib/apiService";
import { useAuth } from "../../auth/hooks/useAuth";
import type { ExtendedListing } from "../../../lib/api";

export function useMyListings(): UseQueryResult<ExtendedListing[], Error> {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["listings", "mine", user?.id],
    queryFn:  () => listingService.getByHost(user!.id),
    enabled:  !!user,
  });
}
