import { X } from "lucide-react";

type WarningModalHeaderProps = {
  title: string;
  onClose: () => void;
};

const WarningModalHeader = ({ title, onClose }: WarningModalHeaderProps) => (
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-foreground">{title}</h2>
    <button onClick={onClose} className="p-1 rounded hover:bg-secondary cursor-pointer">
      <X className="w-5 h-5 text-muted-foreground" />
    </button>
  </div>
);

export default WarningModalHeader;
