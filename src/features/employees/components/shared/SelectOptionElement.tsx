type SelectOptionElementProps = {
  value: string;
  label: string;
};

const SelectOptionElement = ({ value, label }: SelectOptionElementProps) => (
  <option value={value}>{label}</option>
);

export default SelectOptionElement;
