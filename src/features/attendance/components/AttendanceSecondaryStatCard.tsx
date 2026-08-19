import { cardCls } from "../styles";

type AttendanceSecondaryStatCardProps = {
  label: string;
  value: string | number;
};

const AttendanceSecondaryStatCard = ({ label, value }: AttendanceSecondaryStatCardProps) => (
  <div className={`${cardCls} p-3`}>
    <div className="text-muted-foreground" style={{ fontSize: 10 }}>{label}</div>
    <div className="text-foreground font-mono mt-1" style={{ fontSize: 15 }}>{value}</div>
  </div>
);

export default AttendanceSecondaryStatCard;
