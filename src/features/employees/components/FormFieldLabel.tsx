import type { ReactNode } from "react";

type FormFieldLabelProps = {
  children: ReactNode;
};

const FormFieldLabel = ({ children }: FormFieldLabelProps) => (
  <label className="text-foreground block mb-1" style={{ fontSize: 12 }}>{children}</label>
);

export default FormFieldLabel;
