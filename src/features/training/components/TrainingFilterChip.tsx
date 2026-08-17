type TrainingFilterChipProps = {
  label: string;
  isActive: boolean;
  onClick: () => void;
};

export const TrainingFilterChip = ({ label, isActive, onClick }: TrainingFilterChipProps) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
      isActive
        ? "bg-primary text-primary-foreground"
        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
    }`}
  >
    {label}
  </button>
);
