import { Command } from "cmdk";
import type { CommandDefinition, CommandGroupId } from "./commands/types";
import CommandPaletteItem from "./CommandPaletteItem";

type CommandPaletteGroupProps = {
  groupId: CommandGroupId;
  heading?: string;
  commands: CommandDefinition[];
  onSelect: (command: CommandDefinition) => void;
};

const CommandPaletteGroup = ({ groupId, heading, commands, onSelect }: CommandPaletteGroupProps) => {
  if (commands.length === 0) return null;

  return (
    <Command.Group
      value={groupId}
      heading={heading}
      className="px-1 py-2 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide"
      style={{ fontSize: 11 }}
    >
      {commands.map((command) => (
        <CommandPaletteItem key={command.id} command={command} onSelect={onSelect} />
      ))}
    </Command.Group>
  );
};

export default CommandPaletteGroup;
