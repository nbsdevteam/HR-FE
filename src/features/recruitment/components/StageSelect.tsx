import { memo } from "react";
import { ALL_STAGES, stageColors } from "../constants/recruitment";

type StageSelectProps = {
  stage: string;
  onChange: (stage: string) => void;
};

const StageSelect = ({ stage, onChange }: StageSelectProps) => (
  <select
    value={stage}
    onChange={(e) => onChange(e.target.value)}
    className={`px-2 py-0.5 rounded-md border cursor-pointer bg-transparent ${stageColors[stage] || ""}`}
    style={{ fontSize: 12 }}
  >
    {ALL_STAGES.map((s) => (
      <option key={s} value={s}>{s}</option>
    ))}
  </select>
);

export default memo(StageSelect);
