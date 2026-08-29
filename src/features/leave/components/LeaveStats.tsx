import { Check, Clock, X } from "lucide-react";
import StatCard from "@/shared/components/StatCard";
import { arabicSource } from "@/i18n/source";
import { useMemo } from "react";

type LeaveStatsProps = {
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
};

const LeaveStats = ({
  pendingCount,
  approvedCount,
  rejectedCount,
}: LeaveStatsProps) => {
  const stats = useMemo(
    () => [
      {
        label: arabicSource("leave.pending_requests"),
        value: pendingCount,
        icon: Clock,
      },
      {
        label: arabicSource("leave.requests_accepted"),
        value: approvedCount,
        icon: Check,
      },
      {
        label: arabicSource("leave.requests_rejected"),
        value: rejectedCount,
        icon: X,
      },
    ],
    [pendingCount, approvedCount, rejectedCount],
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, index) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          icon={stat.icon}
          index={index}
          decoration="glow"
          hoverLift
        />
      ))}
    </div>
  );
};

export default LeaveStats;
