import { motion } from "motion/react";
import { evaluationCycles, ratingScale } from "../types";
import { evaluationCardClass } from "../styles";
import { renderStars } from "../utils/evaluationHelpers";
import { arabicSource } from "@/i18n/source";

const EvaluationInfoCards = () => (
  <>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${evaluationCardClass} p-6`}>
      <h3 className="text-foreground mb-2">{arabicSource("evaluation.how_does_the_evaluation_system_work")}</h3>
      <p className="text-muted-foreground mb-4" style={{ fontSize: 13 }}>
        {arabicSource("evaluation.the_line_manager_depending_on_the_organizational_structure_is_re")}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {evaluationCycles.map(cycle => {
          const Icon = cycle.icon;
          return (
            <div key={cycle.value} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-border/20">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-foreground" style={{ fontSize: 13 }}>{cycle.value}</p>
                <p className="text-muted-foreground" style={{ fontSize: 10 }}>{cycle.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={`${evaluationCardClass} p-6`}>
      <h3 className="text-foreground mb-4">{arabicSource("evaluation.five_point_rating_scale")}</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {ratingScale.map(scale => (
          <div key={scale.value} className={`p-3 rounded-lg border ${scale.bgColor} text-center`}>
            <div className="flex justify-center mb-2">{renderStars(scale.value)}</div>
            <p className="text-foreground" style={{ fontSize: 13 }}>{scale.label}</p>
            <p className="text-muted-foreground" style={{ fontSize: 11 }}>{scale.labelEn}</p>
          </div>
        ))}
      </div>
    </motion.div>
  </>
);

export default EvaluationInfoCards;
