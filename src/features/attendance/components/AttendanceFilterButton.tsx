type AttendanceFilterButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

export function AttendanceFilterButton({ label, active, onClick }: AttendanceFilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
        active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      }`}
      style={{ fontSize: 12 }}
    >
      {label}
    </button>
  );
}
