import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { adminService, AdminStats } from "../../../lib/apiService";

export function useAdminStats(): UseQueryResult<AdminStats, Error> {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn:  adminService.getStats,
    staleTime: 30_000,
  });
}
