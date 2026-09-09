import { useCallback, useMemo } from "react";
import { Command } from "cmdk";
import { translateCataloguedValue } from "@/i18n/legacy";
import type { CommandDefinition } from "./commands/types";

type CommandPaletteItemProps = {
  command: CommandDefinition;
  onSelect: (command: CommandDefinition) => void;
};

const CommandPaletteItem = ({ command, onSelect }: CommandPaletteItemProps) => {
  const Icon = command.icon;

  // `command.label` is always the Arabic source string — carry its English and
  // Kurdish translations too, so a query in any of the three languages matches
  // regardless of which language the palette is currently displayed in.
  const searchKeywords = useMemo(
    () => [
      command.label,
      translateCataloguedValue(command.label, "en"),
      translateCataloguedValue(command.label, "ku"),
      ...(command.keywords ?? []),
    ],
    [command.label, command.keywords],
  );

  const handleSelect = useCallback((): void => {
    onSelect(command);
  }, [onSelect, command]);

  return (
    <Command.Item
      value={command.id}
      keywords={searchKeywords}
      onSelect={handleSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-foreground data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate" style={{ fontSize: 13 }}>
        {command.label}
      </span>
    </Command.Item>
  );
};

export default CommandPaletteItem;
