import { ReactNode } from "react";

function Option({ children }: { children: ReactNode }) {
  return <option>{children}</option>;
}

export default Option;
