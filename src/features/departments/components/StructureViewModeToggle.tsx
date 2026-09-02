import { useCallback } from "react";
import { LayoutGrid, Network } from "lucide-react";
import { useTranslation } from "react-i18next";

export type StructureViewMode = "tree" | "cards";

type StructureViewModeToggleProps = {
  mode: StructureViewMode;
  onChange: (mode: StructureViewMode) => void;
};

/**
 * Segmented switch between the org chart and the level-banded card view.
 *
 * Local rather than the shared `Button`: the two halves share one frame and
 * only one is ever active, which the shared button's standalone shape cannot
 * express.
 */
const StructureViewModeToggle = ({ mode, onChange }: StructureViewModeToggleProps) => {
  const { t } = useTranslation();

  const handleTreeClick = useCallback((): void => {
    onChange("tree");
  }, [onChange]);

  const handleCardsClick = useCallback((): void => {
    onChange("cards");
  }, [onChange]);

  const buttonClass = (active: boolean): string =>
    `flex items-center gap-1.5 rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-card/60 p-0.5">
      <button
        type="button"
        onClick={handleTreeClick}
        aria-pressed={mode === "tree"}
        className={buttonClass(mode === "tree")}
        style={{ fontSize: 11.5 }}
      >
        <Network className="w-3.5 h-3.5" />
        {t("hierarchy.tree_view")}
      </button>
      <button
        type="button"
        onClick={handleCardsClick}
        aria-pressed={mode === "cards"}
        className={buttonClass(mode === "cards")}
        style={{ fontSize: 11.5 }}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        {t("hierarchy.card_view")}
      </button>
    </div>
  );
};

export default StructureViewModeToggle;
