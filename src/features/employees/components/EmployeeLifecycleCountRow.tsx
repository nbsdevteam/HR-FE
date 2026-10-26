type EmployeeLifecycleCountRowProps = {
  label: string;
  value: string;
};

const EmployeeLifecycleCountRow = ({ label, value }: EmployeeLifecycleCountRowProps) => (
  <li className="flex items-center justify-between text-foreground" style={{ fontSize: 13 }}>
    <span className="text-muted-foreground">{label}</span>
    <span dir="ltr">{value}</span>
  </li>
);

export default EmployeeLifecycleCountRow;
