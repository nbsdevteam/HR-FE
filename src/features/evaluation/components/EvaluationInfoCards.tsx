import { memo } from "react";
import { motion } from "motion/react";
import { arabicSource } from "@/i18n/source";
import { evaluationCycles, ratingScale } from "../types";
import { evaluationCardClass } from "../styles";
import EvaluationCycleCard from "./EvaluationCycleCard";
import RatingScaleCard from "./RatingScaleCard";

const EvaluationInfoCards = () => (
  <>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${evaluationCardClass} p-6`}>
      <h2 className="text-foreground mb-2">{arabicSource("evaluation.how_does_the_evaluation_system_work")}</h2>
      <p className="text-muted-foreground mb-4" style={{ fontSize: 13 }}>
        {arabicSource("evaluation.the_line_manager_depending_on_the_organizational_structure_is_re")}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {evaluationCycles.map(cycle => (
          <EvaluationCycleCard
            key={cycle.value}
            value={cycle.value}
            label={cycle.label}
            icon={cycle.icon}
          />
        ))}
      </div>
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={`${evaluationCardClass} p-6`}>
      <h2 className="text-foreground mb-4">{arabicSource("evaluation.five_point_rating_scale")}</h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {ratingScale.map(scale => (
          <RatingScaleCard
            key={scale.value}
            value={scale.value}
            label={scale.label}
            labelEn={scale.labelEn}
            bgColor={scale.bgColor}
          />
        ))}
      </div>
    </motion.div>
  </>
);

export default memo(EvaluationInfoCards);
