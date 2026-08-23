import type { ReactNode } from "react";

type PolicyViewMetaFieldProps = {
  label: string;
  children: ReactNode;
};

/** One label/value cell in the policy view dialog's metadata row. */
const PolicyViewMetaField = ({ label, children }: PolicyViewMetaFieldProps) => (
  <div>
    <p className="text-muted-foreground text-sm">{label}</p>
    {children}
  </div>
);

export default PolicyViewMetaField;
