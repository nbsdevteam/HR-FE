type DeviceInfoFieldProps = {
  label: string;
  value: string | undefined;
};

const DeviceInfoField = ({ label, value }: DeviceInfoFieldProps) => (
  <div className="space-y-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    <p className="text-sm text-foreground font-mono" dir="ltr">{value || "—"}</p>
  </div>
);

export default DeviceInfoField;
