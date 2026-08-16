import type { ExcuseForm } from "../types";

type ExcuseToggleRowProps = {
  item: {
    key: keyof Omit<ExcuseForm, "note">;
    label: string;
    desc: string;
  };
  checked: boolean;
  onToggle: (key: keyof Omit<ExcuseForm, "note">) => void;
};

export function ExcuseToggleRow({ item, checked, onToggle }: ExcuseToggleRowProps) {
  return (
    <label className="flex items-center justify-between p-3 rounded-xl border border-border/30 hover:border-primary/30 transition-colors cursor-pointer">
      <div>
        <p className="text-foreground" style={{ fontSize: 13 }}>{item.label}</p>
        <p className="text-muted-foreground" style={{ fontSize: 11 }}>{item.desc}</p>
      </div>
      <div
        className={`w-11 h-6 rounded-full cursor-pointer transition-colors relative ${checked ? "bg-emerald-500" : "bg-muted"}`}
        onClick={() => onToggle(item.key)}
      >
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? "start-5" : "start-0.5"}`} />
      </div>
    </label>
  );
}
