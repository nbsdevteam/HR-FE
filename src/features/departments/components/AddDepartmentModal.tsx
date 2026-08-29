import { useState, useCallback } from "react";
import { Building2, Plus } from "lucide-react";
import { Modal, ModalFooterActions } from "@/shared/components";
import { arabicSource } from "@/i18n/source";
import { avatarColors } from "../styles";
import { pickUniqueColor } from "../utils/hierarchyTree";
import ColorSwatchButton from "./ColorSwatchButton";
import FieldLabel from "./FieldLabel";
import LabeledTextField from "./LabeledTextField";

type AddDepartmentModalProps = {
  departmentColors: Record<string, string>;
  onAdd: (name: string, color: string) => void;
  onClose: () => void;
};

const AddDepartmentModal = ({
  departmentColors,
  onAdd,
  onClose,
}: AddDepartmentModalProps) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState(() =>
    pickUniqueColor(new Set(Object.values(departmentColors))),
  );
  const [nameError, setNameError] = useState(false);

  const availableColors = avatarColors
    .filter((c) => !Object.values(departmentColors).includes(c))
    .slice(0, 8);

  const handleNameChange = useCallback((value: string): void => {
    setName(value);
    setNameError(false);
  }, []);

  const handleColorSelect = useCallback((c: string): void => {
    setColor(c);
  }, []);

  const handleSubmit = useCallback((): void => {
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    onAdd(name.trim(), color);
    onClose();
  }, [name, color, onAdd, onClose]);

  return (
    <Modal
      onClose={onClose}
      overlayClassName="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      contentClassName="bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden w-full max-w-md mx-4"
      contentMotionProps={{
        initial: { opacity: 0, scale: 0.92, y: 20 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.92, y: 20 },
        transition: { type: "spring", stiffness: 400, damping: 30 },
      }}
      icon={Building2}
      title={arabicSource("hierarchy.add_a_new_section")}
      footer={
        <ModalFooterActions
          onCancel={onClose}
          onConfirm={handleSubmit}
          confirmLabel={arabicSource("hierarchy.add_a_new_section")}
          confirmIcon={Plus}
        />
      }
    >
      <LabeledTextField
        icon={Building2}
        label={arabicSource("common.section")}
        value={name}
        onChange={handleNameChange}
        placeholder={arabicSource("hierarchy.name_of_the_new_section")}
        error={nameError}
        errorMessage={arabicSource("hierarchy.please_enter_the_department_name")}
      />

      <div>
        <FieldLabel>{arabicSource("hierarchy.section_color")}</FieldLabel>
        <div className="flex items-center gap-2 flex-wrap">
          {availableColors.map((c) => (
            <ColorSwatchButton
              key={c}
              color={c}
              selected={color === c}
              onSelect={handleColorSelect}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default AddDepartmentModal;
