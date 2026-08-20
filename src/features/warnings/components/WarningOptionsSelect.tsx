type WarningOptionsSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  blankLabel: string;
  className: string;
};

const WarningOptionsSelect = ({ value, onChange, options, blankLabel, className }: WarningOptionsSelectProps) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} className={className}>
    <option value="">{blankLabel}</option>
    {options.map((opt) => (
      <option key={opt} value={opt}>{opt}</option>
    ))}
  </select>
);

export default WarningOptionsSelect;
