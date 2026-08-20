import { useState } from "react";
import { type JobSkillRequirement } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { inputCls, labelCls } from "../styles";
import SkillTagChip from "./SkillTagChip";

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
            <SkillTagChip
              key={`${skill.name}-${i}`}
              skill={skill}
              weighted={weighted}
              onWeightChange={(weight) => onChange(skills.map((s, si) => (si === i ? { ...s, weight } : s)))}
              onRemove={() => onChange(skills.filter((_, si) => si !== i))}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillTagInput;
