import { memo } from "react";
import { Select } from "@/shared/components";
import { ALL_STAGES, stageColors } from "../constants/recruitment";

type StageSelectProps = {
  stage: string;
  onChange: (stage: string) => void;
};

const StageSelect = ({ stage, onChange }: StageSelectProps) => {
  return (
    <Select
      value={stage}
      onChange={onChange}
      options={ALL_STAGES}
      className={`px-2 py-0.5 rounded-md border cursor-pointer bg-transparent ${stageColors[stage] || ""}`}
      style={{ fontSize: 12 }}
    />
  );
};

export default memo(StageSelect);
