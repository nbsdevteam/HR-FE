type FilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
  fontSize?: number;
};

const FilterChip = ({ label, active, onClick, fontSize = 12 }: FilterChipProps) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
      active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
    }`}
    style={{ fontSize }}
  >
    {label}
  </button>
);

export default FilterChip;
