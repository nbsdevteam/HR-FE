import { memo } from "react";
import { motion } from "motion/react";

type DepartmentStatTileProps = {
  name: string;
  count: number;
  color: string;
  delay: number;
};

const DepartmentStatTile = ({ name, count, color, delay }: DepartmentStatTileProps) => (
  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="bg-card border border-border/60 rounded-xl p-3 text-center shadow-sm hover:shadow-md hover:border-primary/20 transition-all">
    <div className="flex items-center justify-center gap-1.5 mb-1">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <p className="text-muted-foreground truncate" style={{ fontSize: 11 }} data-i18n-ignore>{name}</p>
    </div>
    <span className="text-foreground block" style={{ fontSize: 20 }}>{count}</span>
  </motion.div>
);

export default memo(DepartmentStatTile);
