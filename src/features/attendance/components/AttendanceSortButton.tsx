import type { AttendanceSortKey } from "../types";

type AttendanceSortButtonProps = {
  sortKey: AttendanceSortKey;
  label: string;
  active: boolean;
  onClick: (key: AttendanceSortKey) => void;
};

const AttendanceSortButton = ({ sortKey, label, active, onClick }: AttendanceSortButtonProps) => {
  const handleSortClick = (): void => {
    onClick(sortKey);
  };

  return (
    <button
      onClick={handleSortClick}
      className={`px-2 py-1 rounded transition-colors cursor-pointer ${
        active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
      style={{ fontSize: 11 }}
    >
      {label}
    </button>
  );
};

export default AttendanceSortButton;
