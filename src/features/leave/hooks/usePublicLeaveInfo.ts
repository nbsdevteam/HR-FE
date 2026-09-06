import { useQuery } from "@tanstack/react-query";
import { fetchPublicLeaveInfo, PublicLeaveApiError } from "../api/publicLeaveApi";
import type { PublicLeaveInfo } from "../types/publicLeave";

export const usePublicLeaveInfo = (token: string) => {
  // No retry: a bad/expired token will never succeed on a second try, so
  // retrying would only delay the error and add an extra request against a
  // logged-out-reachable endpoint.
  const query = useQuery<PublicLeaveInfo, Error>({
    queryKey: ["publicLeaveInfo", token],
    queryFn: () => fetchPublicLeaveInfo(token),
    retry: false,
  });

  return {
    info: query.data ?? null,
    loading: query.isFetching,
    loadError: query.error ? (query.error instanceof PublicLeaveApiError ? query.error.code : "invalid_link") : "",
  };
};
