import { Command } from "cmdk";
import { arabicSource } from "@/i18n/source";

const CommandPaletteEmpty = () => (
  <Command.Empty className="px-3 py-6 text-center text-muted-foreground" style={{ fontSize: 13 }}>
    {arabicSource("common.no_results_found")}
  </Command.Empty>
);

export default CommandPaletteEmpty;
