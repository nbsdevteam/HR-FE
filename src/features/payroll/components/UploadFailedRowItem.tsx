import type { AttendanceImportFailure } from "../hooks/useAttendanceImport";

type UploadFailedRowItemProps = {
  failure: AttendanceImportFailure;
};

const UploadFailedRowItem = ({ failure }: UploadFailedRowItemProps) => (
  <li className="text-destructive/80 ps-4" style={{ fontSize: 12 }}>
    • {failure.employeeName} · {failure.date}: {failure.error}
  </li>
);

export default UploadFailedRowItem;
