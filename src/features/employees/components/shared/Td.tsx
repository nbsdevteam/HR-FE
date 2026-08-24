import type { ReactNode } from "react";

type TdProps = {
  children: ReactNode;
  muted?: boolean;
  dir?: "ltr" | "rtl";
};

/**
 * Plain text table cell shared by ContractTableRow/DocumentTableRow/
 * ExitProcessTableRow — the same `px-4 py-3` + fontSize:13 markup was
 * duplicated verbatim across all three.
 */
const Td = ({ children, muted, dir }: TdProps) => (
  <td className={`px-4 py-3 ${muted ? "text-muted-foreground" : "text-foreground"}`} style={{ fontSize: 13 }} dir={dir}>
    {children}
  </td>
);

export default Td;
