import { memo } from "react";
import { Check, Circle } from "lucide-react";
import type { PublicExitClearanceLine } from "../types/publicExitSign";

type PublicExitSignClearanceRowProps = {
  line: PublicExitClearanceLine;
};

const PublicExitSignClearanceRow = ({ line }: PublicExitSignClearanceRowProps) => (
  <li className="flex items-center gap-2" style={{ fontSize: 13 }} data-clearance-completed={line.completed}>
    {line.completed ? <Check className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
    <span className={line.completed ? "text-foreground" : "text-muted-foreground"} dir="auto">{line.item}</span>
  </li>
);

export default memo(PublicExitSignClearanceRow);
