import { useState, useCallback, useEffect } from "react";
import * as odooData from "@/shared/api/odooData";
import { useOdooMutation } from "@/shared/hooks/useOdooMutation";
import type { Custody, CustodyStatus } from "../types";
import { toCustodies } from "../utils/custodyMapper";
import { errorMessage } from "../utils/errorMessage";

const todayStr = () => new Date().toISOString().split("T")[0];

type NewCustody = {
  item: string;
  description: string;
  dateReceived: string;
  serialNumber: string;
  status: CustodyStatus;
  notes: string;
};

const emptyNewCustody = (): NewCustody => ({
  item: "", description: "", dateReceived: todayStr(), serialNumber: "", status: "active", notes: "",
});

export const useEmployeeCustodyForm = (employeeId: string) => {
  const [custodies, setCustodies] = useState<Custody[]>([]);
  const [custodiesLoading, setCustodiesLoading] = useState(false);
  const [custodyError, setCustodyError] = useState<string | null>(null);
  const [showAddCustody, setShowAddCustody] = useState(false);
  const [newCustody, setNewCustody] = useState<NewCustody>(emptyNewCustody());

  // Custody rows aren't backed by a TanStack Query read hook (they're loaded
  // directly into local state below), so there's no cache key to invalidate —
  // `reloadCustodies()` after each mutation stays the only way to refresh them.
  const createCustodyMutation = useOdooMutation(
    (payload: Record<string, unknown>) => odooData.createCustody(payload),
    [],
  );
  const updateCustodyMutation = useOdooMutation(
    (variables: { id: string; payload: Record<string, unknown> }) =>
      odooData.updateCustody(variables.id, variables.payload),
    [],
  );
  const deleteCustodyMutation = useOdooMutation(
    (id: string) => odooData.deleteCustody(id),
    [],
  );

  const reloadCustodies = useCallback(async () => {
    if (!employeeId) return;
    setCustodiesLoading(true);
    setCustodyError(null);
    try {
      const rows = await odooData.fetchCustodies(employeeId);
      setCustodies(toCustodies(rows));
    } catch (e: unknown) {
      setCustodyError(errorMessage(e));
    } finally {
      setCustodiesLoading(false);
    }
  }, [employeeId]);

  const handleAddCustody = useCallback(async () => {
    if (!newCustody.item.trim() || !employeeId) return;
    setCustodyError(null);
    try {
      await createCustodyMutation.mutateAsync({
        employee_id: employeeId,
        item: newCustody.item.trim(),
        description: newCustody.description.trim(),
        date_received: newCustody.dateReceived || null,
        serial_number: newCustody.serialNumber.trim(),
        status: newCustody.status,
        notes: newCustody.notes.trim(),
      });
      await reloadCustodies();
      setNewCustody(emptyNewCustody());
      setShowAddCustody(false);
    } catch (e: unknown) {
      setCustodyError(errorMessage(e));
    }
  }, [newCustody, employeeId, createCustodyMutation.mutateAsync, reloadCustodies]);

  const handleCancelAddCustody = useCallback(() => {
    setShowAddCustody(false);
    setNewCustody(emptyNewCustody());
  }, []);

  const handleDeleteCustody = useCallback(async (id: string) => {
    setCustodyError(null);
    try {
      await deleteCustodyMutation.mutateAsync(id);
      await reloadCustodies();
    } catch (e: unknown) {
      setCustodyError(errorMessage(e));
    }
  }, [deleteCustodyMutation.mutateAsync, reloadCustodies]);

  // return_date is server-stamped/cleared from `status` alone (see hand-off §4)
  // — only forward it when the caller is deliberately backdating a return.
  const handleUpdateCustody = useCallback(async (id: string, patch: Partial<Pick<Custody, "status" | "returnDate">>) => {
    setCustodyError(null);
    try {
      const payload: Record<string, unknown> = {};
      if (patch.status !== undefined) payload.status = patch.status;
      if (patch.returnDate !== undefined) payload.return_date = patch.returnDate;
      await updateCustodyMutation.mutateAsync({ id, payload });
      await reloadCustodies();
    } catch (e: unknown) {
      setCustodyError(errorMessage(e));
    }
  }, [reloadCustodies, updateCustodyMutation.mutateAsync]);

  useEffect(() => {
    reloadCustodies();
  }, [reloadCustodies]);

  return {
    custodies,
    custodiesLoading,
    custodyError,
    handleAddCustody,
    handleCancelAddCustody,
    handleDeleteCustody,
    handleUpdateCustody,
    newCustody,
    reloadCustodies,
    setNewCustody,
    setShowAddCustody,
    showAddCustody,
  };
};
