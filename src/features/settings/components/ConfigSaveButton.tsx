import { arabicSource } from "@/i18n/source";

type ConfigSaveButtonProps = {
  onSave: () => void;
};

/**
 * The small green "save" affordance that appears once a configuration row has
 * an unsaved edit — one copy instead of the three the row used to inline.
 */
const ConfigSaveButton = ({ onSave }: ConfigSaveButtonProps) => (
  <button
    onClick={onSave}
    className="px-2 py-1 bg-green-600/20 border border-green-500/50 text-green-400 rounded text-xs hover:bg-green-600/30 cursor-pointer"
  >
    {arabicSource("common.save")}
  </button>
);

export default ConfigSaveButton;
