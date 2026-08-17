type PublicApplyFieldProps = {
  label: string;
  required?: boolean;
  children: React.ReactNode;
};

export const PublicApplyField = ({ label, required, children }: PublicApplyFieldProps) => (
  <div>
    <label className="text-muted-foreground block mb-1.5" style={{ fontSize: 12 }}>
      {label}{required && <span className="text-destructive"> *</span>}
    </label>
    {children}
  </div>
);
