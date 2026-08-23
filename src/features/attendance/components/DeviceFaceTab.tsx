import { useCallback, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";
import { useAsyncList } from "@/shared/hooks/useAsyncList";
import type { DeviceFacePreview, DevicePerson } from "../types";
import {
  DEVICE_SYNC_API,
  fileToBase64,
  filterDevicePersons,
} from "../utils/deviceManagement";
import DeviceFaceModal from "./DeviceFaceModal";
import DeviceFacePersonCard from "./DeviceFacePersonCard";
import DeviceFaceToolbar from "./DeviceFaceToolbar";

const fetchDevicePersons = async (): Promise<DevicePerson[]> => {
  const response = await fetch(`${DEVICE_SYNC_API}/device/persons`);
  const data = await response.json();
  return data.success ? data.persons : [];
};

const DeviceFaceTab = () => {
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [viewFace, setViewFace] = useState<DeviceFacePreview | null>(null);

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

  const handleCloseFace = useCallback(() => {
    setViewFace(null);
  }, []);

  const handleViewFace = useCallback(async (employeeNumber: string) => {
    try {
      const response = await fetch(
        `${DEVICE_SYNC_API}/device/persons/${employeeNumber}/face`,
      );
      const data = await response.json();
      setViewFace({
        empNo: employeeNumber,
        image: data.found && data.imageBase64 ? data.imageBase64 : "",
      });
    } catch {
      // Device can be offline.
    }
  }, []);

  const handleUploadFace = useCallback(
    async (employeeNumber: string, file: File) => {
      setUploading(employeeNumber);
      try {
        const base64 = await fileToBase64(file);
        await fetch(`${DEVICE_SYNC_API}/device/persons/${employeeNumber}/face`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });
        await load();
      } catch {
        // Device can be offline.
      }
      setUploading(null);
    },
    [load],
  );

  const handleDeleteFace = useCallback(
    async (employeeNumber: string) => {
      try {
        await fetch(`${DEVICE_SYNC_API}/device/persons/${employeeNumber}/face`, {
          method: "DELETE",
        });
        setViewFace(null);
        await load();
      } catch {
        // Device can be offline.
      }
    },
    [load],
  );

  return (
    <div className="space-y-4">
      <DeviceFaceToolbar
        search={search}
        loading={loading}
        onSearchChange={handleSearchChange}
        onRefresh={load}
      />
      <AnimatePresence>
        {viewFace && (
          <DeviceFaceModal
            face={viewFace}
            onClose={handleCloseFace}
            onDelete={handleDeleteFace}
          />
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((person) => (
            <DeviceFacePersonCard
              key={person.employeeNo}
              person={person}
              uploading={uploading === person.employeeNo}
              onViewFace={handleViewFace}
              onUploadFace={handleUploadFace}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DeviceFaceTab;
