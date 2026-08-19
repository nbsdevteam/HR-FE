type ShortfallTableHeaderRowProps = {
  headings: string[];
};

const ShortfallTableHeaderRow = ({ headings }: ShortfallTableHeaderRowProps) => (
  <tr className="bg-muted/10 border-b border-border/20">
    {headings.map((h) => (
      <th key={h} className="text-start px-4 py-2.5 text-muted-foreground whitespace-nowrap" style={{ fontSize: 11 }}>{h}</th>
    ))}
  </tr>
);

export default ShortfallTableHeaderRow;
