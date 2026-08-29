type PublicApplyInputProps = {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  dir?: string;
};

const PublicApplyInput = ({ value, onChange, type = "text", dir }: PublicApplyInputProps) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.value);
  };

  return (
  <input
    type={type}
    value={value}
    dir={dir}
    onChange={handleChange}
    className="w-full px-4 py-3 rounded-lg border border-border bg-input-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring outline-none"
    style={{ fontSize: 14 }}
  />
  );
};

export default PublicApplyInput;
