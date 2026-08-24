import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Users } from "lucide-react";
import EmptyState from "@/shared/components/EmptyState";
import { useAsyncList } from "@/shared/hooks/useAsyncList";
import { arabicSource } from "@/i18n/source";
import type { DevicePerson } from "../types";
import {
  DEVICE_SYNC_API,
  fetchDevicePersons,
  filterDevicePersons,
} from "../utils/deviceManagement";
import DevicePersonCard from "./DevicePersonCard";
import DevicePersonsToolbar from "./DevicePersonsToolbar";

const FACE_BATCH_SIZE = 5;

/** Pull the enrolled face photos a few at a time so the device isn't flooded. */
const fetchFacePhotos = async (
  persons: DevicePerson[],
): Promise<Record<string, string>> => {
  const photos: Record<string, string> = {};

  for (let index = 0; index < persons.length; index += FACE_BATCH_SIZE) {
    const batch = persons.slice(index, index + FACE_BATCH_SIZE);
    await Promise.all(
      batch.map(async (person) => {
        try {
          const response = await fetch(
            `${DEVICE_SYNC_API}/device/persons/${person.employeeNo}/face`,
          );
          const data = await response.json();
          if (data.found && data.imageBase64) {
            photos[person.employeeNo] = data.imageBase64;
          }
        } catch {
          // Skip failed face photo fetches.
        }
      }),
    );
  }

  return photos;
};

const DevicePersonsTab = () => {
  const [facePhotos, setFacePhotos] = useState<Record<string, string>>({});
  const [loadingFaces, setLoadingFaces] = useState(false);
  const [search, setSearch] = useState("");

  // No cacheKey: the device is a live peripheral, so a remount must re-read it.
  const {
    data: persons,
    loading,
    refetch: load,
  } = useAsyncList<DevicePerson>(
    fetchDevicePersons,
    [],
    "Failed to load device persons",
  );

  const filtered = useMemo(
    () => filterDevicePersons(persons, search),
    [persons, search],
  );

  const handleSearchChange = useCallback((nextSearch: string) => {
    setSearch(nextSearch);
  }, []);

  // Faces load once, after the person list arrives — keeping this out of the
  // person fetcher stops the photo state from retriggering that fetch.
  useEffect(() => {
    const withFaces = persons.filter((person) => person.numOfFace > 0);
    if (withFaces.length === 0) return;

    let cancelled = false;
    setLoadingFaces(true);
    fetchFacePhotos(withFaces).then((photos) => {
      if (cancelled) return;
      setFacePhotos(photos);
      setLoadingFaces(false);
    });

    return () => {
      cancelled = true;
    };
  }, [persons]);

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
