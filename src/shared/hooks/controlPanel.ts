import { useAsyncList } from "./useAsyncList";
import * as odooData from "@/shared/api/odooData";
import type {
  ControlPanelOverview,
  ControlPanelSection,
  ControlPanelSectionPayload,
} from "@/shared/api/controlPanel";

/**
 * The Control Panel endpoints answer with a single object, not a list, so they
 * do not fit `useAsyncList`'s `T[]` contract directly. Wrapping the object in a
 * one-element array is deliberate: it buys the whole `requestCache` layer —
 * the 60 s TTL, in-flight de-duplication across concurrent mounts, and the
 * cross-hook subscription — without a parallel single-object cache.
 */
const useCachedResource = <T,>(
  cacheKey: string,
  fetcher: () => Promise<T | null>,
  deps: unknown[],
  errorFallback: string,
) => {
  const { data, loading, error, refetch } = useAsyncList<T>(
    async () => {
      const result = await fetcher();
      return result ? [result] : [];
    },
    deps,
    errorFallback,
    undefined,
    { cacheKey },
  );
  return { data: data[0] ?? null, loading, error, refetch };
};

/** The whole Control Panel in one request. Fired once on mount. */
export const useControlPanelOverview = (params?: {
  departmentId?: number;
  newJoinerDays?: number;
}) => {
  const departmentId = params?.departmentId;
  const newJoinerDays = params?.newJoinerDays;
  const { data, loading, error, refetch } = useCachedResource<ControlPanelOverview>(
    "controlPanel:overview",
    () => odooData.fetchControlPanelOverview({ departmentId, newJoinerDays }),
    [departmentId, newJoinerDays],
    "Failed to load control panel overview",
  );
  return { overview: data, loading, error, refetch };
};

/**
 * One KPI tab's numbers. Pass `null` to fetch nothing — that is how the
 * overview tab avoids paying for a section it does not render.
 */
export const useControlPanelSection = (
  section: ControlPanelSection | null,
  departmentId?: number,
) => {
  const { data, loading, error, refetch } = useCachedResource<ControlPanelSectionPayload>(
    "controlPanel:section",
    () => (section ? odooData.fetchControlPanelSection(section, departmentId) : Promise.resolve(null)),
    [section, departmentId],
    "Failed to load control panel section",
  );
  return { section: data, loading: section ? loading : false, error, refetch };
};
