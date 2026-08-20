import { memo } from "react";
import { motion } from "motion/react";
import { Download, Eye } from "lucide-react";
import { type DbApplicant } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import IrBadge from "./IrBadge";
import StageSelect from "./StageSelect";

type AiScreeningTableRowProps = {
  app: DbApplicant;
  index: number;
  onSelect: (a: DbApplicant) => void;
  onUpdateStage: (id: string, stage: string) => void;
};

const AiScreeningTableRow = ({ app, index, onSelect, onUpdateStage }: AiScreeningTableRowProps) => (
  <motion.tr
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.02 }}
    className="border-b border-border/20 hover:bg-muted/10 transition-colors"
  >
    <td className="px-4 py-3">
      {app.rank ? (
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
            app.rank <= 3 ? "bg-primary/20 text-primary border border-primary/40" : "text-muted-foreground"
          }`}
          style={{ fontSize: 12 }}
          dir="ltr"
        >
          {app.rank}
        </span>
      ) : <span className="text-muted-foreground">—</span>}
    </td>
    <td className="px-4 py-3">
      <button onClick={() => onSelect(app)} className="text-start cursor-pointer hover:text-primary transition-colors">
        <span className="text-foreground block">{app.name}</span>
        {app.email && <span className="text-muted-foreground block" style={{ fontSize: 11 }} dir="ltr">{app.email}</span>}
      </button>
    </td>
    <td className="px-4 py-3"><IrBadge applicant={app} /></td>
    <td className="px-4 py-3">
      <div className="flex flex-wrap gap-1 max-w-[240px]">
        {(app.matched_skills || []).slice(0, 3).map((skill, si) => (
          <span key={si} className="px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400" style={{ fontSize: 10 }}>
            {skill}
          </span>
        ))}
        {(app.matched_skills?.length || 0) > 3 && (
          <span className="px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground" style={{ fontSize: 10 }}>
            +{(app.matched_skills?.length || 0) - 3}
          </span>
        )}
      </div>
    </td>
    <td className="px-4 py-3">
      <StageSelect stage={app.stage} onChange={(stage) => onUpdateStage(app.id, stage)} />
    </td>
    <td className="px-4 py-3">
      <div className="flex items-center gap-1">
        {app.resume_url && (
          <a href={app.resume_url} target="_blank" rel="noopener noreferrer"
            className="p-1 rounded hover:bg-primary/10 text-primary" title={arabicSource("recruitment.download_cv_2")}>
            <Download className="w-3.5 h-3.5" />
          </a>
        )}
        <button onClick={() => onSelect(app)}
          className="p-1 rounded hover:bg-primary/10 text-muted-foreground cursor-pointer"
          title={arabicSource("common.show_details")}>
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>
    </td>
  </motion.tr>
);

export default memo(AiScreeningTableRow);
