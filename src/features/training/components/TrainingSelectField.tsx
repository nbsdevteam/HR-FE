import { fieldCls } from "../styles";

type TrainingSelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
};

const TrainingSelectField = ({ label, value, onChange, options }: TrainingSelectFieldProps) => (
  <div>
    <label className="block text-sm text-foreground mb-2">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className={fieldCls}>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default TrainingSelectField;
