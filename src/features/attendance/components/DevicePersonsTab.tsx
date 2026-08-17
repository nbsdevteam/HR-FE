import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Users } from "lucide-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { arabicSource } from "@/i18n/source";
import type { DevicePerson } from "../types";
import { DEVICE_SYNC_API, filterDevicePersons } from "../utils/deviceManagement";
import DevicePersonCard from "./DevicePersonCard";
import DevicePersonsToolbar from "./DevicePersonsToolbar";

const DevicePersonsTab = () => {
  const [persons, setPersons] = useState<DevicePerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [facePhotos, setFacePhotos] = useState<Record<string, string>>({});
  const [loadingFaces, setLoadingFaces] = useState(false);

  const filtered = useMemo(() => filterDevicePersons(persons, search), [persons, search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${DEVICE_SYNC_API}/device/persons`);
      const data = await response.json();
      if (data.success) {
        setPersons(data.persons);

        const withFaces = data.persons.filter((person: DevicePerson) => person.numOfFace > 0);
        if (withFaces.length > 0 && Object.keys(facePhotos).length === 0) {
          setLoadingFaces(true);
          const photos: Record<string, string> = {};

          for (let index = 0; index < withFaces.length; index += 5) {
            const batch = withFaces.slice(index, index + 5);
            await Promise.all(batch.map(async (person: DevicePerson) => {
              try {
                const faceResponse = await fetch(`${DEVICE_SYNC_API}/device/persons/${person.employeeNo}/face`);
                const faceData = await faceResponse.json();
                if (faceData.found && faceData.imageBase64) photos[person.employeeNo] = faceData.imageBase64;
              } catch {
                // Skip failed face photo fetches.
              }
            }));
          }

          setFacePhotos(photos);
          setLoadingFaces(false);
        }
      }
    } catch {
      // Device can be offline.
    }
    setLoading(false);
  }, [facePhotos]);

  const handleSearchChange = useCallback((nextSearch: string) => {
    setSearch(nextSearch);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <DevicePersonsToolbar
        search={search}
        loading={loading}
        loadingFaces={loadingFaces}
        totalPeople={persons.length}
        onSearchChange={handleSearchChange}
        onRefresh={load}
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground ms-3">{arabicSource("devicemanagement.loading_people")}</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((person, index) => (
            <DevicePersonCard
              key={person.employeeNo}
              person={person}
              index={index}
              facePhoto={facePhotos[person.employeeNo]}
            />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full">
              <EmptyState
                icon={Users}
                message={search ? arabicSource("common.no_results_found") : arabicSource("devicemanagement.there_are_no_people_registered")}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DevicePersonsTab;
