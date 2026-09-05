import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import * as odooData from "@/shared/api/odooData";
import {
  mapDepartment,
  mapModule,
  mapConfig,
  mapHoliday,
  mapLeaveType,
  mapContractType,
  mapDocumentType,
  mapShift,
} from "@/shared/api/mappers";
import type { SettingsBootstrap, SettingsBootstrapSection } from "@/shared/api/settings";
import type { DeviceSyncState } from "@/shared/api/devices";
import { dedupeBy } from "@/shared/utils/collections";
import { MOCK_SHIFTS } from "@/shared/hooks/shifts";
import type {
  DbDepartment,
  DbSystemModule,
  DbConfiguration,
  DbPublicHoliday,
  DbLeaveType,
  DbContractType,
  DbDocumentType,
  DbShift,
} from "@/shared/hooks";

interface SettingsBootstrapContextValue {
  loading: boolean;
  departments: DbDepartment[];
  modules: DbSystemModule[];
  configs: DbConfiguration[];
  holidays: DbPublicHoliday[];
  leaveTypes: DbLeaveType[];
  contractTypes: DbContractType[];
  documentTypes: DbDocumentType[];
  shifts: DbShift[];
  deviceSync: DeviceSyncState | null;
  /** Re-fetches the whole bundle — there is no way to refresh one section alone. */
  refetch: () => Promise<void>;
}

const EMPTY_VALUE: SettingsBootstrapContextValue = {
  loading: true,
  departments: [],
  modules: [],
  configs: [],
  holidays: [],
  leaveTypes: [],
  contractTypes: [],
  documentTypes: [],
  shifts: [],
  deviceSync: null,
  refetch: async () => {},
};

const SettingsBootstrapContext = createContext<SettingsBootstrapContextValue>(EMPTY_VALUE);

/**
 * Every Settings card that used to fetch its own list independently now reads
 * it from here — one `POST /api/hr/settings/bootstrap` call backs all of them
 * (backend hand-off "HR Control Panel API Optimization"). A denied section
 * comes back as `{success:false}` and resolves to an empty array here, the
 * same as when that card's standalone fetch used to throw and its own list
 * hook caught it into an empty `data`.
 */
export const useSettingsBootstrap = (): SettingsBootstrapContextValue => useContext(SettingsBootstrapContext);

const itemsOf = <T,>(section: SettingsBootstrapSection<{ items: T[] }> | undefined): T[] =>
  section?.success && section.data ? section.data.items : [];

const fetchBootstrap = (): Promise<SettingsBootstrap> => odooData.fetchSettingsBootstrap();

const SettingsBootstrapProvider = ({ children }: { children: ReactNode }) => {
  const query = useQuery<SettingsBootstrap, Error>({
    queryKey: ["settingsBootstrap"],
    queryFn: fetchBootstrap,
  });
  const bundle = query.data ?? null;

  const departments = useMemo(
    () => dedupeBy(itemsOf(bundle?.departments).map(mapDepartment), (d) => d.id),
    [bundle],
  );
  const modules = useMemo(() => itemsOf(bundle?.modules).map(mapModule), [bundle]);
  const configs = useMemo(() => itemsOf(bundle?.configs).map(mapConfig), [bundle]);
  const holidays = useMemo(() => itemsOf(bundle?.holidays).map(mapHoliday), [bundle]);
  const leaveTypes = useMemo(() => itemsOf(bundle?.leave_types).map(mapLeaveType), [bundle]);
  const contractTypes = useMemo(() => itemsOf(bundle?.contract_types).map(mapContractType), [bundle]);
  const documentTypes = useMemo(() => itemsOf(bundle?.document_types).map(mapDocumentType), [bundle]);
  const shifts = useMemo(() => {
    const mapped = itemsOf(bundle?.shifts).map(mapShift);
    // `useShifts()` fell back to demo data on any fetch failure, permission
    // denial included — matched here so losing `hr.shifts.list` still shows
    // a placeholder schedule instead of an empty card.
    return mapped.length > 0 ? mapped : MOCK_SHIFTS;
  }, [bundle]);
  const deviceSync = useMemo(
    () => (bundle?.device_sync.success ? bundle.device_sync.data ?? null : null),
    [bundle],
  );

  const refetch = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query.refetch]);

  // Declared after the useMemo/useCallback above (not before, per the usual
  // ordering) because it closes over them directly — mirrors `AuthProvider`.
  const value = useMemo<SettingsBootstrapContextValue>(
    () => ({
      loading: query.isFetching,
      departments,
      modules,
      configs,
      holidays,
      leaveTypes,
      contractTypes,
      documentTypes,
      shifts,
      deviceSync,
      refetch,
    }),
    [
      query.isFetching, departments, modules, configs, holidays, leaveTypes,
      contractTypes, documentTypes, shifts, deviceSync, refetch,
    ],
  );

  return (
    <SettingsBootstrapContext.Provider value={value}>
      {children}
    </SettingsBootstrapContext.Provider>
  );
};

export default SettingsBootstrapProvider;
