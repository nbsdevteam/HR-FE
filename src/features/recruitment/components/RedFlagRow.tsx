import { memo } from "react";
import { AlertCircle } from "lucide-react";

type RedFlagRowProps = {
  detail: string;
};

const RedFlagRow = ({ detail }: RedFlagRowProps) => (
  <div className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-3 py-2">
    <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
    <span className="text-muted-foreground" style={{ fontSize: 11.5 }} data-i18n-ignore>
      {detail}
    </span>
  </div>
);

export default memo(RedFlagRow);
