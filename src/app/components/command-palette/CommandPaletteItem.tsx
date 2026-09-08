import { useCallback } from "react";
import { Command } from "cmdk";
import type { CommandDefinition } from "./commands/types";

type CommandPaletteItemProps = {
  command: CommandDefinition;
  onSelect: (command: CommandDefinition) => void;
};

const CommandPaletteItem = ({ command, onSelect }: CommandPaletteItemProps) => {
  const Icon = command.icon;

  const handleSelect = useCallback((): void => {
    onSelect(command);
  }, [onSelect, command]);

  return (
    <Command.Item
      value={[command.label, ...(command.keywords ?? [])].join(" ")}
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
