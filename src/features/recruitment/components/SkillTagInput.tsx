import { useState } from "react";
import { X } from "lucide-react";
import { type JobSkillRequirement } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { inputCls, labelCls } from "../styles";

const SkillTagInput = ({ label, skills, onChange, weighted = false }: {
  label: string;
  skills: JobSkillRequirement[];
  onChange: (skills: JobSkillRequirement[]) => void;
  weighted?: boolean;
}) => {
  const [draft, setDraft] = useState("");

  const add = () => {
    const name = draft.trim();
    if (!name || skills.some(s => s.name.toLowerCase() === name.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...skills, { name, weight: weighted ? 2 : 1 }]);
    setDraft("");
  };

  return (
    <div>
      <label className={labelCls} style={{ fontSize: 12 }}>{label}</label>
      <input
        type="text"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={arabicSource("recruitment.add_skill")}
        className={inputCls}
      />
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {skills.map((skill, i) => (
            <span key={`${skill.name}-${i}`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border/40 bg-muted/20 text-foreground"
              style={{ fontSize: 11 }}>
              {skill.name}
              {weighted && (
                <select
                  value={skill.weight || 2}
                  onChange={e => onChange(skills.map((s, si) =>
                    si === i ? { ...s, weight: Number(e.target.value) } : s))}
                  className="bg-transparent text-primary cursor-pointer outline-none"
                  style={{ fontSize: 10 }}
                  dir="ltr"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              )}
              <button type="button" onClick={() => onChange(skills.filter((_, si) => si !== i))}
                className="text-destructive cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillTagInput;
