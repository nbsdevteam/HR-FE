import { memo } from "react";
import { arabicSource } from "@/i18n/source";
import { IR_COMPONENT_LABELS } from "../constants/recruitment";
import RankBar from "./RankBar";

type IrComponentRowProps = {
  componentKey: string;
  component: { score: number; weight: number; evidence?: string };
  isOpen: boolean;
  onToggle: (key: string) => void;
};

const IrComponentRow = ({
  componentKey,
  component,
  isOpen,
  onToggle,
}: IrComponentRowProps) => (
  <div>
    <button
      onClick={() => onToggle(componentKey)}
      className="w-full text-start cursor-pointer"
    >
      <RankBar
        label={IR_COMPONENT_LABELS[componentKey] || componentKey}
        value={component.score}
        weight={`${component.weight}%`}
      />
    </button>
    {isOpen && component.evidence && (
      <p
        className="mt-1 text-muted-foreground rounded-md bg-muted/10 border border-border/20 p-2"
        style={{ fontSize: 11 }}
      >
        <span className="text-primary">
          {arabicSource("recruitment.evidence")}:{" "}
        </span>
        <span data-i18n-ignore>{component.evidence}</span>
      </p>
    )}
  </div>
);

export default memo(IrComponentRow);
