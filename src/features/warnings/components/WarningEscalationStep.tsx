import { memo } from "react";

type TWarningEscalationStepProps = {
  type: string;
  index: number;
  isLast: boolean;
};

const WarningEscalationStep = ({
  type,
  index,
  isLast,
}: TWarningEscalationStepProps) => (
  <div className="flex items-center gap-2">
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
          index < 2
            ? "border-blue-400 bg-blue-400/10"
            : index < 4
              ? "border-red-400 bg-red-400/10"
              : "border-destructive bg-destructive/10"
        }`}
      >
        <span className="text-foreground" style={{ fontSize: 13 }}>
          {index + 1}
        </span>
      </div>
      <p
        className="text-muted-foreground mt-2 text-center"
        style={{ fontSize: 11 }}
      >
        {type}
      </p>
    </div>
    {!isLast && <div className="w-12 h-0.5 bg-border mb-6" />}
  </div>
);

export default memo(WarningEscalationStep);
