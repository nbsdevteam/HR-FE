type PublicApplyInputProps = {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  dir?: string;
};

const PublicApplyInput = ({ value, onChange, type = "text", dir }: PublicApplyInputProps) => (
  <input
    type={type}
    value={value}
    dir={dir}
    onChange={(event) => onChange(event.target.value)}
    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
    style={{ fontSize: 14 }}
  />
);

export default PublicApplyInput;
