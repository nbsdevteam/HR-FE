import type { ReactNode } from "react";

const TableHeaderCell = ({ children }: { children: ReactNode }) => (
  <th
    className="text-start px-4 py-2.5 text-muted-foreground whitespace-nowrap"
    style={{ fontSize: 11 }}
  >
    {children}
  </th>
);

export default TableHeaderCell;
