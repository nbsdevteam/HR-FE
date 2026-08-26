import { useState, useCallback, type Dispatch, type SetStateAction } from "react";
import type { Custody, Employee } from "../types";

const todayStr = () => new Date().toISOString().split("T")[0];

type NewCustody = { item: string; description: string; dateReceived: string; serialNumber: string };

const emptyNewCustody = (): NewCustody => ({
  item: "", description: "", dateReceived: todayStr(), serialNumber: "",
});

export const useEmployeeCustodyForm = (setEditData: Dispatch<SetStateAction<Employee>>) => {
  const [showAddCustody, setShowAddCustody] = useState(false);
  const [newCustody, setNewCustody] = useState<NewCustody>(emptyNewCustody());

  const handleAddCustody = useCallback(() => {
    if (!newCustody.item.trim()) return;
    setEditData(prev => {
      const nextId = prev.custodies.length > 0 ? Math.max(...prev.custodies.map(c => c.id)) + 1 : 1;
      const custody: Custody = {
        id: nextId,
        item: newCustody.item.trim(),
        description: newCustody.description.trim(),
        dateReceived: newCustody.dateReceived,
        ...(newCustody.serialNumber.trim() ? { serialNumber: newCustody.serialNumber.trim() } : {}),
      };
      return { ...prev, custodies: [...prev.custodies, custody] };
    });
    setNewCustody(emptyNewCustody());
    setShowAddCustody(false);
  }, [newCustody, setEditData]);

  const handleCancelAddCustody = useCallback(() => {
    setShowAddCustody(false);
    setNewCustody(emptyNewCustody());
  }, []);

  const handleDeleteCustody = useCallback((id: number) => {
    setEditData(prev => ({ ...prev, custodies: prev.custodies.filter(c => c.id !== id) }));
  }, [setEditData]);

  return {
    handleAddCustody,
    handleCancelAddCustody,
    handleDeleteCustody,
    newCustody,
    setNewCustody,
    setShowAddCustody,
    showAddCustody,
  };
};
