import { useState, useCallback, type Dispatch, type SetStateAction } from "react";
import type { Attachment, Employee } from "../types";

const todayStr = () => new Date().toISOString().split("T")[0];

type NewAttachment = { name: string; type: string };

const emptyNewAttachment = (): NewAttachment => ({ name: "", type: "PDF" });

export const useEmployeeAttachmentForm = (setEditData: Dispatch<SetStateAction<Employee>>) => {
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [newAttachment, setNewAttachment] = useState<NewAttachment>(emptyNewAttachment());

  const handleAddAttachment = useCallback(() => {
    if (!newAttachment.name.trim()) return;
    setEditData(prev => {
      const nextId = prev.attachments.length > 0 ? Math.max(...prev.attachments.map(a => a.id)) + 1 : 1;
      const att: Attachment = {
        id: nextId,
        name: newAttachment.name.trim(),
        type: newAttachment.type,
        date: todayStr(),
      };
      return { ...prev, attachments: [...prev.attachments, att] };
    });
    setNewAttachment(emptyNewAttachment());
    setShowAddAttachment(false);
  }, [newAttachment, setEditData]);

  const handleCancelAddAttachment = useCallback(() => {
    setShowAddAttachment(false);
    setNewAttachment(emptyNewAttachment());
  }, []);

  const handleDeleteAttachment = useCallback((id: number) => {
    setEditData(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== id) }));
  }, [setEditData]);

  return {
    handleAddAttachment,
    handleCancelAddAttachment,
    handleDeleteAttachment,
    newAttachment,
    setNewAttachment,
    setShowAddAttachment,
    showAddAttachment,
  };
};
