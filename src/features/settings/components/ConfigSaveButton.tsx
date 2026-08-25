import { arabicSource } from "@/i18n/source";
import { Button } from "@/shared/components";

type ConfigSaveButtonProps = {
  onSave: () => void;
};

/**
 * The small green "save" affordance that appears once a configuration row has
 * an unsaved edit — one copy instead of the three the row used to inline.
 */
const ConfigSaveButton = ({ onSave }: ConfigSaveButtonProps) => (
  <Button
    variant="unstyled"
    size="unstyled"
    rounded="rounded"
    onClick={onSave}
    className="px-2 py-1 bg-green-600/20 border border-green-500/50 text-green-400 text-xs hover:bg-green-600/30"
  >
    {arabicSource("common.save")}
  </Button>
);

export default ConfigSaveButton;
