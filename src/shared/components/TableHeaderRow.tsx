import type { ReactNode } from "react";

type TableHeaderRowProps = {
  headings: ReactNode[];
};

const TableHeaderRow = ({ headings }: TableHeaderRowProps) => (
  <tr className="bg-muted/20 border-b border-border/20">
    {headings.map((heading, i) => (
      <th key={i} className="text-start px-4 py-3 text-muted-foreground" style={{ fontSize: 12 }}>{heading}</th>
    ))}
  </tr>
);

export default TableHeaderRow;
