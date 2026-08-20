import TableHeaderCell from "./TableHeaderCell";

type ShortfallTableHeaderRowProps = {
  headings: string[];
};

const ShortfallTableHeaderRow = ({
  headings,
}: ShortfallTableHeaderRowProps) => (
  <tr className="bg-muted/10 border-b border-border/20">
    {headings.map((h) => (
      <TableHeaderCell key={h}>{h}</TableHeaderCell>
    ))}
  </tr>
);

export default ShortfallTableHeaderRow;
