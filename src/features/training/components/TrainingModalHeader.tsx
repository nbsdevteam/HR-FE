import { X } from "lucide-react";

interface ITrainingModalHeaderProps {
  title: string;
  onClose: () => void;
}

const TrainingModalHeader = ({ title, onClose }: ITrainingModalHeaderProps) => (
  <div className="flex items-center justify-between mb-6">
    <h2 className="text-xl text-foreground">{title}</h2>
    <button
      onClick={onClose}
      className="p-2 hover:bg-secondary rounded-lg transition-colors"
    >
      <X className="w-5 h-5 text-foreground" />
    </button>
  </div>
);

export default TrainingModalHeader;
