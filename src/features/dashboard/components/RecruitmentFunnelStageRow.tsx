import { motion } from "motion/react";

type RecruitmentFunnelStageRowProps = {
  stage: { name: string; value: number; color: string };
  width: number;
  conversionPct: number | null;
  index: number;
};

const RecruitmentFunnelStageRow = ({ stage, width, conversionPct, index }: RecruitmentFunnelStageRowProps) => (
  <div className="flex items-center gap-3">
    <span className="text-sm text-muted-foreground w-24 flex-shrink-0">{stage.name}</span>
    <div className="flex-1 relative">
      <div className="h-8 rounded-lg bg-muted/20 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ delay: index * 0.1, duration: 0.5 }}
          className="h-full rounded-lg flex items-center justify-end pe-2"
          style={{ backgroundColor: stage.color + "30", borderLeft: `3px solid ${stage.color}` }}
        >
          <span className="text-xs font-medium text-foreground">{stage.value}</span>
        </motion.div>
      </div>
    </div>
    {conversionPct !== null && (
      <span className="text-xs text-muted-foreground w-12 text-center">
        {conversionPct}%
      </span>
    )}
  </div>
);

export default RecruitmentFunnelStageRow;
