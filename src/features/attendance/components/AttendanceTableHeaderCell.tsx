type AttendanceTableHeaderCellProps = {
  heading: string;
};

const AttendanceTableHeaderCell = ({ heading }: AttendanceTableHeaderCellProps) => (
  <th className="px-3 py-2.5 text-muted-foreground text-center whitespace-nowrap" style={{ fontSize: 11 }}>{heading}</th>
);

export default AttendanceTableHeaderCell;
