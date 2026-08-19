import { Trash2 } from "lucide-react";

type RecordDeleteButtonProps = {
  onDelete: () => void;
};

const RecordDeleteButton = ({ onDelete }: RecordDeleteButtonProps) => (
  <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-destructive/15 cursor-pointer transition-colors">
    <Trash2 className="w-4 h-4 text-destructive" />
  </button>
);

export default RecordDeleteButton;
