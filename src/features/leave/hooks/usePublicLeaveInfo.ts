import { useCallback, useEffect, useState } from "react";
import { fetchPublicLeaveInfo, PublicLeaveApiError } from "../api/publicLeaveApi";
import type { PublicLeaveInfo } from "../types/publicLeave";

export const usePublicLeaveInfo = (token: string) => {
  const [info, setInfo] = useState<PublicLeaveInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const data = await fetchPublicLeaveInfo(token);
      setInfo(data);
    } catch (error) {
      setLoadError(error instanceof PublicLeaveApiError ? error.code : "invalid_link");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return { info, loading, loadError };
};
