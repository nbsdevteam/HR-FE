import { memo } from "react";
import { Select } from "@/shared/components";
import { ALL_STAGES, stageColors } from "../constants/recruitment";

type StageSelectProps = {
  stage: string;
  onChange: (stage: string) => void;
};

const StageSelect = ({ stage, onChange }: StageSelectProps) => (
  <Select
    value={stage}
    onChange={(e) => onChange(e.target.value)}
    className={`px-2 py-0.5 rounded-md border cursor-pointer bg-transparent ${stageColors[stage] || ""}`}
    style={{ fontSize: 12 }}
  >
    {ALL_STAGES.map((s) => (
      <option key={s} value={s}>{s}</option>
    ))}
  </Select>
);

export default memo(StageSelect);
