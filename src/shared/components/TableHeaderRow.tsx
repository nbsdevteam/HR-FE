import type { ReactNode } from "react";
import SortableHeaderRow from "./SortableHeader";

type TableHeaderRowProps = {
  headings: ReactNode[];
};

/** Static (non-sortable) table header row — thin wrapper around SortableHeaderRow with every column non-sortable. */
const TableHeaderRow = ({ headings }: TableHeaderRowProps) => (
  <SortableHeaderRow<string>
    columns={headings.map((label) => ({ label, key: null }))}
    sortBy=""
    sortDir="asc"
    onSort={() => {}}
  />
);

export default TableHeaderRow;
