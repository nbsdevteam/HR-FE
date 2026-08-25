import { Trash2 } from "lucide-react";
import { Button } from "@/shared/components";

type RecordDeleteButtonProps = {
  onDelete: () => void;
};

const RecordDeleteButton = ({ onDelete }: RecordDeleteButtonProps) => (
  <Button
    variant="unstyled"
    size="unstyled"
    rounded="rounded-lg"
    onClick={onDelete}
    className="p-1.5 hover:bg-destructive/15"
    icon={Trash2}
    iconClassName="w-4 h-4 text-destructive"
  />
);

export default RecordDeleteButton;
