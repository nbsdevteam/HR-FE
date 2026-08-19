import type { ComponentType, ReactNode } from "react";

type FieldLabelProps = {
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
  accentColorClassName?: string;
};

const FieldLabel = ({ icon: Icon, children, accentColorClassName = "text-primary" }: FieldLabelProps) => (
  <label className="text-foreground block mb-1.5" style={{ fontSize: 12 }}>
    <span className="flex items-center gap-1.5"><Icon className={`w-3.5 h-3.5 ${accentColorClassName}`} /> {children}</span>
  </label>
);

export default FieldLabel;
