import { useState } from "react";
import { type JobSkillRequirement } from "@/shared/hooks";
import { arabicSource } from "@/i18n/source";
import { inputCls, labelCls } from "../styles";
import SkillTagChip from "./SkillTagChip";

interface SkillTagInputProps {
  label: string;
  skills: JobSkillRequirement[];
  onChange: (skills: JobSkillRequirement[]) => void;
  weighted?: boolean;
}

const SkillTagInput = ({
  label,
  skills,
  onChange,
  weighted = false,
}: SkillTagInputProps) => {
  const [draft, setDraft] = useState("");

  const add = () => {
    const name = draft.trim();
    if (
      !name ||
      skills.some((s) => s.name.toLowerCase() === name.toLowerCase())
    ) {
      setDraft("");
      return;
    }
    onChange([...skills, { name, weight: weighted ? 2 : 1 }]);
    setDraft("");
  };

  const handleDraftChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setDraft(e.target.value);
  };

  const handleDraftKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  const handleSkillWeightChange =
    (index: number) =>
    (weight: number): void => {
      onChange(skills.map((s, si) => (si === index ? { ...s, weight } : s)));
    };

  const handleSkillRemove = (index: number) => (): void => {
    onChange(skills.filter((_, si) => si !== index));
  };

  return (
    <div>
      <label className={labelCls} style={{ fontSize: 12 }}>
        {label}
      </label>
      <input
        type="text"
        value={draft}
        onChange={handleDraftChange}
        onKeyDown={handleDraftKeyDown}
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
              onWeightChange={handleSkillWeightChange(i)}
              onRemove={handleSkillRemove(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillTagInput;
